import type { HelpCandidate, HelpRepository } from './contracts'
import type { HelpEmbeddingProvider, HelpRerankProvider } from './providers'

const RETRIEVAL_LIMIT = 40
const RERANK_LIMIT = 20

export type HelpMatchingFallback =
  | 'embedding_unavailable'
  | 'embedding_failed'
  | 'vector_retrieval_failed'
  | 'reranker_unavailable'
  | 'reranker_failed'

export type RankedHelpCandidate = HelpCandidate & {
  deterministicScore: number
  rerankScore: number | null
  finalScore: number
}

export type HelpMatchingResult = {
  candidates: RankedHelpCandidate[]
  diagnostics: {
    retrievedCount: number
    rerankedCount: number
    fallbacks: HelpMatchingFallback[]
  }
}

export type FindHelpCandidatesInput = {
  membershipId: string
  question: string
  limit?: number
  signal: AbortSignal
}

export type HelpMatchingDependencies = {
  repository: Pick<HelpRepository, 'searchCandidates'>
  embeddings: HelpEmbeddingProvider | null
  reranker: HelpRerankProvider | null
}

export async function findHelpCandidates(
  input: FindHelpCandidatesInput,
  dependencies: HelpMatchingDependencies,
): Promise<HelpMatchingResult> {
  const question = input.question.trim()
  const limit = Math.min(10, Math.max(1, input.limit ?? 10))
  const fallbacks: HelpMatchingFallback[] = []
  if (!question) return emptyResult(fallbacks)

  const lexicalCandidates = await dependencies.repository.searchCandidates({
    membershipId: input.membershipId,
    question,
    queryEmbedding: null,
    limit: RETRIEVAL_LIMIT,
  })
  if (lexicalCandidates.length === 0) return emptyResult(fallbacks)

  let candidates = lexicalCandidates
  if (!dependencies.embeddings) {
    fallbacks.push('embedding_unavailable')
  } else {
    try {
      const embedding = await dependencies.embeddings.embedQuery(question, input.signal)
      if (embedding.length === 0 || embedding.some((value) => !Number.isFinite(value))) {
        fallbacks.push('embedding_failed')
      } else {
        try {
          const semanticCandidates = await dependencies.repository.searchCandidates({
            membershipId: input.membershipId,
            question,
            queryEmbedding: `[${embedding.join(',')}]`,
            limit: RETRIEVAL_LIMIT,
          })
          candidates = mergeCandidates(lexicalCandidates, semanticCandidates)
        } catch {
          fallbacks.push('vector_retrieval_failed')
        }
      }
    } catch {
      fallbacks.push('embedding_failed')
    }
  }

  let ranked = candidates
    .map((candidate) => rankDeterministically(question, candidate))
    .filter((candidate) => hasDisplayEvidence(candidate))
    .sort(compareCandidates)

  let rerankedCount = 0
  if (!dependencies.reranker) {
    fallbacks.push('reranker_unavailable')
  } else if (ranked.length > 0) {
    const rerankPool = ranked.slice(0, RERANK_LIMIT)
    try {
      const results = await dependencies.reranker.rerank(
        question,
        rerankPool.map((candidate) => ({
          candidateId: candidate.membershipId,
          evidence: displayEvidence(candidate),
        })),
        input.signal,
      )
      const allowedIds = new Set(rerankPool.map((candidate) => candidate.membershipId))
      const rerankScores = new Map(
        results
          .filter((result) => allowedIds.has(result.candidateId) && Number.isFinite(result.score))
          .map((result) => [result.candidateId, clamp(result.score)]),
      )
      rerankedCount = rerankScores.size
      ranked = ranked
        .map((candidate) => {
          const rerankScore = rerankScores.get(candidate.membershipId) ?? null
          return {
            ...candidate,
            rerankScore,
            finalScore:
              rerankScore === null
                ? candidate.deterministicScore
                : candidate.deterministicScore * 0.35 + rerankScore * 0.65,
          }
        })
        .sort(compareCandidates)
    } catch {
      fallbacks.push('reranker_failed')
    }
  }

  return {
    candidates: ranked.slice(0, limit),
    diagnostics: {
      retrievedCount: candidates.length,
      rerankedCount,
      fallbacks,
    },
  }
}

export function rankDeterministically(
  question: string,
  candidate: HelpCandidate,
): RankedHelpCandidate {
  const normalizedQuestion = normalize(question)
  const topicScore = candidate.topics.some((topic) => normalizedQuestion.includes(normalize(topic)))
    ? 1
    : 0
  const lexicalScore = candidate.lexicalScore / (1 + Math.max(0, candidate.lexicalScore))
  const semanticScore = clamp(candidate.semanticScore)
  const evidenceScore = candidate.evidenceChunkIds.length > 0 ? 1 : 0
  const deterministicScore =
    topicScore * 0.35 + lexicalScore * 0.25 + semanticScore * 0.3 + evidenceScore * 0.1
  return {
    ...candidate,
    deterministicScore,
    rerankScore: null,
    finalScore: deterministicScore,
  }
}

function emptyResult(fallbacks: HelpMatchingFallback[]): HelpMatchingResult {
  return {
    candidates: [],
    diagnostics: { retrievedCount: 0, rerankedCount: 0, fallbacks },
  }
}

function mergeCandidates(
  lexicalCandidates: readonly HelpCandidate[],
  semanticCandidates: readonly HelpCandidate[],
): HelpCandidate[] {
  const merged = new Map(lexicalCandidates.map((candidate) => [candidate.membershipId, candidate]))
  for (const candidate of semanticCandidates) {
    const existing = merged.get(candidate.membershipId)
    if (!existing) {
      merged.set(candidate.membershipId, candidate)
      continue
    }
    merged.set(candidate.membershipId, {
      ...existing,
      topics: unique([...existing.topics, ...candidate.topics]),
      lexicalScore: Math.max(existing.lexicalScore, candidate.lexicalScore),
      semanticScore: Math.max(existing.semanticScore, candidate.semanticScore),
      evidenceChunkIds: unique([...existing.evidenceChunkIds, ...candidate.evidenceChunkIds]),
    })
  }
  return Array.from(merged.values())
}

function hasDisplayEvidence(candidate: RankedHelpCandidate): boolean {
  return candidate.deterministicScore >= 0.12
}

function displayEvidence(candidate: RankedHelpCandidate): string[] {
  return unique([
    candidate.matchReason,
    ...candidate.topics.map((topic) => `Can speak to ${topic}`),
  ])
}

function compareCandidates(a: RankedHelpCandidate, b: RankedHelpCandidate): number {
  return b.finalScore - a.finalScore || a.membershipId.localeCompare(b.membershipId)
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function unique<T>(values: readonly T[]): T[] {
  return Array.from(new Set(values))
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value))
}

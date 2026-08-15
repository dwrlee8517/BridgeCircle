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
  | 'provider_limited'

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
  authorizeProviderUse?: () => Promise<boolean>
}

export type MemberHelpMatchingDependencies = Omit<
  HelpMatchingDependencies,
  'repository' | 'authorizeProviderUse'
> & {
  repository: Pick<HelpRepository, 'searchCandidates' | 'consumeAiBudget'>
}

/**
 * Member-initiated candidate search is the only synchronous matching path that
 * can spend provider budget. Keep that policy in the domain boundary so HTTP
 * callers cannot accidentally bypass or misread the atomic database result.
 */
export function findMemberHelpCandidates(
  input: FindHelpCandidatesInput,
  dependencies: MemberHelpMatchingDependencies,
): Promise<HelpMatchingResult> {
  return findHelpCandidates(input, {
    ...dependencies,
    authorizeProviderUse: async () => {
      const budget = await dependencies.repository.consumeAiBudget('candidate_search')
      return budget.status === 'allowed'
    },
  })
}

export async function findHelpCandidates(
  input: FindHelpCandidatesInput,
  dependencies: HelpMatchingDependencies,
): Promise<HelpMatchingResult> {
  const question = input.question.trim()
  const limit = Math.min(5, Math.max(1, input.limit ?? 5))
  const fallbacks: HelpMatchingFallback[] = []
  if (!question) return emptyResult(fallbacks)

  const lexicalCandidates = await dependencies.repository.searchCandidates({
    membershipId: input.membershipId,
    question,
    queryEmbedding: null,
    limit: RETRIEVAL_LIMIT,
  })
  if (lexicalCandidates.length === 0) return emptyResult(fallbacks)

  const hasProvider = Boolean(dependencies.embeddings || dependencies.reranker)
  let providerUseAllowed = !hasProvider
  if (hasProvider && dependencies.authorizeProviderUse) {
    providerUseAllowed = await dependencies.authorizeProviderUse()
  }
  if (hasProvider && !providerUseAllowed) fallbacks.push('provider_limited')

  let candidates = lexicalCandidates
  if (!providerUseAllowed) {
    // Keep the permission-gated lexical result useful without spending more.
  } else if (!dependencies.embeddings) {
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
    .sort(compareCandidates)

  let rerankedCount = 0
  if (!providerUseAllowed) {
    // The deterministic rank below is the bounded fallback.
  } else if (!dependencies.reranker) {
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

// SQL owns scoring and the display rule (see the deterministic-baseline
// migration): the deterministic rank is the RPC's score, passed through. This
// function stays as the seam a future rerank stage blends against.
export function rankDeterministically(
  _question: string,
  candidate: HelpCandidate,
): RankedHelpCandidate {
  return {
    ...candidate,
    deterministicScore: candidate.score,
    rerankScore: null,
    finalScore: candidate.score,
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
      score: Math.max(existing.score, candidate.score),
      matchedFields: unique([...existing.matchedFields, ...candidate.matchedFields]),
    })
  }
  return Array.from(merged.values())
}

function displayEvidence(candidate: RankedHelpCandidate): string[] {
  return unique([
    candidate.matchReason,
    ...candidate.topics.map((topic) => `Can speak to ${topic}`),
  ])
}

// Score only, deliberately no id tiebreak: Array.sort is stable, so equal
// scores keep the SQL row order — which encodes the real tiebreaks (pending
// load, profile recency, membership id). An id tiebreak here would silently
// invert the load-spreading order for tied candidates (caught by the golden
// unit case tiebreak-interview-twins).
function compareCandidates(a: RankedHelpCandidate, b: RankedHelpCandidate): number {
  return b.finalScore - a.finalScore
}

function unique<T>(values: readonly T[]): T[] {
  return Array.from(new Set(values))
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value))
}

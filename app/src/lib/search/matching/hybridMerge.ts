import 'server-only'
import type { SearchHit } from '../searchAlumni'
import type { VectorEvidence } from './vectorRetrieval'

export type RetrievalSource = 'structured' | 'lexical' | 'vector'

export type HybridCandidate = {
  hit: SearchHit
  sources: Set<RetrievalSource>
  rawEvidence: string[]
  syntheticEvidence: string[]
  vectorScore: number
  warmScore: number
  preRerankScore: number
  rerankScore: number | null
  finalScore: number
}

export function mergeHybridCandidates(input: {
  structuredHits: SearchHit[]
  lexicalHits: SearchHit[]
  allHydratedHits: SearchHit[]
  vectorEvidence: VectorEvidence[]
}): HybridCandidate[] {
  const hitById = new Map(input.allHydratedHits.map((hit) => [hit.userId, hit]))
  for (const hit of input.structuredHits) hitById.set(hit.userId, hit)
  for (const hit of input.lexicalHits) hitById.set(hit.userId, hit)

  const byId = new Map<string, HybridCandidate>()

  function ensure(hit: SearchHit): HybridCandidate {
    const existing = byId.get(hit.userId)
    if (existing) return existing
    const candidate: HybridCandidate = {
      hit,
      sources: new Set(),
      rawEvidence: [],
      syntheticEvidence: [],
      vectorScore: 0,
      warmScore: hit.score,
      preRerankScore: 0,
      rerankScore: null,
      finalScore: 0,
    }
    byId.set(hit.userId, candidate)
    return candidate
  }

  for (const hit of input.structuredHits) {
    ensure(hit).sources.add('structured')
  }

  for (const hit of input.lexicalHits) {
    ensure(hit).sources.add('lexical')
  }

  for (const evidence of input.vectorEvidence) {
    const hit = hitById.get(evidence.userId)
    if (!hit) continue
    const candidate = ensure(hit)
    candidate.sources.add('vector')
    candidate.vectorScore = Math.max(candidate.vectorScore, evidence.similarity)
    if (evidence.chunkKind === 'raw') {
      candidate.rawEvidence.push(explainRawEvidence(evidence))
    } else {
      candidate.syntheticEvidence.push(evidence.content)
    }
  }

  for (const candidate of byId.values()) {
    candidate.rawEvidence = unique(candidate.rawEvidence).slice(0, 5)
    candidate.syntheticEvidence = unique(candidate.syntheticEvidence).slice(0, 3)
    candidate.preRerankScore = preRerankScore(candidate)
    candidate.finalScore = candidate.preRerankScore
  }

  return [...byId.values()].sort((a, b) => b.preRerankScore - a.preRerankScore)
}

export function applyRerankScores(
  candidates: HybridCandidate[],
  scores: Map<string, number>,
): HybridCandidate[] {
  const maxWarm = Math.max(1, ...candidates.map((c) => c.warmScore))
  for (const candidate of candidates) {
    const rerank = scores.get(candidate.hit.userId)
    candidate.rerankScore = rerank ?? null
    if (rerank == null) {
      candidate.finalScore = candidate.preRerankScore
      continue
    }
    const normalizedWarm = candidate.warmScore / maxWarm
    const sourceBoost =
      candidate.sources.has('structured') || candidate.sources.has('lexical') ? 0.05 : 0
    candidate.finalScore = rerank * 0.72 + normalizedWarm * 0.23 + sourceBoost
  }
  return [...candidates].sort((a, b) => b.finalScore - a.finalScore)
}

function preRerankScore(candidate: HybridCandidate) {
  const sourceScore =
    (candidate.sources.has('structured') ? 0.18 : 0) +
    (candidate.sources.has('lexical') ? 0.16 : 0) +
    (candidate.sources.has('vector') ? 0.22 : 0)
  const warm = Math.min(candidate.warmScore, 200) / 200
  const vector = Math.max(0, Math.min(1, candidate.vectorScore))
  return sourceScore + warm * 0.3 + vector * 0.4
}

function explainRawEvidence(evidence: VectorEvidence) {
  switch (evidence.sourceSection) {
    case 'directory':
      return evidence.content
    case 'career_history':
      return `Career history match: ${evidence.content}`
    case 'education_history':
      return `Education match: ${evidence.content}`
    case 'bio':
      return `Bio match: ${evidence.content}`
    case 'skills':
      return `Skills match: ${evidence.content}`
    case 'mentoring_topics':
      return evidence.content
    default:
      return evidence.content
  }
}

function unique(items: string[]) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))]
}

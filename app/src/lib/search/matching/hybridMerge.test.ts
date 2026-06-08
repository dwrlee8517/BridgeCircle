import { describe, expect, it } from 'vitest'
import type { SearchHit } from '../searchAlumni'
import { applyRerankScores, mergeHybridCandidates } from './hybridMerge'

function hit(overrides: Partial<SearchHit> & { userId: string; score?: number }): SearchHit {
  const { userId, score, ...rest } = overrides
  return {
    userId,
    name: null,
    preferredName: null,
    nameOther: null,
    headline: null,
    currentEmployer: null,
    currentTitle: null,
    city: null,
    university: null,
    major: null,
    graduationYear: null,
    avatarUrl: null,
    isOpenAsMentor: false,
    isOpenAsAdviceHelper: false,
    mentorPaused: false,
    mentoringTopics: null,
    maxActiveMentees: 5,
    maxPendingRequests: 10,
    activeMenteeCount: 0,
    pendingRequestCount: 0,
    bio: null,
    careerHistory: null,
    educationHistory: null,
    skills: null,
    reason: 'in your network',
    score: score ?? 0,
    ...rest,
  }
}

describe('mergeHybridCandidates', () => {
  it('dedupes candidates while preserving structured, lexical, and vector sources', () => {
    const mark = hit({ userId: 'mark', name: 'Mark Mentor', score: 100 })
    const mei = hit({ userId: 'mei', name: 'Mei Mentor', score: 40 })

    const merged = mergeHybridCandidates({
      structuredHits: [mark],
      lexicalHits: [mark],
      allHydratedHits: [mark, mei],
      vectorEvidence: [
        {
          chunkId: 'chunk-1',
          userId: 'mei',
          chunkKind: 'raw',
          sourceSection: 'career_history',
          visibilityTier: 'org',
          content: 'Former consultant now product director.',
          similarity: 0.88,
        },
      ],
    })

    expect(merged).toHaveLength(2)
    const markCandidate = merged.find((candidate) => candidate.hit.userId === 'mark')
    const meiCandidate = merged.find((candidate) => candidate.hit.userId === 'mei')
    expect(markCandidate?.sources.has('structured')).toBe(true)
    expect(markCandidate?.sources.has('lexical')).toBe(true)
    expect(meiCandidate?.sources.has('vector')).toBe(true)
    expect(meiCandidate?.rawEvidence[0]).toMatch(/Career history match/)
  })

  it('does not expose synthetic evidence as raw evidence', () => {
    const candidate = hit({ userId: 'mei' })
    const merged = mergeHybridCandidates({
      structuredHits: [],
      lexicalHits: [],
      allHydratedHits: [candidate],
      vectorEvidence: [
        {
          chunkId: 'chunk-1',
          userId: 'mei',
          chunkKind: 'synthetic',
          sourceSection: 'career_path_summary',
          visibilityTier: 'org',
          content: 'Synthetic passage.',
          similarity: 0.9,
        },
      ],
    })

    expect(merged[0].rawEvidence).toEqual([])
    expect(merged[0].syntheticEvidence).toEqual(['Synthetic passage.'])
  })

  it('combines rerank score with warm score and source boosts', () => {
    const warm = hit({ userId: 'warm', score: 200 })
    const semantic = hit({ userId: 'semantic', score: 0 })
    const merged = mergeHybridCandidates({
      structuredHits: [warm],
      lexicalHits: [],
      allHydratedHits: [warm, semantic],
      vectorEvidence: [
        {
          chunkId: 'chunk-1',
          userId: 'semantic',
          chunkKind: 'raw',
          sourceSection: 'bio',
          visibilityTier: 'org',
          content: 'Product transition.',
          similarity: 0.9,
        },
      ],
    })

    const reranked = applyRerankScores(
      merged,
      new Map([
        ['warm', 0.5],
        ['semantic', 0.95],
      ]),
    )

    expect(reranked[0].hit.userId).toBe('semantic')
  })
})

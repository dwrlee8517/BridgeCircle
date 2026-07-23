import { describe, expect, it, vi } from 'vitest'
import type { HelpCandidate, HelpRepository } from './contracts'
import { findHelpCandidates } from './matching'

const viewerMembershipId = '20000000-0000-4000-8000-000000000001'

const goldenCandidates: HelpCandidate[] = [
  {
    membershipId: '20000000-0000-4000-8000-000000000002',
    userId: '10000000-0000-4000-8000-000000000002',
    displayName: 'Jordan Lee',
    headline: 'Health product leader',
    avatarPath: null,
    graduationYear: 2002,
    topics: ['Product strategy', 'Career transitions'],
    lexicalScore: 0.8,
    semanticScore: 0,
    matchReason: 'Speaks to Product strategy',
    evidenceChunkIds: ['70000000-0000-4000-8000-000000000002'],
  },
  {
    membershipId: '20000000-0000-4000-8000-000000000003',
    userId: '10000000-0000-4000-8000-000000000003',
    displayName: 'Sam Rivera',
    headline: 'Operator in digital health',
    avatarPath: null,
    graduationYear: 2005,
    topics: ['Healthcare'],
    lexicalScore: 0.3,
    semanticScore: 0,
    matchReason: 'Speaks to Healthcare',
    evidenceChunkIds: ['70000000-0000-4000-8000-000000000003'],
  },
  {
    membershipId: '20000000-0000-4000-8000-000000000004',
    userId: '10000000-0000-4000-8000-000000000004',
    displayName: 'Taylor Kim',
    headline: 'Finance leader',
    avatarPath: null,
    graduationYear: 2001,
    topics: [],
    lexicalScore: 0,
    semanticScore: 0,
    matchReason: 'Relevant experience',
    evidenceChunkIds: [],
  },
]

describe('Help matching golden fixture', () => {
  it('ranks visible factual evidence and never pads the result', async () => {
    const searchCandidates = vi
      .fn<HelpRepository['searchCandidates']>()
      .mockResolvedValue(goldenCandidates)
    const result = await findHelpCandidates(
      {
        membershipId: viewerMembershipId,
        question: 'How do I move from B2B software into health product strategy?',
        signal: new AbortController().signal,
      },
      {
        repository: { searchCandidates },
        embeddings: null,
        reranker: null,
      },
    )

    expect(result.candidates.map((candidate) => candidate.displayName)).toEqual([
      'Jordan Lee',
      'Sam Rivera',
    ])
    expect(result.candidates.every((candidate) => candidate.evidenceChunkIds.length > 0)).toBe(true)
    expect(result.diagnostics).toEqual({
      retrievedCount: 3,
      rerankedCount: 0,
      fallbacks: ['embedding_unavailable', 'reranker_unavailable'],
    })
  })
})

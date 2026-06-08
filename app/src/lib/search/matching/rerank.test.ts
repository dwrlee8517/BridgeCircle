import { describe, expect, it } from 'vitest'
import type { SearchHit } from '../searchAlumni'
import type { HybridCandidate } from './hybridMerge'
import { candidateRerankDocument } from './rerank'

describe('candidateRerankDocument', () => {
  it('uses visible raw/profile evidence and omits synthetic passages', () => {
    const hit: SearchHit = {
      userId: 'user-1',
      name: 'Jamie Kim',
      preferredName: null,
      nameOther: null,
      headline: null,
      currentEmployer: 'Stripe',
      currentTitle: 'Product Manager',
      city: null,
      university: null,
      major: null,
      graduationYear: null,
      avatarUrl: null,
      isOpenAsMentor: true,
      isOpenAsAdviceHelper: true,
      mentorPaused: false,
      mentoringTopics: ['Product management'],
      maxActiveMentees: 5,
      maxPendingRequests: 10,
      activeMenteeCount: 0,
      pendingRequestCount: 0,
      bio: null,
      careerHistory: null,
      educationHistory: null,
      skills: null,
      reason: 'open to mentor',
      score: 100,
    }
    const candidate: HybridCandidate = {
      hit,
      sources: new Set(['vector']),
      rawEvidence: ['Career history match: Associate at McKinsey.'],
      syntheticEvidence: ['Synthetic generated career path summary.'],
      vectorScore: 0.9,
      warmScore: 100,
      preRerankScore: 1,
      rerankScore: null,
      finalScore: 1,
    }

    const doc = candidateRerankDocument(candidate)

    expect(doc).toContain('Product Manager at Stripe')
    expect(doc).toContain('Career history match')
    expect(doc).not.toContain('Synthetic generated career path summary')
  })
})

import { describe, expect, it, vi } from 'vitest'
import type { HelpCandidate, HelpRepository } from './contracts'
import { findHelpCandidates, findMemberHelpCandidates, rankDeterministically } from './matching'
import type { HelpEmbeddingProvider, HelpRerankProvider } from './providers'

const membershipId = '20000000-0000-4000-8000-000000000001'

function candidate(id: string, overrides: Partial<HelpCandidate> = {}): HelpCandidate {
  return {
    membershipId: id,
    userId: id.replace(/^2/, '1'),
    displayName: 'A helper',
    headline: null,
    avatarPath: null,
    graduationYear: 2001,
    topics: [],
    score: 0,
    matchedFields: [],
    matchReason: 'Relevant experience',
    ...overrides,
  }
}

function repository(rows: HelpCandidate[][]) {
  const searchCandidates = vi.fn<HelpRepository['searchCandidates']>()
  for (const result of rows) searchCandidates.mockResolvedValueOnce(result)
  return { searchCandidates }
}

function embeddings(value: readonly number[] = [0.1, 0.2]): HelpEmbeddingProvider {
  return {
    embedQuery: vi.fn(async () => value),
    embedDocuments: vi.fn(async () => []),
  }
}

describe('Help matching', () => {
  it('passes the SQL score through as the deterministic rank', () => {
    const ranked = rankDeterministically(
      'Advice on product strategy',
      candidate('20000000-0000-4000-8000-000000000002', { score: 0.61 }),
    )
    expect(ranked.deterministicScore).toBe(0.61)
    expect(ranked.finalScore).toBe(0.61)
    expect(ranked.rerankScore).toBeNull()
  })

  it('preserves SQL ranking and trusts the SQL display rule', async () => {
    const repo = repository([
      [
        candidate('20000000-0000-4000-8000-000000000002', { score: 0.9 }),
        candidate('20000000-0000-4000-8000-000000000003', { score: 0.4 }),
        // Zero-score rows are the SQL layer's call: no app-side threshold.
        candidate('20000000-0000-4000-8000-000000000004', { score: 0 }),
      ],
    ])
    const result = await findHelpCandidates(
      {
        membershipId,
        question: 'Product help',
        signal: new AbortController().signal,
      },
      { repository: repo, embeddings: null, reranker: null },
    )
    expect(result.candidates.map((row) => row.membershipId)).toEqual([
      '20000000-0000-4000-8000-000000000002',
      '20000000-0000-4000-8000-000000000003',
      '20000000-0000-4000-8000-000000000004',
    ])
    expect(result.diagnostics.fallbacks).toEqual(['embedding_unavailable', 'reranker_unavailable'])
  })

  it('does not call a provider until permission-gated retrieval returns a pool', async () => {
    const repo = repository([[]])
    const embeddingProvider = embeddings()
    const reranker: HelpRerankProvider = { rerank: vi.fn(async () => []) }
    const result = await findHelpCandidates(
      {
        membershipId,
        question: 'Could someone help?',
        signal: new AbortController().signal,
      },
      { repository: repo, embeddings: embeddingProvider, reranker },
    )
    expect(result.candidates).toEqual([])
    expect(embeddingProvider.embedQuery).not.toHaveBeenCalled()
    expect(reranker.rerank).not.toHaveBeenCalled()
  })

  it('falls back to lexical ranking when the atomic provider budget is exhausted', async () => {
    const row = candidate('20000000-0000-4000-8000-000000000002', {
      topics: ['Product'],
      score: 0.5,
    })
    const repo = repository([[row]])
    const embeddingProvider = embeddings()
    const reranker: HelpRerankProvider = { rerank: vi.fn(async () => []) }
    const authorizeProviderUse = vi.fn(async () => false)

    const result = await findHelpCandidates(
      {
        membershipId,
        question: 'Product help',
        signal: new AbortController().signal,
      },
      {
        repository: repo,
        embeddings: embeddingProvider,
        reranker,
        authorizeProviderUse,
      },
    )

    expect(authorizeProviderUse).toHaveBeenCalledOnce()
    expect(embeddingProvider.embedQuery).not.toHaveBeenCalled()
    expect(reranker.rerank).not.toHaveBeenCalled()
    expect(result.candidates).toHaveLength(1)
    expect(result.diagnostics.fallbacks).toEqual(['provider_limited'])
  })

  it('fails closed when a provider caller omits authorization', async () => {
    const row = candidate('20000000-0000-4000-8000-000000000002', {
      topics: ['Product'],
      score: 0.5,
    })
    const repo = repository([[row]])
    const embeddingProvider = embeddings()
    const reranker: HelpRerankProvider = { rerank: vi.fn(async () => []) }

    const result = await findHelpCandidates(
      {
        membershipId,
        question: 'Product help',
        signal: new AbortController().signal,
      },
      { repository: repo, embeddings: embeddingProvider, reranker },
    )

    expect(embeddingProvider.embedQuery).not.toHaveBeenCalled()
    expect(reranker.rerank).not.toHaveBeenCalled()
    expect(result.candidates).toHaveLength(1)
    expect(result.diagnostics.fallbacks).toEqual(['provider_limited'])
  })

  it('enforces the candidate-search budget at the member domain boundary', async () => {
    const row = candidate('20000000-0000-4000-8000-000000000002', {
      topics: ['Product'],
      score: 0.5,
    })
    const searchCandidates = repository([[row]]).searchCandidates
    const consumeAiBudget = vi.fn<HelpRepository['consumeAiBudget']>(async () => ({
      status: 'limited',
      remaining: 0,
      resetsAt: '2026-07-18T12:00:00.000Z',
    }))
    const embeddingProvider = embeddings()

    const result = await findMemberHelpCandidates(
      {
        membershipId,
        question: 'Product help',
        signal: new AbortController().signal,
      },
      {
        repository: { searchCandidates, consumeAiBudget },
        embeddings: embeddingProvider,
        reranker: null,
      },
    )

    expect(consumeAiBudget).toHaveBeenCalledWith('candidate_search')
    expect(embeddingProvider.embedQuery).not.toHaveBeenCalled()
    expect(result.diagnostics.fallbacks).toContain('provider_limited')
  })

  it('merges semantic retrieval and reranks only the bounded top pool', async () => {
    const lexical = Array.from({ length: 25 }, (_, index) =>
      candidate(`20000000-0000-4000-8000-${String(index + 2).padStart(12, '0')}`, {
        score: 0.5,
        matchedFields: ['topics'],
      }),
    )
    const semantic = [
      candidate('20000000-0000-4000-8000-000000000026', {
        score: 0.95,
        matchedFields: ['headline'],
      }),
    ]
    const repo = repository([lexical, semantic])
    const rerank = vi.fn<HelpRerankProvider['rerank']>(async (_question, candidates) =>
      candidates.map((item, index) => ({
        candidateId: item.candidateId,
        score: index === 0 ? 1 : 0,
      })),
    )
    const result = await findHelpCandidates(
      {
        membershipId,
        question: 'Product help',
        limit: 10,
        signal: new AbortController().signal,
      },
      {
        repository: repo,
        embeddings: embeddings(),
        reranker: { rerank },
        authorizeProviderUse: async () => true,
      },
    )
    expect(repo.searchCandidates).toHaveBeenCalledTimes(2)
    expect(rerank.mock.calls[0]?.[1]).toHaveLength(20)
    // The requested limit is clamped to the five-slot display contract.
    expect(result.candidates).toHaveLength(5)
    expect(result.diagnostics.rerankedCount).toBe(20)
    // The merge keeps the max score for a member seen in both passes.
    const merged = result.candidates.find(
      (row) => row.membershipId === '20000000-0000-4000-8000-000000000026',
    )
    expect(merged?.score).toBe(0.95)
    expect(merged?.matchedFields).toEqual(['topics', 'headline'])
  })

  it('falls back to lexical scoring when embedding and reranking fail', async () => {
    const row = candidate('20000000-0000-4000-8000-000000000002', {
      topics: ['Product'],
      score: 0.5,
    })
    const repo = repository([[row]])
    const embeddingProvider = embeddings()
    vi.mocked(embeddingProvider.embedQuery).mockRejectedValue(new Error('provider unavailable'))
    const reranker: HelpRerankProvider = {
      rerank: vi.fn(async () => {
        throw new Error('provider unavailable')
      }),
    }
    const result = await findHelpCandidates(
      {
        membershipId,
        question: 'Product help',
        signal: new AbortController().signal,
      },
      {
        repository: repo,
        embeddings: embeddingProvider,
        reranker,
        authorizeProviderUse: async () => true,
      },
    )
    expect(result.candidates).toHaveLength(1)
    expect(result.diagnostics.fallbacks).toEqual(['embedding_failed', 'reranker_failed'])
  })
})

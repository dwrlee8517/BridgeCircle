import { describe, expect, it, vi } from 'vitest'
import type { HelpCandidate, HelpRepository } from './contracts'
import { findHelpCandidates, rankDeterministically } from './matching'
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
    lexicalScore: 0,
    semanticScore: 0,
    matchReason: 'Relevant experience',
    evidenceChunkIds: [],
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
  it('keeps exact helper topics strong and uses a stable UUID tie break', () => {
    const first = candidate('20000000-0000-4000-8000-000000000002', {
      topics: ['Product strategy'],
    })
    const second = candidate('20000000-0000-4000-8000-000000000003', {
      lexicalScore: 0.2,
    })
    expect(rankDeterministically('Advice on product strategy', first).finalScore).toBeGreaterThan(
      rankDeterministically('Advice on product strategy', second).finalScore,
    )
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

  it('merges semantic retrieval and reranks only the bounded top pool', async () => {
    const lexical = Array.from({ length: 25 }, (_, index) =>
      candidate(`20000000-0000-4000-8000-${String(index + 2).padStart(12, '0')}`, {
        lexicalScore: 0.5,
        evidenceChunkIds: [`70000000-0000-4000-8000-${String(index + 2).padStart(12, '0')}`],
      }),
    )
    const semantic = [
      candidate('20000000-0000-4000-8000-000000000026', {
        semanticScore: 0.95,
        evidenceChunkIds: ['70000000-0000-4000-8000-000000000026'],
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
      { repository: repo, embeddings: embeddings(), reranker: { rerank } },
    )
    expect(repo.searchCandidates).toHaveBeenCalledTimes(2)
    expect(rerank.mock.calls[0]?.[1]).toHaveLength(20)
    expect(result.candidates).toHaveLength(10)
    expect(result.diagnostics.rerankedCount).toBe(20)
  })

  it('falls back to lexical scoring when embedding and reranking fail', async () => {
    const row = candidate('20000000-0000-4000-8000-000000000002', {
      topics: ['Product'],
      lexicalScore: 0.5,
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
      { repository: repo, embeddings: embeddingProvider, reranker },
    )
    expect(result.candidates).toHaveLength(1)
    expect(result.diagnostics.fallbacks).toEqual(['embedding_failed', 'reranker_failed'])
  })

  it('never pads a weak pool with evidence-free people', async () => {
    const repo = repository([
      [
        candidate('20000000-0000-4000-8000-000000000002'),
        candidate('20000000-0000-4000-8000-000000000003', {
          topics: ['Health'],
        }),
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
    expect(result.candidates).toEqual([])
    expect(result.diagnostics.fallbacks).toEqual(['embedding_unavailable', 'reranker_unavailable'])
  })
})

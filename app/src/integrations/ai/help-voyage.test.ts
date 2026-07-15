import { describe, expect, it, vi } from 'vitest'
import { HelpProviderError, VoyageHelpProvider } from './help-voyage'

const vector = Array.from({ length: 1024 }, (_, index) => index / 1024)

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('Voyage Help provider', () => {
  it('uses the fixed 1024-dimension embedding contract', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      jsonResponse({ data: [{ index: 0, embedding: vector }] }),
    )
    const provider = new VoyageHelpProvider({ apiKey: 'test-key', fetchImpl })
    await expect(
      provider.embedQuery('Product strategy', new AbortController().signal),
    ).resolves.toHaveLength(1024)
    const request = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body))
    expect(request).toEqual({
      model: 'voyage-4',
      input: ['Product strategy'],
      input_type: 'query',
      output_dimension: 1024,
    })
  })

  it('maps rerank indexes back to opaque candidate IDs', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      jsonResponse({ data: [{ index: 1, relevance_score: 0.8 }] }),
    )
    const provider = new VoyageHelpProvider({ apiKey: 'test-key', fetchImpl })
    await expect(
      provider.rerank(
        'Product strategy',
        [
          { candidateId: 'first', evidence: ['Career experience'] },
          { candidateId: 'second', evidence: ['Can speak to Product'] },
        ],
        new AbortController().signal,
      ),
    ).resolves.toEqual([{ candidateId: 'second', score: 0.8 }])
  })

  it.each([
    { response: { data: [{ index: 0, embedding: [0.1] }] }, label: 'wrong dimensions' },
    { response: { malformed: true }, label: 'malformed body' },
  ])('rejects an invalid embedding response: $label', async ({ response }) => {
    const provider = new VoyageHelpProvider({
      apiKey: 'test-key',
      fetchImpl: vi.fn(async () => jsonResponse(response)),
    })
    await expect(
      provider.embedQuery('Product strategy', new AbortController().signal),
    ).rejects.toMatchObject({ code: 'invalid_response' })
  })

  it('returns a sanitized error for HTTP failures and timeouts', async () => {
    const httpProvider = new VoyageHelpProvider({
      apiKey: 'test-key',
      fetchImpl: vi.fn(async () => jsonResponse({ secret: 'must not escape' }, 503)),
    })
    await expect(
      httpProvider.embedQuery('private question', new AbortController().signal),
    ).rejects.toEqual(new HelpProviderError('network'))

    const timeoutProvider = new VoyageHelpProvider({
      apiKey: 'test-key',
      timeoutMs: 1,
      fetchImpl: vi.fn<typeof fetch>(
        (_input, init) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), {
              once: true,
            })
          }),
      ),
    })
    await expect(
      timeoutProvider.embedQuery('private question', new AbortController().signal),
    ).rejects.toEqual(new HelpProviderError('timeout'))
  })
})

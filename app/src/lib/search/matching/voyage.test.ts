import { describe, expect, it, vi } from 'vitest'
import { VOYAGE_EMBEDDING_DIMENSIONS, VOYAGE_EMBEDDING_MODEL } from './config'
import { VoyageClient } from './voyage'

describe('VoyageClient', () => {
  it('returns no_api_key when no key is configured', async () => {
    const client = new VoyageClient({ apiKey: '', fetchImpl: vi.fn() as unknown as typeof fetch })
    const result = await client.embed(['hello'], 'query')
    expect(result).toEqual({ ok: false, error: 'no_api_key' })
  })

  it('sends embedding requests with voyage-4 and 1024 dimensions', async () => {
    const embedding = Array.from({ length: VOYAGE_EMBEDDING_DIMENSIONS }, () => 0.1)
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ data: [{ index: 0, embedding }] }), { status: 200 }),
    )
    const fetchImpl = fetchMock as unknown as typeof fetch
    const client = new VoyageClient({ apiKey: 'test-key', fetchImpl })

    const result = await client.embed(['hello'], 'query')

    expect(result.ok).toBe(true)
    const [, init] = (fetchMock.mock.calls as unknown as Array<[RequestInfo | URL, RequestInit]>)[0]
    expect(JSON.parse(init.body as string)).toMatchObject({
      model: VOYAGE_EMBEDDING_MODEL,
      input: ['hello'],
      input_type: 'query',
      output_dimension: VOYAGE_EMBEDDING_DIMENSIONS,
    })
  })

  it('maps rerank responses back to document ids', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            data: [
              { index: 1, relevance_score: 0.91 },
              { index: 0, relevance_score: 0.45 },
            ],
          }),
          { status: 200 },
        ),
    ) as unknown as typeof fetch
    const client = new VoyageClient({ apiKey: 'test-key', fetchImpl })

    const result = await client.rerank(
      'product management',
      [
        { id: 'a', text: 'consulting' },
        { id: 'b', text: 'product manager' },
      ],
      2,
    )

    expect(result).toEqual({
      ok: true,
      value: [
        { id: 'b', score: 0.91 },
        { id: 'a', score: 0.45 },
      ],
    })
  })

  it('treats non-2xx responses as network errors', async () => {
    const fetchImpl = vi.fn(
      async () => new Response('nope', { status: 500 }),
    ) as unknown as typeof fetch
    const client = new VoyageClient({ apiKey: 'test-key', fetchImpl })

    const result = await client.rerank('q', [{ id: 'a', text: 'doc' }], 1)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('network_error')
  })
})

import { describe, expect, it, vi } from 'vitest'
import { AnthropicPeopleProvider } from './people-anthropic'

function response(text: string, status = 200): Response {
  return new Response(JSON.stringify({ content: [{ type: 'text', text }] }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const input = {
  recipientFirstName: 'Maya',
  reason: 'Her path is the move I am trying to make.',
  visibleContext: ['Principal at Northstar'],
}

describe('Anthropic People provider', () => {
  it('accepts only a bounded editable Connection draft', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      response(JSON.stringify({ text: 'Hi Maya — your path stood out to me.' })),
    )
    const provider = new AnthropicPeopleProvider({ apiKey: 'test-key', fetchImpl })
    await expect(provider.shapeConnectionIntro(input, new AbortController().signal)).resolves.toBe(
      'Hi Maya — your path stood out to me.',
    )

    const request = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body))
    expect(request.model).toBe('claude-haiku-4-5-20251001')
    expect(request.max_tokens).toBe(350)
    expect(request.system).toContain('Do not add facts')
  })

  it.each([
    { text: 'not json', label: 'non-JSON' },
    { text: JSON.stringify({ text: 'Draft', send: true }), label: 'extra command field' },
  ])('rejects $label output', async ({ text }) => {
    const provider = new AnthropicPeopleProvider({
      apiKey: 'test-key',
      fetchImpl: vi.fn(async () => response(text)),
    })
    await expect(
      provider.shapeConnectionIntro(input, new AbortController().signal),
    ).rejects.toMatchObject({ code: 'invalid_response' })
  })

  it('turns provider failures into sanitized error codes', async () => {
    const provider = new AnthropicPeopleProvider({
      apiKey: 'test-key',
      fetchImpl: vi.fn(async () => response('private response', 503)),
    })
    await expect(
      provider.shapeConnectionIntro(input, new AbortController().signal),
    ).rejects.toMatchObject({ code: 'network', message: 'People provider failed: network' })
  })
})

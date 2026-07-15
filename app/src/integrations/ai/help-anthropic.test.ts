import { describe, expect, it, vi } from 'vitest'
import { AnthropicHelpProvider } from './help-anthropic'

function response(text: string, status = 200): Response {
  return new Response(JSON.stringify({ content: [{ type: 'text', text }] }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('Anthropic Help provider', () => {
  it('sends one bounded task prompt and accepts strict JSON text', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      response(JSON.stringify({ text: 'Could you share your perspective?' })),
    )
    const provider = new AnthropicHelpProvider({ apiKey: 'test-key', fetchImpl })
    await expect(
      provider.complete(
        'ask_draft',
        { currentText: 'Need product advice', context: ['Product'] },
        new AbortController().signal,
      ),
    ).resolves.toEqual({ text: 'Could you share your perspective?' })
    const request = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body))
    expect(request.model).toBe('claude-haiku-4-5-20251001')
    expect(request.max_tokens).toBe(700)
    expect(request.system).toContain('Do not add facts')
  })

  it.each([
    { text: 'not json', label: 'non-JSON' },
    { text: JSON.stringify({ text: 'Draft', submit: true }), label: 'extra command field' },
  ])('rejects $label output', async ({ text }) => {
    const provider = new AnthropicHelpProvider({
      apiKey: 'test-key',
      fetchImpl: vi.fn(async () => response(text)),
    })
    await expect(
      provider.complete(
        'ask_draft',
        { currentText: 'Need product advice' },
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ code: 'invalid_response' })
  })

  it('sanitizes provider failures without returning the response body', async () => {
    const provider = new AnthropicHelpProvider({
      apiKey: 'test-key',
      fetchImpl: vi.fn(async () => response('private response', 503)),
    })
    await expect(
      provider.complete(
        'decline_note',
        { currentText: 'private note' },
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({
      name: 'HelpProviderError',
      code: 'network',
      message: 'Help provider failed: network',
    })
  })
})

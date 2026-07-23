import { z } from 'zod'
import type { PeopleConnectionDraftProvider } from '@/lib/people/connection-draft'

const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'
const DEFAULT_TIMEOUT_MS = 8_000

const responseSchema = z.object({
  content: z.array(
    z.object({
      type: z.literal('text'),
      text: z.string(),
    }),
  ),
})
const draftSchema = z.object({ text: z.string().trim().min(1).max(2_000) }).strict()

export type AnthropicPeopleProviderOptions = {
  apiKey: string
  fetchImpl?: typeof fetch
  timeoutMs?: number
}

export class AnthropicPeopleProvider implements PeopleConnectionDraftProvider {
  private readonly fetchImpl: typeof fetch
  private readonly timeoutMs: number

  constructor(private readonly options: AnthropicPeopleProviderOptions) {
    if (!options.apiKey.trim()) throw new PeopleProviderError('not_configured')
    this.fetchImpl = options.fetchImpl ?? fetch
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  }

  async shapeConnectionIntro(
    input: {
      recipientFirstName: string
      reason: string
      visibleContext: readonly string[]
    },
    signal: AbortSignal,
  ): Promise<string> {
    if (signal.aborted) throw new PeopleProviderError('timeout')
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort('timeout'), this.timeoutMs)
    const abort = () => controller.abort(signal.reason)
    signal.addEventListener('abort', abort, { once: true })

    try {
      const response = await this.fetchImpl(ANTHROPIC_MESSAGES_URL, {
        method: 'POST',
        headers: {
          'x-api-key': this.options.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 350,
          system:
            'Rewrite the member reason as one warm, concise Connection request. Use only the supplied recipient first name, reason, and visible context. Do not add facts, familiarity, credentials, promises, or a request for help. Return JSON only with exactly one string field named text.',
          messages: [{ role: 'user', content: JSON.stringify(input) }],
        }),
        signal: controller.signal,
      })
      if (!response.ok) throw new PeopleProviderError('network')
      const envelope = responseSchema.safeParse(await response.json())
      const block = envelope.success ? envelope.data.content[0] : null
      if (!block) throw new PeopleProviderError('invalid_response')
      let decoded: unknown
      try {
        decoded = JSON.parse(block.text)
      } catch {
        throw new PeopleProviderError('invalid_response')
      }
      const draft = draftSchema.safeParse(decoded)
      if (!draft.success) throw new PeopleProviderError('invalid_response')
      return draft.data.text
    } catch (error) {
      if (error instanceof PeopleProviderError) throw error
      if (controller.signal.aborted) throw new PeopleProviderError('timeout')
      throw new PeopleProviderError('network')
    } finally {
      clearTimeout(timeout)
      signal.removeEventListener('abort', abort)
    }
  }
}

export function createAnthropicPeopleProviderFromEnvironment(): AnthropicPeopleProvider | null {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
  return apiKey ? new AnthropicPeopleProvider({ apiKey }) : null
}

export class PeopleProviderError extends Error {
  constructor(readonly code: 'not_configured' | 'network' | 'timeout' | 'invalid_response') {
    super(`People provider failed: ${code}`)
    this.name = 'PeopleProviderError'
  }
}

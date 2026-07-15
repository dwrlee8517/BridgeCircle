import { z } from 'zod'
import type { HelpAssistanceProvider, HelpAssistanceTask } from '@/lib/help/providers'
import { HelpProviderError } from './help-voyage'

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

const completionSchema = z.object({ text: z.string() }).strict()

const taskPrompts: Record<HelpAssistanceTask, string> = {
  ask_draft:
    'Rewrite the member text as one clear, warm request for help. Preserve intent. Do not add facts, names, or promises.',
  match_explanation:
    'Write one concise match reason using only the supplied visible evidence. Do not infer expertise or reveal identity not present in the evidence.',
  decline_note:
    'Rewrite the member text as a kind, direct decline. Preserve the reason. Do not add facts, excuses, or promises.',
}

export type AnthropicHelpProviderOptions = {
  apiKey: string
  fetchImpl?: typeof fetch
  timeoutMs?: number
}

export class AnthropicHelpProvider implements HelpAssistanceProvider {
  private readonly fetchImpl: typeof fetch
  private readonly timeoutMs: number

  constructor(private readonly options: AnthropicHelpProviderOptions) {
    if (!options.apiKey.trim()) throw new HelpProviderError('not_configured')
    this.fetchImpl = options.fetchImpl ?? fetch
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  }

  async complete(
    task: HelpAssistanceTask,
    input: Readonly<Record<string, string | readonly string[]>>,
    signal: AbortSignal,
  ): Promise<Readonly<Record<string, string>>> {
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
          max_tokens: 700,
          system: `${taskPrompts[task]} Return JSON only with exactly one string field named text.`,
          messages: [{ role: 'user', content: JSON.stringify(input) }],
        }),
        signal: controller.signal,
      })
      if (!response.ok) throw new HelpProviderError('network')
      const envelope = responseSchema.safeParse(await response.json())
      const block = envelope.success ? envelope.data.content[0] : null
      if (!block) throw new HelpProviderError('invalid_response')
      let decoded: unknown
      try {
        decoded = JSON.parse(block.text)
      } catch {
        throw new HelpProviderError('invalid_response')
      }
      const completion = completionSchema.safeParse(decoded)
      if (!completion.success) throw new HelpProviderError('invalid_response')
      return completion.data
    } catch (error) {
      if (error instanceof HelpProviderError) throw error
      if (controller.signal.aborted) throw new HelpProviderError('timeout')
      throw new HelpProviderError('network')
    } finally {
      clearTimeout(timeout)
      signal.removeEventListener('abort', abort)
    }
  }
}

export function createAnthropicHelpProviderFromEnvironment(): AnthropicHelpProvider | null {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
  return apiKey ? new AnthropicHelpProvider({ apiKey }) : null
}

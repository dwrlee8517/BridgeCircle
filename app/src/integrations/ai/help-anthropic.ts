import { z } from 'zod'
import type {
  HelpAssistanceProvider,
  HelpAssistanceTask,
  HelpProfilePassageProvider,
} from '@/lib/help/providers'
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
const passagesSchema = z
  .object({
    passages: z
      .array(
        z
          .object({
            sourceSection: z.enum(['career_path_summary', 'help_topics_summary']),
            content: z.string().trim().min(1).max(900),
            evidenceFactIds: z.array(z.string().min(1)).min(1).max(6),
          })
          .strict(),
      )
      .max(2),
  })
  .strict()

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

export class AnthropicHelpProvider implements HelpAssistanceProvider, HelpProfilePassageProvider {
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
    const decoded = await this.requestJson(
      `${taskPrompts[task]} Return JSON only with exactly one string field named text.`,
      input,
      signal,
    )
    const completion = completionSchema.safeParse(decoded)
    if (!completion.success) throw new HelpProviderError('invalid_response')
    return completion.data
  }

  async generateProfilePassages(
    input: {
      visibility: 'organization' | 'connections'
      facts: readonly { id: string; sourceSection: string; content: string }[]
    },
    signal: AbortSignal,
  ) {
    const decoded = await this.requestJson(
      'Write up to two search-only profile passages using only the supplied facts. Do not infer expertise, willingness, seniority, identity, or private facts. Cite every passage with evidenceFactIds from the input. Return JSON only with one passages array.',
      input,
      signal,
    )
    const passages = passagesSchema.safeParse(decoded)
    if (!passages.success) throw new HelpProviderError('invalid_response')
    const factIds = new Set(input.facts.map((fact) => fact.id))
    if (
      passages.data.passages.some((passage) =>
        passage.evidenceFactIds.some((id) => !factIds.has(id)),
      )
    ) {
      throw new HelpProviderError('invalid_response')
    }
    return passages.data.passages
  }

  private async requestJson(system: string, input: unknown, signal: AbortSignal): Promise<unknown> {
    if (signal.aborted) throw new HelpProviderError('timeout')
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
          system,
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
      return decoded
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

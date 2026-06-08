import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import type { SemanticPassage, SemanticPassageInput } from './chunks'

const MODEL = 'claude-haiku-4-5-20251001'
const MAX_OUTPUT_TOKENS = 700

const semanticPassageSchema = z.object({
  passages: z
    .array(
      z.object({
        sourceSection: z.enum(['career_path_summary', 'help_topics_summary']),
        content: z.string().trim().min(1).max(900),
      }),
    )
    .max(2),
})

export type SemanticPassageResult =
  | { ok: true; passages: SemanticPassage[] }
  | { ok: false; error: 'no_api_key' | 'llm_call_failed' | 'invalid_response'; detail?: string }

const SYSTEM_PROMPT = `You write search-only profile passages for BridgeCircle, a verified alumni help network.

You receive visible facts about one member. Write up to two short passages that help semantic search find this person for relevant asks.

Hard rules:
- Use ONLY the provided facts.
- Do NOT infer expertise, personality, seniority, willingness, identity, or availability beyond the facts.
- Do NOT mention private or hidden information; if it is not in the facts, it does not exist.
- Do NOT cite yourself or say "based on the provided facts."
- Prefer concrete career paths, transitions, industries, skills, locations, schools, and help topics.

Return ONLY JSON:
{
  "passages": [
    { "sourceSection": "career_path_summary", "content": "..." },
    { "sourceSection": "help_topics_summary", "content": "..." }
  ]
}`

export async function generateSemanticProfilePassages(
  input: SemanticPassageInput,
): Promise<SemanticPassageResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false, error: 'no_api_key' }

  const client = new Anthropic({ apiKey })
  const payload = {
    visibilityTier: input.visibilityTier,
    facts: input.facts,
  }

  let raw: string
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: [{ type: 'text', text: JSON.stringify(payload) }] },
        { role: 'assistant', content: [{ type: 'text', text: '{' }] },
      ],
    })

    const block = response.content[0]
    if (!block || block.type !== 'text') {
      return { ok: false, error: 'invalid_response', detail: 'no text block' }
    }
    raw = `{${block.text}`
  } catch (err) {
    return {
      ok: false,
      error: 'llm_call_failed',
      detail: err instanceof Error ? err.message : String(err),
    }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'invalid_response', detail: 'not valid JSON' }
  }

  const validated = semanticPassageSchema.safeParse(parsed)
  if (!validated.success) {
    return { ok: false, error: 'invalid_response', detail: validated.error.message }
  }

  return { ok: true, passages: validated.data.passages }
}

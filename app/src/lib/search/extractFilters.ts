import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

const MODEL = 'claude-haiku-4-5-20251001'
const MAX_OUTPUT_TOKENS = 512

export const extractedFiltersSchema = z.object({
  // Hard structured filters — applied to SQL.
  mentorOpen: z.boolean().nullable(),
  city: z.string().trim().max(120).nullable(),
  country: z.string().trim().max(120).nullable(),
  university: z.string().trim().max(200).nullable(),
  major: z.string().trim().max(200).nullable(),
  employer: z.string().trim().max(200).nullable(),
  gradYearMin: z.number().int().min(1900).max(2100).nullable(),
  gradYearMax: z.number().int().min(1900).max(2100).nullable(),
  // Soft thematic intent — NOT a SQL filter, passed to rerank.
  theme: z.string().trim().max(300).nullable(),
})

export type ExtractedFilters = z.infer<typeof extractedFiltersSchema>

export type ExtractFiltersResult =
  | { ok: true; filters: ExtractedFilters }
  | {
      ok: false
      error: 'no_api_key' | 'llm_call_failed' | 'invalid_response'
      detail?: string
    }

const SYSTEM_PROMPT = `You convert an alumni search query into structured filters.

Return ONLY a JSON object matching this exact shape — no prose, no markdown fences:

{
  "mentorOpen": boolean | null,
  "city": string | null,
  "country": string | null,
  "university": string | null,
  "major": string | null,
  "employer": string | null,
  "gradYearMin": number | null,
  "gradYearMax": number | null,
  "theme": string | null
}

Rules:
- mentorOpen: true if the query implies mentorship (e.g. "mentor me", "advice", "guide", "help me figure out"). null otherwise.
- city / country: extract location only if explicit. "in the US" → country="United States", city=null. "in NYC" → city="New York". null if no location given.
- university / major / employer: extract only if a specific institution or company is named. null otherwise.
- gradYearMin / gradYearMax: extract only if a year or range is implied ("recent grads" → gradYearMin = current year - 5; "class of 2010" → both = 2010). null if not implied.
- theme: a short noun phrase capturing the *substantive intent* of the query — what kind of person they are looking for, beyond filter values. Examples:
    "someone who can mentor me on photography in the US" → theme="photography career experience"
    "fintech engineers" → theme="fintech engineering"
    "anyone in journalism" → theme="journalism / writing / publishing"
  Keep theme to 5-15 words. null if the query is purely structural ("alumni in Tokyo" with no thematic hint).
- Be conservative — null is better than guessing. Downstream code will not penalize null fields.`

/**
 * Step 1 of the NL search pipeline: free-text query → structured filters + theme.
 *
 * Pure: takes a query string, returns filters. No DB, no caller context yet —
 * we currently don't ground extraction in the org's known cities/universities,
 * which means "Stanford" matches even if no alumnus went there. That's fine
 * for v1: structured filters narrow the candidate pool, the rerank step
 * handles fuzziness.
 */
export async function extractSearchFilters(query: string): Promise<ExtractFiltersResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false, error: 'no_api_key' }

  const client = new Anthropic({ apiKey })

  let raw: string
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: [{ type: 'text', text: query }] },
        // Prefill `{` to nudge JSON-only output.
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

  const validated = extractedFiltersSchema.safeParse(parsed)
  if (!validated.success) {
    return {
      ok: false,
      error: 'invalid_response',
      detail: validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    }
  }

  return { ok: true, filters: validated.data }
}

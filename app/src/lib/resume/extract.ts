import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import * as mammoth from 'mammoth'
import { type ExtractedProfile, extractedProfileSchema } from './schemas'

const MODEL = 'claude-haiku-4-5-20251001'
const MAX_OUTPUT_TOKENS = 2048

export type ExtractInput = {
  mimeType:
    | 'application/pdf'
    | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  bytes: Buffer
}

export type ExtractResult =
  | { ok: true; profile: ExtractedProfile }
  | {
      ok: false
      error: 'no_api_key' | 'docx_parse_failed' | 'llm_call_failed' | 'invalid_response'
      detail?: string
    }

const SYSTEM_PROMPT = `You extract structured profile data from a resume.

Return ONLY a JSON object matching this exact shape — no prose, no markdown fences, no commentary.

{
  "name": string | null,
  "headline": string | null,
  "city": string | null,
  "currentEmployer": string | null,
  "currentTitle": string | null,
  "university": string | null,
  "major": string | null,
  "careerHistory": [
    {
      "employer": string,
      "title": string,
      "startDate": "YYYY" | "YYYY-MM" | null,
      "endDate": "YYYY" | "YYYY-MM" | null,
      "description": string | null
    }
  ],
  "educationHistory": [
    {
      "school": string,
      "degree": string | null,
      "field": string | null,
      "startDate": "YYYY" | "YYYY-MM" | null,
      "endDate": "YYYY" | "YYYY-MM" | null
    }
  ],
  "skills": string[]
}

Rules:
- If a field isn't in the resume, return null (or [] for arrays).
- Use null for endDate when the role is current.
- city should be the candidate's most recent location, formatted as "City, Region" or "City, Country".
- university and major reflect the most recent / highest education.
- currentEmployer and currentTitle reflect the most recent role (typically endDate=null in careerHistory).
- careerHistory is ordered most-recent-first.
- skills is a deduplicated, lowercase-where-natural list of 5-30 items.
- description in careerHistory is a 1-2 sentence summary, not the full bullet list.`

/**
 * Run the LLM extraction. Pure: takes raw bytes, returns ExtractedProfile.
 *
 * For PDF, we send the document as a base64 doc content block — Claude 4.x
 * reads PDFs natively. For DOCX, we extract text with mammoth first since
 * Claude doesn't accept DOCX directly.
 *
 * On parse failure we retry once with a stricter "fix the JSON" message,
 * then bail. Cost is ~$0.008 per resume at Haiku pricing; latency 5-15s.
 */
export async function extractFromResume(input: ExtractInput): Promise<ExtractResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false, error: 'no_api_key' }

  const client = new Anthropic({ apiKey })

  let userContent: Anthropic.MessageParam['content']
  if (input.mimeType === 'application/pdf') {
    userContent = [
      {
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: input.bytes.toString('base64'),
        },
      },
    ]
  } else {
    let text: string
    try {
      const result = await mammoth.extractRawText({ buffer: input.bytes })
      text = result.value
    } catch (err) {
      return {
        ok: false,
        error: 'docx_parse_failed',
        detail: err instanceof Error ? err.message : String(err),
      }
    }
    userContent = [{ type: 'text', text }]
  }

  let raw: string
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userContent },
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

  const validated = extractedProfileSchema.safeParse(parsed)
  if (!validated.success) {
    return {
      ok: false,
      error: 'invalid_response',
      detail: validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    }
  }

  return { ok: true, profile: validated.data }
}

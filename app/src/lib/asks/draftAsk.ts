import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import type { AskType } from './schemas'

const MODEL = 'claude-haiku-4-5-20251001'
const MAX_OUTPUT_TOKENS = 400

/**
 * Compact view of who's asking and who's being asked, fed into the LLM
 * so the draft can name shared context. Everything is pulled from the
 * existing profile shape — we don't ask the LLM to invent facts about
 * either party.
 */
export type DraftPersona = {
  name: string | null
  graduationYear: number | null
  currentTitle: string | null
  currentEmployer: string | null
  city: string | null
  university: string | null
  major: string | null
}

export type DraftHelperContext = DraftPersona & {
  mentoringTopics: string[] | null
}

const draftSchema = z.object({
  helpNeeded: z.string().trim().min(1).max(800),
  // Mentorship asks may also propose a "why this person" line. For advice
  // we ignore this even if the model returns one.
  reason: z.string().trim().max(500).nullable().optional(),
})

export type DraftAskInput = {
  asker: DraftPersona
  helper: DraftHelperContext
  askType: AskType
  /** Anything the user has typed so far (used as the seed). Empty is fine. */
  userText?: string
}

export type DraftAskResult =
  | { ok: true; helpNeeded: string; reason: string | null }
  | {
      ok: false
      error: 'no_api_key' | 'llm_call_failed' | 'invalid_response'
      detail?: string
    }

const SYSTEM_PROMPT = `You are a quiet writing assistant inside BridgeCircle, a warm verified alumni network. You help one alumnus draft a short message to another alumnus they don't yet know. You are NOT the main character — you write a respectful first draft that the human will edit before sending.

Voice: warm, calm, clear, peer-to-peer, lightly professional. Never salesy, hype-driven, generic-corporate, or guilt-trippy. Sound like a person who shared a campus, not a recruiter.

Hard rules:
- First person from the asker.
- Do NOT invent facts about the asker or the helper. Use only the attributes provided.
- Do NOT use the helper's full name in the body — they already know who they are. (You may say "you" / "your work at X" etc.)
- Keep it tight. No filler. No "I hope this finds you well."
- End with a respectful close that gives the helper an easy out (e.g. "totally understand if not", "no rush").

Output format: ONLY a JSON object matching this exact shape — no prose, no markdown fences:
{
  "helpNeeded": string,    // the body of the ask itself
  "reason": string | null  // optional — only for mentorship asks: a short "why you specifically" line. null for advice.
}

Length:
- Advice asks: helpNeeded is 1–3 sentences. Just the question with minimal context. reason: null.
- Mentorship asks: helpNeeded is 3–5 sentences. State what you're working on and what you'd like a mentor to help you think through. reason: 1 sentence naming what you've noticed about the helper that drew you to ask them (overlap in path / topic / city). Use only attributes from the input.`

function describePersona(p: DraftPersona, label: 'Asker' | 'Helper'): string {
  const bits: string[] = []
  if (p.name) bits.push(`name: ${p.name}`)
  if (p.graduationYear) bits.push(`class of: ${p.graduationYear}`)
  if (p.currentTitle && p.currentEmployer) {
    bits.push(`current role: ${p.currentTitle} at ${p.currentEmployer}`)
  } else if (p.currentEmployer) {
    bits.push(`current employer: ${p.currentEmployer}`)
  } else if (p.currentTitle) {
    bits.push(`current title: ${p.currentTitle}`)
  }
  if (p.city) bits.push(`city: ${p.city}`)
  if (p.university) bits.push(`university: ${p.university}`)
  if (p.major) bits.push(`major: ${p.major}`)
  return `${label}:\n  ${bits.join('\n  ')}`
}

/**
 * Generate a first-draft ask body using Claude Haiku.
 *
 * Pure: takes asker + helper + type + optional user-typed seed, returns a
 * draft. No DB. The caller is responsible for fetching profile attributes
 * (typically via getProfile) and surfacing the result back to the form.
 *
 * Behavior is intentionally conservative: the model only uses attributes
 * we pass it (no invented facts about either party), and the user always
 * sees the draft before it's submitted — they can edit freely or discard.
 */
export async function draftAsk(input: DraftAskInput): Promise<DraftAskResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false, error: 'no_api_key' }

  const helperBits = describePersona(input.helper, 'Helper')
  const helperTopics =
    input.helper.mentoringTopics && input.helper.mentoringTopics.length > 0
      ? `\n  mentoring topics: ${input.helper.mentoringTopics.join(', ')}`
      : ''

  const userPrompt = [
    `Ask type: ${input.askType}`,
    describePersona(input.asker, 'Asker'),
    `${helperBits}${helperTopics}`,
    input.userText && input.userText.trim().length > 0
      ? `What the asker has typed so far (seed — refine, don't replace verbatim):\n  ${input.userText.trim()}`
      : "The asker hasn't typed anything yet — write a first draft from scratch.",
  ].join('\n\n')

  const client = new Anthropic({ apiKey })

  let raw: string
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: [{ type: 'text', text: userPrompt }] },
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

  const validated = draftSchema.safeParse(parsed)
  if (!validated.success) {
    return {
      ok: false,
      error: 'invalid_response',
      detail: validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    }
  }

  // For advice, drop any reason the model produced — the form doesn't have
  // a place for it, and we don't want a stray sentence to confuse the user.
  const reason =
    input.askType === 'mentorship' && validated.data.reason ? validated.data.reason : null

  return { ok: true, helpNeeded: validated.data.helpNeeded, reason }
}

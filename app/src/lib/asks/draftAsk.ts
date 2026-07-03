import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import type { DraftVariant } from './schemas'

const MODEL = 'claude-haiku-4-5-20251001'
const MAX_OUTPUT_TOKENS = 400

/**
 * Compact view of who's asking and who's being asked, fed into the LLM
 * so the draft can name shared context. Everything is pulled from the
 * existing profile shape — we don't ask the LLM to invent facts about
 * either party.
 *
 * `headline` and `bio` are the asker-authored framing of who they are;
 * we pass both because they cover different jobs (the headline is a tag-
 * line, the bio is the longer "about me"). `bio` is truncated before
 * sending to keep the prompt bounded.
 */
export type DraftPersona = {
  name: string | null
  graduationYear: number | null
  headline: string | null
  bio: string | null
  currentTitle: string | null
  currentEmployer: string | null
  city: string | null
  university: string | null
  major: string | null
}

/**
 * Minimal career entry shape used only by the drafter. We don't import
 * the full `CareerEntry` from `lib/profile` to keep this lib free of
 * cross-feature coupling — the route maps the snake-case DB shape to
 * this camelCase view at the boundary.
 */
export type DraftCareerEntry = {
  employer: string
  title: string | null
  startDate: string | null
  endDate: string | null
}

export type DraftHelperContext = DraftPersona & {
  mentoringTopics: string[] | null
  /** Most recent first or last — order doesn't matter; we pick the most
   *  recent 5 by date. Null means privacy-redacted or absent. */
  careerHistory: DraftCareerEntry[] | null
}

const draftSchema = z.object({
  helpNeeded: z.string().trim().min(1).max(800),
  // Optional "why you specifically" line when the inputs support one.
  reason: z.string().trim().max(500).nullable().optional(),
  // One line addressed to the asker about why the draft is easy to say yes
  // to. Display-only coaching — never sent to the helper.
  coach: z.string().trim().max(300).nullable().optional(),
})

export type DraftAskInput = {
  asker: DraftPersona
  helper: DraftHelperContext
  /** Anything the user has typed so far (used as the seed). Empty is fine. */
  userText?: string
  /** Refinement lens. When set, the model is asked to rework the seed —
   *  shorter, more direct, or warmer — rather than draft from scratch. */
  variant?: DraftVariant | null
  /** Free-text from the composer — the asker's situation in their own
   *  words. Distinct from `userText` (a seed draft) — this is context,
   *  not a partial draft. */
  context?: string | null
  /** Active signals the asker chose to keep. Each entry is a sentence
   *  injected into the prompt as a "lean on this" instruction. Order
   *  matters — the first is the strongest. */
  signals?: string[] | null
}

export type DraftAskResult =
  | { ok: true; helpNeeded: string; reason: string | null; coach: string | null }
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

Choosing what to mention:
- Concrete career arc and bio details are warm. Generic shared attributes are cold.
  Strong: "saw you went from consulting to product at Stripe", "your bio mentions you're open to talking with people thinking about the switch."
  Weak: "we both went to the same school", "we both majored in econ."
- Prefer the helper's bio and career path over headline / current employer alone when they're available — those are the signals the helper chose to share.
- If multiple strong signals exist, pick ONE. Don't list everything you know.

Output format: ONLY a JSON object matching this exact shape — no prose, no markdown fences:
{
  "helpNeeded": string,    // the body of the ask itself
  "reason": string | null, // optional — a short "why you specifically" line when the inputs support one; else null.
  "coach": string | null   // one short line TO THE ASKER about why this draft is easy to say yes to. Never part of the note.
}

The coach line:
- Addressed to the asker, about their draft — e.g. "Names the decision and asks for a bounded slot — an easy ask to say yes to."
- One sentence, plain and specific. No praise of the asker, no exclamation marks.
- It is UI guidance only; the helper never sees it.

Length:
- helpNeeded is 1–5 sentences. A light question stays short (1–3); a heavier ask earns a little more context (up to 5). Match the weight of what the asker described.
- Never use the words "mentor", "mentee", or "mentorship" — this is one member asking another for help.
- reason: a 1-sentence "why you specifically" line when the asker's inputs support one (overlap in path / topic / city); otherwise null. Use only attributes from the input.`

const BIO_MAX_CHARS = 500
const CAREER_ENTRIES_MAX = 5

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max).trimEnd()}…` : s
}

function describePersona(p: DraftPersona, label: 'Asker' | 'Helper'): string {
  const bits: string[] = []
  if (p.name) bits.push(`name: ${p.name}`)
  if (p.graduationYear) bits.push(`class of: ${p.graduationYear}`)
  if (p.headline) bits.push(`headline: ${p.headline}`)
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
  if (p.bio) bits.push(`bio: ${truncate(p.bio, BIO_MAX_CHARS)}`)
  return `${label}:\n  ${bits.join('\n  ')}`
}

function formatYear(d: string | null): string | null {
  if (!d) return null
  // Accept ISO YYYY-MM-DD or just YYYY; take the year portion.
  const year = d.slice(0, 4)
  return /^\d{4}$/.test(year) ? year : null
}

function formatCareerEntry(e: DraftCareerEntry): string {
  const start = formatYear(e.startDate)
  const end = formatYear(e.endDate) ?? (e.startDate ? 'now' : null)
  const dateRange = start ? (end && end !== start ? `${start}–${end}` : start) : null
  const role = e.title ? `${e.title} at ${e.employer}` : e.employer
  return dateRange ? `${dateRange} · ${role}` : role
}

/** Pick the most recent N entries by start date (descending). Entries
 *  without a start date sink to the bottom, then their original order
 *  is preserved. */
function pickRecentCareer(history: DraftCareerEntry[], n: number): DraftCareerEntry[] {
  return [...history]
    .sort((a, b) => {
      const ya = formatYear(a.startDate) ?? ''
      const yb = formatYear(b.startDate) ?? ''
      return yb.localeCompare(ya)
    })
    .slice(0, n)
}

function variantInstruction(variant: DraftVariant | null | undefined): string | null {
  if (!variant) return null
  switch (variant) {
    case 'shorter':
      return 'Variant requested: shorter. Aim for roughly half the length. Keep the core ask and the warmest specific signal; drop scaffolding and pleasantries.'
    case 'more-direct':
      return 'Variant requested: more direct. Cut softeners and qualifiers. State the ask plainly — still warm, just direct.'
    case 'warmer':
      return 'Variant requested: warmer. Lead with the specific career-arc or bio detail you noticed about them, so they feel chosen rather than messaged.'
  }
}

function describeHelper(h: DraftHelperContext): string {
  const lines: string[] = [describePersona(h, 'Helper')]
  if (h.mentoringTopics && h.mentoringTopics.length > 0) {
    lines.push(`  mentoring topics: ${h.mentoringTopics.join(', ')}`)
  }
  if (h.careerHistory && h.careerHistory.length > 0) {
    const recent = pickRecentCareer(h.careerHistory, CAREER_ENTRIES_MAX)
    const entries = recent.map((e) => `    - ${formatCareerEntry(e)}`).join('\n')
    lines.push(`  career path:\n${entries}`)
  }
  return lines.join('\n')
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

  const variantLine = variantInstruction(input.variant)
  const contextLine =
    input.context && input.context.trim().length > 0
      ? `What the asker is working on (their words):\n  ${input.context.trim()}`
      : null
  const signalsLine =
    input.signals && input.signals.length > 0
      ? `Lean on these specific signals when drafting (asker chose to keep these):\n${input.signals
          .map((s) => `  - ${s}`)
          .join('\n')}`
      : null
  const userPrompt = [
    describePersona(input.asker, 'Asker'),
    describeHelper(input.helper),
    ...(contextLine ? [contextLine] : []),
    ...(signalsLine ? [signalsLine] : []),
    input.userText && input.userText.trim().length > 0
      ? `What the asker has typed so far (seed — refine, don't replace verbatim):\n  ${input.userText.trim()}`
      : contextLine
        ? "Use the asker's situation above to draft a first version."
        : "The asker hasn't typed anything yet — write a first draft from scratch.",
    ...(variantLine ? [variantLine] : []),
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

  const reason = validated.data.reason ?? null

  return {
    ok: true,
    helpNeeded: validated.data.helpNeeded,
    reason,
    coach: validated.data.coach ?? null,
  }
}

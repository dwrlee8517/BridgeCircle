import { z } from 'zod'

export const askTypeSchema = z.enum(['advice', 'mentorship'])
export type AskType = z.infer<typeof askTypeSchema>

// Draft refinement lenses surfaced as buttons next to a generated draft.
// Lives here (not in draftAsk.ts) so the client form can import the type
// without crossing the `'server-only'` boundary.
export const draftVariantSchema = z.enum(['shorter', 'more-direct', 'warmer'])
export type DraftVariant = z.infer<typeof draftVariantSchema>

// The pace the asker proposes in the mentorship flow. Persisted on
// asks.commitment (mentorship only) and shown to the mentor on the review
// screen — the two-sided payoff: honest expectations make the yes easier.
export const askCommitmentSchema = z.enum(['few_exchanges', 'monthly_semester', 'ongoing'])
export type AskCommitment = z.infer<typeof askCommitmentSchema>

// One vocabulary for both sides: the asker picks from these cards, the
// mentor reads the same words on review. The framing is deliberate —
// "a starting point, not a contract", never an SLA.
export const COMMITMENT_OPTIONS: Array<{
  id: AskCommitment
  label: string
  sub: string
}> = [
  { id: 'few_exchanges', label: 'A few exchanges', sub: 'Messages as questions come up' },
  { id: 'monthly_semester', label: 'Monthly check-ins', sub: 'For a semester or so' },
  { id: 'ongoing', label: 'Open to ongoing', sub: 'See where it goes' },
]

export function commitmentLabel(commitment: AskCommitment): string {
  return COMMITMENT_OPTIONS.find((o) => o.id === commitment)?.label ?? commitment
}

export const SCREENING_ANSWER_MAX_LENGTH = 400

export const askSchema = z.object({
  helperId: z.uuid(),
  askType: askTypeSchema,
  // reason is optional in the new composer for both types:
  //   advice → not asked at all (empty)
  //   mentorship → "Why you'd like {name} specifically" (optional but encouraged)
  // The createAsk lib accepts null/empty here; the asks.reason column is nullable.
  reason: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
  // 800 matches the draft API's ceiling so a generated note can never be
  // rejected at send for being a few sentences too warm.
  helpNeeded: z.string().trim().min(10, 'Be specific (10+ chars).').max(800),
  background: z.string().trim().max(1000).optional().nullable(),
  // Mentorship-only fields from the guided flow. createAsk drops both for
  // advice asks so a stray hidden input can't write them.
  commitment: z.preprocess((v) => (v === '' ? null : v), askCommitmentSchema.optional().nullable()),
  screeningAnswer: z
    .string()
    .trim()
    .max(SCREENING_ANSWER_MAX_LENGTH)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
})

export type AskInput = z.infer<typeof askSchema>

export function parseAskForm(formData: FormData) {
  return askSchema.safeParse({
    helperId: formData.get('helperId') ?? formData.get('mentorId'),
    askType: formData.get('askType') ?? 'mentorship',
    reason: formData.get('reason'),
    helpNeeded: formData.get('helpNeeded'),
    background: formData.get('background'),
    commitment: formData.get('commitment'),
    screeningAnswer: formData.get('screeningAnswer'),
  })
}

export const messageSchema = z.object({
  threadId: z.uuid(),
  body: z.string().trim().min(1).max(4000),
})

export type MessageInput = z.infer<typeof messageSchema>

export function parseMessageForm(formData: FormData) {
  return messageSchema.safeParse({
    threadId: formData.get('threadId'),
    body: formData.get('body'),
  })
}

const checkbox = z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean())

// Mentorship caps are optional at the form level because the form disables
// (via <fieldset disabled>) the cap inputs when openToMentorship is off, and
// disabled inputs don't submit. The lib falls back to the existing DB row
// (or defaults) when undefined so the user's previous caps survive a
// disable→re-enable cycle.
const optionalCap = z.preprocess((v) => {
  if (typeof v === 'string' && v.length > 0) return Number(v)
  if (v === null || v === '' || v === undefined) return undefined
  return v
}, z.number().int().min(1, 'Must be at least 1.').max(100, 'Keep it under 100.').optional())

// Helper settings save the per-type opt-ins plus mentorship-specific limits.
// Advice is a lighter commitment by design; we keep no caps on it for now
// (revisit if abuse appears). The screening prompt is mentorship-only.
export const helperPreferenceSchema = z.object({
  openToAdvice: checkbox,
  openToMentorship: checkbox,
  topics: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((v) =>
      v
        ? v
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    ),
  screeningPrompt: z
    .string()
    .trim()
    .max(280, 'Keep it to one sentence (280 chars).')
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
  maxActiveMentees: optionalCap,
  maxPendingRequests: optionalCap,
})

export type HelperPreferenceInput = z.infer<typeof helperPreferenceSchema>

export function parseHelperPreferenceForm(formData: FormData) {
  return helperPreferenceSchema.safeParse({
    openToAdvice: formData.get('openToAdvice'),
    openToMentorship: formData.get('openToMentorship') ?? formData.get('isOpen'),
    topics: formData.get('topics'),
    screeningPrompt: formData.get('screeningPrompt'),
    maxActiveMentees: formData.get('maxActiveMentees'),
    maxPendingRequests: formData.get('maxPendingRequests'),
  })
}

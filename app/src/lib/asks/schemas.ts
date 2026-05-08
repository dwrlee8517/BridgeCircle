import { z } from 'zod'

export const askTypeSchema = z.enum(['advice', 'mentorship'])
export type AskType = z.infer<typeof askTypeSchema>

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
  helpNeeded: z.string().trim().min(10, 'Be specific (10+ chars).').max(500),
  background: z.string().trim().max(1000).optional().nullable(),
})

export type AskInput = z.infer<typeof askSchema>

export function parseAskForm(formData: FormData) {
  return askSchema.safeParse({
    helperId: formData.get('helperId') ?? formData.get('mentorId'),
    askType: formData.get('askType') ?? 'mentorship',
    reason: formData.get('reason'),
    helpNeeded: formData.get('helpNeeded'),
    background: formData.get('background'),
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
const optionalCap = z.preprocess(
  (v) => {
    if (typeof v === 'string' && v.length > 0) return Number(v)
    if (v === null || v === '' || v === undefined) return undefined
    return v
  },
  z.number().int().min(1, 'Must be at least 1.').max(100, 'Keep it under 100.').optional(),
)

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

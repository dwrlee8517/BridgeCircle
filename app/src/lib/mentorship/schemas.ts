import { z } from 'zod'

export const mentorshipRequestSchema = z.object({
  mentorId: z.uuid(),
  reason: z.string().trim().min(10, 'Tell the mentor a bit about why (10+ chars).').max(500),
  helpNeeded: z.string().trim().min(10, 'Be specific about what help (10+ chars).').max(500),
  background: z.string().trim().max(1000).optional().nullable(),
})

export type MentorshipRequestInput = z.infer<typeof mentorshipRequestSchema>

export function parseMentorshipRequestForm(formData: FormData) {
  return mentorshipRequestSchema.safeParse({
    mentorId: formData.get('mentorId'),
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

const positiveInt = z.preprocess(
  (v) => (typeof v === 'string' && v.length > 0 ? Number(v) : v),
  z.number().int().min(1, 'Must be at least 1.').max(100, 'Keep it under 100.'),
)

export const mentorshipPreferenceSchema = z.object({
  isOpen: checkbox,
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
  maxActiveMentees: positiveInt,
  maxPendingRequests: positiveInt,
})

export type MentorshipPreferenceInput = z.infer<typeof mentorshipPreferenceSchema>

export function parseMentorshipPreferenceForm(formData: FormData) {
  return mentorshipPreferenceSchema.safeParse({
    isOpen: formData.get('isOpen'),
    topics: formData.get('topics'),
    screeningPrompt: formData.get('screeningPrompt'),
    maxActiveMentees: formData.get('maxActiveMentees'),
    maxPendingRequests: formData.get('maxPendingRequests'),
  })
}

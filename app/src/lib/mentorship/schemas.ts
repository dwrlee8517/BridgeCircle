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

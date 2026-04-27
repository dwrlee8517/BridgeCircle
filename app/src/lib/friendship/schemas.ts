import { z } from 'zod'

// Optional context line the sender can attach to a friend request.
// Capped tight — it's a hello, not a bio.
const messageField = z
  .string()
  .trim()
  .max(280)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null))

export const sendFriendRequestSchema = z.object({
  receiverId: z.string().uuid(),
  message: messageField,
})

export const respondToFriendRequestSchema = z.object({
  requestId: z.string().uuid(),
  response: z.enum(['accept', 'decline']),
})

export type SendFriendRequestInput = z.infer<typeof sendFriendRequestSchema>
export type RespondToFriendRequestInput = z.infer<typeof respondToFriendRequestSchema>

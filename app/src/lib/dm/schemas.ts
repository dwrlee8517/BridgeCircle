import { z } from 'zod'

export const sendMessageSchema = z.object({
  threadId: z.string().uuid(),
  body: z.string().trim().min(1).max(4000),
})

export const startThreadSchema = z.object({
  receiverId: z.string().uuid(),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type StartThreadInput = z.infer<typeof startThreadSchema>

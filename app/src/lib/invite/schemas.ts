import { z } from 'zod'

export const inviteCreateSchema = z.object({
  email: z.email().trim().toLowerCase(),
  fullName: z.string().trim().min(1).optional().nullable(),
  graduationYear: z
    .number()
    .int()
    .min(1900)
    .max(2100)
    .optional()
    .nullable(),
})

export type InviteCreateInput = z.infer<typeof inviteCreateSchema>

export const inviteAcceptSchema = z.object({
  token: z.string().min(1),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(72),
})

export type InviteAcceptInput = z.infer<typeof inviteAcceptSchema>

export const signInSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
})

export type SignInInput = z.infer<typeof signInSchema>

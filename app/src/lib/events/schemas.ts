import { z } from 'zod'

export const eventCreateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(200),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
  location: z
    .string()
    .trim()
    .max(200)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
  startsAt: z
    .string()
    .min(1, 'Start time is required.')
    .transform((v, ctx) => {
      const d = new Date(v)
      if (Number.isNaN(d.getTime())) {
        ctx.addIssue({ code: 'custom', message: 'Start time is not a valid date.' })
        return z.NEVER
      }
      return d.toISOString()
    }),
})

export type EventCreateInput = z.infer<typeof eventCreateSchema>

export function parseEventCreateForm(formData: FormData) {
  return eventCreateSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    location: formData.get('location'),
    startsAt: formData.get('startsAt'),
  })
}

export const rsvpSchema = z.object({
  eventId: z.uuid(),
  status: z.enum(['going', 'not_going']),
})

export type RsvpInput = z.infer<typeof rsvpSchema>

export function parseRsvpForm(formData: FormData) {
  return rsvpSchema.safeParse({
    eventId: formData.get('eventId'),
    status: formData.get('status'),
  })
}

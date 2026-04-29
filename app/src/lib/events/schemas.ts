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
  // Empty string → null = unlimited capacity. Positive integer otherwise.
  capacity: z
    .string()
    .optional()
    .nullable()
    .transform((v, ctx) => {
      if (v === null || v === undefined || v === '') return null
      const n = Number.parseInt(v, 10)
      if (Number.isNaN(n) || n <= 0) {
        ctx.addIssue({ code: 'custom', message: 'Capacity must be a positive number.' })
        return z.NEVER
      }
      return n
    }),
})

export type EventCreateInput = z.infer<typeof eventCreateSchema>

export function parseEventCreateForm(formData: FormData) {
  return eventCreateSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    location: formData.get('location'),
    startsAt: formData.get('startsAt'),
    capacity: formData.get('capacity'),
  })
}

// 'waitlisted' is server-resolved (user can't ask for it directly), so the
// RSVP form schema stays at the two user-selectable values.
//
// eventId uses z.guid() (8-4-4-4-12 hex shape, version-agnostic) rather than
// z.uuid() because the latter enforces RFC 9562 version 1-8 in the third
// group. Our seed-dev script generates fixed test UUIDs like
// "eeee0000-0000-0000-0000-000000000001" with version nibble "0", which is
// a valid uuid-shaped string but not a real RFC version. Real Postgres-
// generated UUIDs (v4) pass both validators; switching to z.guid() lets
// seed data work too without weakening security (the value is round-tripped
// through Postgres regardless).
export const rsvpSchema = z.object({
  eventId: z.guid(),
  status: z.enum(['going', 'not_going']),
})

export type RsvpInput = z.infer<typeof rsvpSchema>

export function parseRsvpForm(formData: FormData) {
  return rsvpSchema.safeParse({
    eventId: formData.get('eventId'),
    status: formData.get('status'),
  })
}

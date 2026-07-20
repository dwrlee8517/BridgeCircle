import { z } from 'zod'

export const adminEventSchema = z.object({
  eventId: z.uuid().nullable(),
  title: z.string().trim().min(1, 'Title is required.').max(300),
  description: z
    .string()
    .trim()
    .max(20_000)
    .transform((value) => value || null),
  location: z.string().trim().min(1, 'Location is required.').max(300),
  startsAt: z
    .string()
    .min(1, 'Start time is required.')
    .transform((value, context) => {
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) {
        context.addIssue({ code: 'custom', message: 'Start time is not a valid date.' })
        return z.NEVER
      }
      return date.toISOString()
    }),
  capacity: z.string().transform((value, context) => {
    if (!value) return null
    const number = Number(value)
    if (!Number.isInteger(number) || number <= 0) {
      context.addIssue({ code: 'custom', message: 'Capacity must be a positive number.' })
      return z.NEVER
    }
    return number
  }),
})

export function parseAdminEventForm(formData: FormData) {
  const eventId = formData.get('eventId')
  return adminEventSchema.safeParse({
    eventId: typeof eventId === 'string' && eventId ? eventId : null,
    title: formData.get('title'),
    description: formData.get('description'),
    location: formData.get('location'),
    startsAt: formData.get('startsAt'),
    capacity: formData.get('capacity'),
  })
}

export const adminAnnouncementSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(300),
  body: z.string().trim().min(1, 'Message is required.').max(50_000),
  tag: z.enum(['mentorship', 'hiring', 'reunion', 'general']),
  pinned: z.boolean(),
})

export function parseAdminAnnouncementForm(formData: FormData) {
  return adminAnnouncementSchema.safeParse({
    title: formData.get('title'),
    body: formData.get('body'),
    tag: formData.get('tag'),
    pinned: formData.get('pinned') === 'on',
  })
}

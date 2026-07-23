import { z } from 'zod'
import { isValidTimeZone, localDateTimeToIso } from './admin-event-time'

const DATABASE_TIME_ZONE = /^[A-Za-z_]+(?:\/[A-Za-z0-9_+.-]+)+$/

function formString(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value : ''
}

function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null)
}

function optionalHttpsUrl(label: string) {
  return optionalText(2_000).superRefine((value, context) => {
    if (value && !value.startsWith('https://')) {
      context.addIssue({ code: 'custom', message: `${label} must start with https://.` })
    }
  })
}

function positiveInteger(label: string, minimum = 1, maximum = Number.MAX_SAFE_INTEGER) {
  return z
    .string()
    .trim()
    .transform((value, context) => {
      const number = Number(value)
      if (!value || !Number.isInteger(number) || number < minimum || number > maximum) {
        context.addIssue({
          code: 'custom',
          message:
            minimum === maximum
              ? `${label} must be ${minimum}.`
              : `${label} must be a whole number from ${minimum} to ${maximum}.`,
        })
        return z.NEVER
      }
      return number
    })
}

const scheduleItemSchema = z.object({
  startsAt: z.string(),
  label: z.string().trim().min(1, 'Schedule item is required.').max(500),
})

const factSchema = z
  .object({
    label: z.string().trim().min(1, 'Fact label is required.').max(100),
    value: z.string().trim().min(1, 'Fact value is required.').max(1_000),
    linkLabel: optionalText(100),
    linkUrl: optionalHttpsUrl('Fact link'),
  })
  .superRefine((value, context) => {
    if (Boolean(value.linkLabel) !== Boolean(value.linkUrl)) {
      const missing = value.linkLabel ? 'linkUrl' : 'linkLabel'
      context.addIssue({
        code: 'custom',
        path: [missing],
        message: 'Add both link text and a secure link, or leave both blank.',
      })
    }
  })

const rawAdminEventSchema = z
  .object({
    eventId: z.uuid().nullable(),
    title: z.string().trim().min(1, 'Title is required.').max(300),
    summary: z.string().trim().min(1, 'Summary is required.').max(500),
    description: optionalText(20_000),
    category: z.string().trim().min(1, 'Category is required.').max(80),
    format: z.enum(['in_person', 'online', 'hybrid']),
    timeZone: z
      .string()
      .trim()
      .min(1, 'Time zone is required.')
      .regex(DATABASE_TIME_ZONE, 'Choose a named regional time zone.')
      .refine(isValidTimeZone, 'Choose a valid time zone.'),
    campus: z.enum(['palos_verdes', 'songdo', 'other', 'online']),
    startsAt: z.string().min(1, 'Start time is required.'),
    endsAt: z.string().min(1, 'End time is required.'),
    locationName: optionalText(300),
    locationAddress: optionalText(1_000),
    mapsUrl: optionalHttpsUrl('Maps link'),
    joinUrl: optionalHttpsUrl('Join link'),
    joinWindowMinutes: positiveInteger('Join window', 15, 1_440),
    hostName: z.string().trim().min(1, 'Host is required.').max(200),
    capacity: z
      .string()
      .trim()
      .transform((value, context) => {
        if (!value) return null
        const number = Number(value)
        if (!Number.isInteger(number) || number <= 0) {
          context.addIssue({ code: 'custom', message: 'Capacity must be a positive whole number.' })
          return z.NEVER
        }
        return number
      }),
    allowWaitlist: z.boolean(),
    changeNote: optionalText(1_000),
    schedule: z.array(scheduleItemSchema).max(30),
    facts: z.array(factSchema).max(30),
  })
  .superRefine((value, context) => {
    const startsAt = localDateTimeToIso(value.startsAt, value.timeZone)
    const endsAt = localDateTimeToIso(value.endsAt, value.timeZone)
    if (!startsAt) {
      context.addIssue({
        code: 'custom',
        path: ['startsAt'],
        message: 'Choose a valid start time in this time zone.',
      })
    }
    if (!endsAt) {
      context.addIssue({
        code: 'custom',
        path: ['endsAt'],
        message: 'Choose a valid end time in this time zone.',
      })
    }
    if (startsAt && endsAt && Date.parse(endsAt) <= Date.parse(startsAt)) {
      context.addIssue({
        code: 'custom',
        path: ['endsAt'],
        message: 'End time must be after the start time.',
      })
    }

    value.schedule.forEach((item, index) => {
      if (item.startsAt && !localDateTimeToIso(item.startsAt, value.timeZone)) {
        context.addIssue({
          code: 'custom',
          path: ['schedule', index, 'startsAt'],
          message: 'Choose a valid time in this time zone.',
        })
      }
    })

    if ((value.format === 'in_person' || value.format === 'hybrid') && !value.locationName) {
      context.addIssue({
        code: 'custom',
        path: ['locationName'],
        message: 'Location is required for in-person attendance.',
      })
    }
    if ((value.format === 'online' || value.format === 'hybrid') && !value.joinUrl) {
      context.addIssue({
        code: 'custom',
        path: ['joinUrl'],
        message: 'A secure join link is required for online attendance.',
      })
    }
    if (value.allowWaitlist && value.capacity === null) {
      context.addIssue({
        code: 'custom',
        path: ['allowWaitlist'],
        message: 'Set a capacity before enabling a waitlist.',
      })
    }
  })
  .transform((value) => ({
    ...value,
    startsAt: localDateTimeToIso(value.startsAt, value.timeZone) as string,
    endsAt: localDateTimeToIso(value.endsAt, value.timeZone) as string,
    schedule: value.schedule.map((item) => ({
      label: item.label,
      startsAt: item.startsAt
        ? (localDateTimeToIso(item.startsAt, value.timeZone) as string)
        : null,
    })),
  }))

export const adminEventSchema = rawAdminEventSchema

function indexedRows(formData: FormData, prefix: 'schedule' | 'facts') {
  const indexes = new Set<number>()
  const pattern = new RegExp(`^${prefix}\\.(\\d+)\\.`)
  for (const key of formData.keys()) {
    const match = pattern.exec(key)
    if (match) indexes.add(Number(match[1]))
  }
  return [...indexes].sort((left, right) => left - right)
}

export function parseAdminEventForm(formData: FormData) {
  const eventId = formString(formData.get('eventId'))
  const schedule = indexedRows(formData, 'schedule').map((index) => ({
    startsAt: formString(formData.get(`schedule.${index}.startsAt`)),
    label: formString(formData.get(`schedule.${index}.label`)),
  }))
  const facts = indexedRows(formData, 'facts').map((index) => ({
    label: formString(formData.get(`facts.${index}.label`)),
    value: formString(formData.get(`facts.${index}.value`)),
    linkLabel: formString(formData.get(`facts.${index}.linkLabel`)),
    linkUrl: formString(formData.get(`facts.${index}.linkUrl`)),
  }))

  return adminEventSchema.safeParse({
    eventId: eventId || null,
    title: formString(formData.get('title')),
    summary: formString(formData.get('summary')),
    description: formString(formData.get('description')),
    category: formString(formData.get('category')),
    format: formString(formData.get('format')),
    timeZone: formString(formData.get('timeZone')),
    campus: formString(formData.get('campus')),
    startsAt: formString(formData.get('startsAt')),
    endsAt: formString(formData.get('endsAt')),
    locationName: formString(formData.get('locationName')),
    locationAddress: formString(formData.get('locationAddress')),
    mapsUrl: formString(formData.get('mapsUrl')),
    joinUrl: formString(formData.get('joinUrl')),
    joinWindowMinutes: formString(formData.get('joinWindowMinutes')),
    hostName: formString(formData.get('hostName')),
    capacity: formString(formData.get('capacity')),
    allowWaitlist: formData.get('allowWaitlist') === 'on',
    changeNote: formString(formData.get('changeNote')),
    schedule,
    facts,
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

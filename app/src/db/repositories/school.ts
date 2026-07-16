import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/db/database.types'
import type {
  NewsletterIssue,
  SchoolEventDetail,
  SchoolHome,
  SchoolRepository,
  SchoolResponseResult,
} from '@/lib/school/contracts'

const timestamp = z.string().refine((value) => Number.isFinite(Date.parse(value)))
const nullableText = z.string().nullable()
const optionalNullableText = nullableText.optional().default(null)
const eventBaseSchema = z
  .object({
    id: z.uuid(),
    slug: z.string().min(1),
    status: z.enum(['published', 'cancelled']),
    phase: z.enum(['upcoming', 'changed', 'cancelled', 'past']),
    category: z.string().min(1),
    title: z.string().min(1),
    summary: optionalNullableText,
    format: z.enum(['in_person', 'online', 'hybrid']),
    timeZone: z.string().min(1),
    campus: z.enum(['palos_verdes', 'songdo', 'other', 'online']),
    startsAt: timestamp,
    endsAt: timestamp.nullable().optional().default(null),
    locationName: optionalNullableText,
    joinUrl: optionalNullableText,
    hostName: z.string().min(1),
    capacity: z.number().int().positive().nullable().optional().default(null),
    spotsLeft: z.number().int().nonnegative().nullable().optional().default(null),
    allowWaitlist: z.boolean(),
    viewerRsvp: z.enum(['none', 'going', 'waitlisted', 'offered', 'not_going']),
    offerExpiresAt: timestamp.nullable().optional().default(null),
    goingCount: z.number().int().nonnegative(),
    circleGoingCount: z.number().int().nonnegative(),
    changedAt: timestamp.nullable().optional().default(null),
    changeNote: optionalNullableText,
    cancellationNote: optionalNullableText,
  })
  .strict()

const eventDetailSchema = eventBaseSchema
  .extend({
    description: optionalNullableText,
    locationAddress: optionalNullableText,
    mapsUrl: optionalNullableText,
    hostUserId: z.uuid().nullable().optional().default(null),
    schedule: z.array(
      z
        .object({
          id: z.coerce.number().int().positive(),
          position: z.number().int().nonnegative(),
          startsAt: timestamp.nullable(),
          label: z.string().min(1),
        })
        .strict(),
    ),
    facts: z.array(
      z
        .object({
          id: z.coerce.number().int().positive(),
          position: z.number().int().nonnegative(),
          label: z.string().min(1),
          value: z.string().min(1),
          linkLabel: optionalNullableText,
          linkUrl: optionalNullableText,
        })
        .strict(),
    ),
  })
  .strict()

const announcementSummarySchema = z
  .object({
    id: z.uuid(),
    tag: z.enum(['mentorship', 'hiring', 'reunion', 'general']),
    title: z.string().min(1),
    summary: z.string().min(1),
    pinned: z.boolean(),
    publishedAt: timestamp,
    unread: z.boolean(),
  })
  .strict()

const announcementSchema = z
  .object({
    id: z.uuid(),
    tag: z.enum(['mentorship', 'hiring', 'reunion', 'general']),
    title: z.string().min(1),
    body: z.string().min(1),
    pinned: z.boolean(),
    publishedAt: timestamp,
    authorName: nullableText,
  })
  .strict()

const newsletterSummarySchema = z
  .object({
    id: z.uuid(),
    slug: z.string().min(1),
    issueNumber: z.number().int().positive(),
    title: z.string().min(1),
    summary: nullableText,
    publishedAt: timestamp,
  })
  .strict()

const newsletterIssueSchema = newsletterSummarySchema
  .extend({
    sections: z.array(
      z
        .object({
          id: z.coerce.number().int().positive(),
          position: z.number().int().nonnegative(),
          heading: z.string().min(1),
          body: z.string().min(1),
          linkLabel: optionalNullableText,
          linkUrl: optionalNullableText,
        })
        .strict(),
    ),
  })
  .strict()

const unavailableSchema = z.object({ resultCode: z.literal('not_available') }).strict()
const homeSchema = z
  .object({
    resultCode: z.literal('ok'),
    organization: z.object({ id: z.uuid(), name: z.string().min(1) }).strict(),
    events: z.array(eventBaseSchema),
    announcements: z.array(announcementSummarySchema),
    latestNewsletter: newsletterSummarySchema.nullable(),
  })
  .strict()
const eventResultSchema = z.union([
  unavailableSchema,
  z.object({ resultCode: z.literal('ok'), event: eventDetailSchema }).strict(),
])
const attendeeResultSchema = z.union([
  unavailableSchema,
  z
    .object({
      resultCode: z.literal('ok'),
      totalCount: z.number().int().nonnegative(),
      hiddenCount: z.number().int().nonnegative(),
      items: z.array(
        z
          .object({
            membershipId: z.uuid(),
            userId: z.uuid(),
            displayName: z.string().min(1),
            preferredName: nullableText,
            avatarPath: nullableText,
            graduationYear: z.number().int().nullable(),
            inCircle: z.boolean(),
          })
          .strict(),
      ),
    })
    .strict(),
])
const announcementListSchema = z.union([
  unavailableSchema,
  z.object({ resultCode: z.literal('ok'), items: z.array(announcementSummarySchema) }).strict(),
])
const announcementResultSchema = z.union([
  unavailableSchema,
  z.object({ resultCode: z.literal('ok'), announcement: announcementSchema }).strict(),
])
const newsletterListSchema = z.union([
  unavailableSchema,
  z.object({ resultCode: z.literal('ok'), items: z.array(newsletterSummarySchema) }).strict(),
])
const newsletterResultSchema = z.union([
  unavailableSchema,
  z.object({ resultCode: z.literal('ok'), issue: newsletterIssueSchema }).strict(),
])
const responseResultSchema = z.enum([
  'going',
  'waitlisted',
  'not_going',
  'full',
  'not_open',
  'not_available',
  'not_offered',
  'offer_expired',
])
const adminEventSchema = z
  .object({
    id: z.uuid(),
    status: z.enum(['draft', 'published', 'cancelled']),
    title: z.string().min(1),
    description: nullableText,
    location: z.string().min(1),
    startsAt: timestamp,
    endsAt: timestamp.nullable(),
    capacity: z.number().int().positive().nullable(),
    goingCount: z.number().int().nonnegative(),
    waitlistCount: z.number().int().nonnegative(),
  })
  .strict()
const adminAnnouncementSchema = z
  .object({
    id: z.uuid(),
    tag: z.enum(['mentorship', 'hiring', 'reunion', 'general']),
    title: z.string().min(1),
    body: z.string().min(1),
    pinned: z.boolean(),
    publishedAt: timestamp.nullable(),
  })
  .strict()

function transportError(operation: string, error: { code?: string } | null): never {
  const code = error?.code ? ` (${error.code})` : ''
  throw new Error(`School ${operation} transport failed${code}`)
}

export function createSchoolRepository(client: SupabaseClient<Database>): SchoolRepository {
  return {
    async getHome(membershipId): Promise<SchoolHome | null> {
      const { data, error } = await client
        .schema('api')
        .rpc('get_school_home', { p_membership_id: membershipId })
      if (error) transportError('getHome', error)
      const parsed = z.union([unavailableSchema, homeSchema]).parse(data)
      if (parsed.resultCode === 'not_available') return null
      const { resultCode: _resultCode, ...home } = parsed
      return home
    },

    async getEvent(membershipId, eventId): Promise<SchoolEventDetail | null> {
      const { data, error } = await client
        .schema('api')
        .rpc('get_school_event', { p_membership_id: membershipId, p_event_id: eventId })
      if (error) transportError('getEvent', error)
      const parsed = eventResultSchema.parse(data)
      return parsed.resultCode === 'ok' ? parsed.event : null
    },

    async listEventAttendees(membershipId, eventId) {
      const { data, error } = await client.schema('api').rpc('list_school_event_attendees', {
        p_membership_id: membershipId,
        p_event_id: eventId,
        p_limit: 50,
      })
      if (error) transportError('listEventAttendees', error)
      const parsed = attendeeResultSchema.parse(data)
      if (parsed.resultCode === 'not_available') return null
      const { resultCode: _resultCode, ...attendees } = parsed
      return attendees
    },

    async respondToEvent(membershipId, eventId, intent): Promise<SchoolResponseResult> {
      const { data, error } = await client.schema('api').rpc('respond_school_event', {
        p_membership_id: membershipId,
        p_event_id: eventId,
        p_intent: intent,
      })
      if (error) transportError('respondToEvent', error)
      return responseResultSchema.parse(data)
    },

    async listAnnouncements(membershipId, tag) {
      const { data, error } = await client.schema('api').rpc('list_school_announcements', {
        p_membership_id: membershipId,
        p_tag: tag,
        p_limit: 50,
      })
      if (error) transportError('listAnnouncements', error)
      const parsed = announcementListSchema.parse(data)
      return parsed.resultCode === 'ok' ? parsed.items : null
    },

    async getAnnouncement(membershipId, announcementId) {
      const { data, error } = await client.schema('api').rpc('get_school_announcement', {
        p_membership_id: membershipId,
        p_announcement_id: announcementId,
      })
      if (error) transportError('getAnnouncement', error)
      const parsed = announcementResultSchema.parse(data)
      return parsed.resultCode === 'ok' ? parsed.announcement : null
    },

    async markAnnouncementRead(membershipId, announcementId) {
      const { data, error } = await client.schema('api').rpc('mark_school_announcement_read', {
        p_membership_id: membershipId,
        p_announcement_id: announcementId,
      })
      if (error) transportError('markAnnouncementRead', error)
      return z.enum(['read', 'not_available']).parse(data)
    },

    async listNewsletterIssues(membershipId) {
      const { data, error } = await client.schema('api').rpc('list_newsletter_issues', {
        p_membership_id: membershipId,
        p_limit: 50,
      })
      if (error) transportError('listNewsletterIssues', error)
      const parsed = newsletterListSchema.parse(data)
      return parsed.resultCode === 'ok' ? parsed.items : null
    },

    async getNewsletterIssue(membershipId, issueSlug): Promise<NewsletterIssue | null> {
      const { data, error } = await client.schema('api').rpc('get_newsletter_issue', {
        p_membership_id: membershipId,
        p_issue_slug: issueSlug,
      })
      if (error) transportError('getNewsletterIssue', error)
      const parsed = newsletterResultSchema.parse(data)
      return parsed.resultCode === 'ok' ? parsed.issue : null
    },

    async getAdminEvents(membershipId) {
      const { data, error } = await client
        .schema('api')
        .rpc('get_admin_school_events', { p_membership_id: membershipId })
      if (error) transportError('getAdminEvents', error)
      const parsed = z
        .union([
          unavailableSchema,
          z.object({ resultCode: z.literal('ok'), items: z.array(adminEventSchema) }).strict(),
        ])
        .parse(data)
      return parsed.resultCode === 'ok' ? parsed.items : null
    },

    async saveAdminEvent(input) {
      const { data, error } = await client.schema('api').rpc('save_admin_school_event', {
        p_membership_id: input.membershipId,
        p_event_id: input.eventId ?? undefined,
        p_title: input.title,
        p_description: input.description ?? undefined,
        p_location: input.location,
        p_starts_at: input.startsAt,
        p_capacity: input.capacity ?? undefined,
      })
      if (error) transportError('saveAdminEvent', error)
      const parsed = z
        .object({
          resultCode: z.enum([
            'created',
            'updated',
            'past_start',
            'invalid_input',
            'cancelled',
            'not_available',
          ]),
          eventId: z.uuid().optional(),
        })
        .strict()
        .parse(data)
      return parsed.resultCode
    },

    async cancelAdminEvent(membershipId, eventId, reason) {
      const { data, error } = await client.schema('api').rpc('cancel_admin_school_event', {
        p_membership_id: membershipId,
        p_event_id: eventId,
        p_reason: reason ?? undefined,
      })
      if (error) transportError('cancelAdminEvent', error)
      return z.enum(['cancelled', 'already_cancelled', 'not_available']).parse(data)
    },

    async deleteAdminEvent(membershipId, eventId) {
      const { data, error } = await client.schema('api').rpc('delete_admin_school_event', {
        p_membership_id: membershipId,
        p_event_id: eventId,
      })
      if (error) transportError('deleteAdminEvent', error)
      return z.enum(['deleted', 'has_responses', 'not_available']).parse(data)
    },

    async getAdminAnnouncements(membershipId) {
      const { data, error } = await client
        .schema('api')
        .rpc('get_admin_school_announcements', { p_membership_id: membershipId })
      if (error) transportError('getAdminAnnouncements', error)
      const parsed = z
        .union([
          unavailableSchema,
          z
            .object({
              resultCode: z.literal('ok'),
              items: z.array(adminAnnouncementSchema),
            })
            .strict(),
        ])
        .parse(data)
      return parsed.resultCode === 'ok' ? parsed.items : null
    },

    async publishAdminAnnouncement(input) {
      const { data, error } = await client.schema('api').rpc('publish_admin_school_announcement', {
        p_membership_id: input.membershipId,
        p_title: input.title,
        p_body: input.body,
        p_tag: input.tag,
        p_pinned: input.pinned,
      })
      if (error) transportError('publishAdminAnnouncement', error)
      return z
        .object({
          resultCode: z.enum(['published', 'invalid_input', 'not_available']),
          announcementId: z.uuid().optional(),
        })
        .strict()
        .parse(data).resultCode
    },
  }
}

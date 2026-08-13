import { getMemberContext } from '@/db/repositories/member-context'
import { createSchoolRepository } from '@/db/repositories/school'
import type {
  NewsletterIssue,
  NewsletterSummary,
  SchoolAnnouncement,
  SchoolAnnouncementFilter,
  SchoolAnnouncementSummary,
  SchoolEventAttendees,
  SchoolEventCard,
  SchoolEventDetail,
  SchoolHome,
  SchoolResponseIntent,
  SchoolResponseResult,
} from '@/lib/school/contracts'
import { builder } from '../builder'

/**
 * School — events, announcements, newsletter — re-pointed onto v2, delegating
 * to `db/repositories/school`. Vertical slice: member reads plus the two
 * member commands (respondToSchoolEvent, markAnnouncementRead). Admin
 * operations (save/cancel/delete event, publish announcement) are the admin
 * console's concern and land with an admin slice.
 *
 * No connections here on purpose: the school RPCs return bounded whole lists
 * (a school has dozens of events, not thousands), so lists are plain arrays —
 * the same honest-modeling call as peopleSearch.
 *
 * The RSVP vocabularies are richer than a going/not-going toggle: intents
 * include the waitlist-offer flow (JOIN_WAITLIST, ACCEPT_OFFER, PASS_OFFER)
 * and results include FULL / NOT_OFFERED / OFFER_EXPIRED — v2's event-capacity
 * state machine, exposed verbatim.
 */

const EventFormatEnum = builder.enumType('SchoolEventFormat', {
  values: ['IN_PERSON', 'ONLINE', 'HYBRID'] as const,
})

const EventPhaseEnum = builder.enumType('SchoolEventPhase', {
  values: ['UPCOMING', 'CHANGED', 'CANCELLED', 'PAST'] as const,
})

const RsvpStatusEnum = builder.enumType('SchoolRsvpStatus', {
  values: ['NONE', 'GOING', 'WAITLISTED', 'OFFERED', 'NOT_GOING'] as const,
})

const CampusEnum = builder.enumType('SchoolCampus', {
  values: ['PALOS_VERDES', 'SONGDO', 'OTHER', 'ONLINE'] as const,
})

const AnnouncementTagEnum = builder.enumType('SchoolAnnouncementTag', {
  values: ['MENTORSHIP', 'HIRING', 'REUNION', 'GENERAL'] as const,
})

const AnnouncementFilterEnum = builder.enumType('SchoolAnnouncementFilter', {
  values: ['ALL', 'MENTORSHIP', 'HIRING', 'REUNION', 'GENERAL'] as const,
})

const ResponseIntentEnum = builder.enumType('SchoolResponseIntent', {
  values: ['GOING', 'NOT_GOING', 'JOIN_WAITLIST', 'ACCEPT_OFFER', 'PASS_OFFER'] as const,
})

const ResponseResultEnum = builder.enumType('SchoolResponseResult', {
  values: [
    'GOING',
    'WAITLISTED',
    'NOT_GOING',
    'FULL',
    'NOT_OPEN',
    'NOT_AVAILABLE',
    'NOT_OFFERED',
    'OFFER_EXPIRED',
  ] as const,
})

const upper = <T extends string>(v: T) => v.toUpperCase() as Uppercase<T>

// Shared card fields between the list card and the detail. Typed against the
// card shape; the detail's builder is cast to this (safe — SchoolEventDetail
// structurally extends SchoolEventCard, and only card fields are built here).
type CardFieldBuilder = PothosSchemaTypes.ObjectFieldBuilder<
  PothosSchemaTypes.ExtendDefaultTypes<{ Context: import('../context').GraphQLContext }>,
  SchoolEventCard
>

function eventCardFields(t: CardFieldBuilder) {
  return {
    id: t.exposeID('id', { nullable: false }),
    slug: t.exposeString('slug', { nullable: false }),
    phase: t.field({
      type: EventPhaseEnum,
      nullable: false,
      resolve: (e: SchoolEventCard) => upper(e.phase),
    }),
    category: t.exposeString('category', { nullable: false }),
    title: t.exposeString('title', { nullable: false }),
    summary: t.exposeString('summary', { nullable: true }),
    format: t.field({
      type: EventFormatEnum,
      nullable: false,
      resolve: (e: SchoolEventCard) => upper(e.format),
    }),
    timeZone: t.exposeString('timeZone', { nullable: false }),
    campus: t.field({
      type: CampusEnum,
      nullable: false,
      resolve: (e: SchoolEventCard) => upper(e.campus),
    }),
    startsAt: t.exposeString('startsAt', { nullable: false }),
    endsAt: t.exposeString('endsAt', { nullable: true }),
    locationName: t.exposeString('locationName', { nullable: true }),
    hostName: t.exposeString('hostName', { nullable: false }),
    capacity: t.exposeInt('capacity', { nullable: true }),
    spotsLeft: t.exposeInt('spotsLeft', { nullable: true }),
    allowWaitlist: t.exposeBoolean('allowWaitlist', { nullable: false }),
    viewerRsvp: t.field({
      type: RsvpStatusEnum,
      nullable: false,
      resolve: (e: SchoolEventCard) => upper(e.viewerRsvp),
    }),
    offerExpiresAt: t.exposeString('offerExpiresAt', { nullable: true }),
    goingCount: t.exposeInt('goingCount', { nullable: false }),
    circleGoingCount: t.exposeInt('circleGoingCount', { nullable: false }),
    changedAt: t.exposeString('changedAt', { nullable: true }),
    changeNote: t.exposeString('changeNote', { nullable: true }),
    cancellationNote: t.exposeString('cancellationNote', { nullable: true }),
    joinUrl: t.exposeString('joinUrl', { nullable: true }),
  }
}

const SchoolEventCardRef = builder.objectRef<SchoolEventCard>('SchoolEventCard')
SchoolEventCardRef.implement({
  description: 'An event card on the School hub.',
  fields: (t) => eventCardFields(t),
})

const ScheduleItemRef =
  builder.objectRef<SchoolEventDetail['schedule'][number]>('SchoolEventScheduleItem')
ScheduleItemRef.implement({
  fields: (t) => ({
    id: t.exposeInt('id', { nullable: false }),
    position: t.exposeInt('position', { nullable: false }),
    startsAt: t.exposeString('startsAt', { nullable: true }),
    label: t.exposeString('label', { nullable: false }),
  }),
})

const EventFactRef = builder.objectRef<SchoolEventDetail['facts'][number]>('SchoolEventFact')
EventFactRef.implement({
  fields: (t) => ({
    id: t.exposeInt('id', { nullable: false }),
    position: t.exposeInt('position', { nullable: false }),
    label: t.exposeString('label', { nullable: false }),
    value: t.exposeString('value', { nullable: false }),
    linkLabel: t.exposeString('linkLabel', { nullable: true }),
    linkUrl: t.exposeString('linkUrl', { nullable: true }),
  }),
})

const SchoolEventRef = builder.objectRef<SchoolEventDetail>('SchoolEvent')
SchoolEventRef.implement({
  description: 'Full event detail: the card fields plus description, schedule, and facts.',
  fields: (t) => ({
    ...eventCardFields(t as unknown as CardFieldBuilder),
    description: t.exposeString('description', { nullable: true }),
    locationAddress: t.exposeString('locationAddress', { nullable: true }),
    mapsUrl: t.exposeString('mapsUrl', { nullable: true }),
    hostUserId: t.exposeID('hostUserId', { nullable: true }),
    schedule: t.field({
      type: [ScheduleItemRef],
      nullable: { list: false, items: false },
      resolve: (e) => e.schedule,
    }),
    facts: t.field({
      type: [EventFactRef],
      nullable: { list: false, items: false },
      resolve: (e) => e.facts,
    }),
  }),
})

const AttendeeRef = builder.objectRef<SchoolEventAttendees['items'][number]>('SchoolEventAttendee')
AttendeeRef.implement({
  fields: (t) => ({
    membershipId: t.exposeID('membershipId', { nullable: false }),
    userId: t.exposeID('userId', { nullable: false }),
    displayName: t.exposeString('displayName', { nullable: false }),
    preferredName: t.exposeString('preferredName', { nullable: true }),
    avatarPath: t.exposeString('avatarPath', { nullable: true }),
    graduationYear: t.exposeInt('graduationYear', { nullable: true }),
    inCircle: t.exposeBoolean('inCircle', { nullable: false }),
  }),
})

const AttendeesRef = builder.objectRef<SchoolEventAttendees>('SchoolEventAttendees')
AttendeesRef.implement({
  description:
    'Going attendees visible to the viewer. hiddenCount are members whose privacy hides them.',
  fields: (t) => ({
    totalCount: t.exposeInt('totalCount', { nullable: false }),
    hiddenCount: t.exposeInt('hiddenCount', { nullable: false }),
    items: t.field({
      type: [AttendeeRef],
      nullable: { list: false, items: false },
      resolve: (a) => a.items,
    }),
  }),
})

const AnnouncementSummaryRef = builder.objectRef<SchoolAnnouncementSummary>(
  'SchoolAnnouncementSummary',
)
AnnouncementSummaryRef.implement({
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    tag: t.field({
      type: AnnouncementTagEnum,
      nullable: false,
      resolve: (a) => upper(a.tag),
    }),
    title: t.exposeString('title', { nullable: false }),
    summary: t.exposeString('summary', { nullable: false }),
    pinned: t.exposeBoolean('pinned', { nullable: false }),
    publishedAt: t.exposeString('publishedAt', { nullable: false }),
    unread: t.exposeBoolean('unread', { nullable: false }),
  }),
})

const AnnouncementRef = builder.objectRef<SchoolAnnouncement>('SchoolAnnouncement')
AnnouncementRef.implement({
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    tag: t.field({
      type: AnnouncementTagEnum,
      nullable: false,
      resolve: (a) => upper(a.tag),
    }),
    title: t.exposeString('title', { nullable: false }),
    body: t.exposeString('body', { nullable: false }),
    pinned: t.exposeBoolean('pinned', { nullable: false }),
    publishedAt: t.exposeString('publishedAt', { nullable: false }),
    authorName: t.exposeString('authorName', { nullable: true }),
  }),
})

const NewsletterSummaryRef = builder.objectRef<NewsletterSummary>('NewsletterSummary')
NewsletterSummaryRef.implement({
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    slug: t.exposeString('slug', { nullable: false }),
    issueNumber: t.exposeInt('issueNumber', { nullable: false }),
    title: t.exposeString('title', { nullable: false }),
    summary: t.exposeString('summary', { nullable: true }),
    publishedAt: t.exposeString('publishedAt', { nullable: false }),
  }),
})

const NewsletterSectionRef =
  builder.objectRef<NewsletterIssue['sections'][number]>('NewsletterSection')
NewsletterSectionRef.implement({
  fields: (t) => ({
    id: t.exposeInt('id', { nullable: false }),
    position: t.exposeInt('position', { nullable: false }),
    heading: t.exposeString('heading', { nullable: false }),
    body: t.exposeString('body', { nullable: false }),
    linkLabel: t.exposeString('linkLabel', { nullable: true }),
    linkUrl: t.exposeString('linkUrl', { nullable: true }),
  }),
})

const NewsletterIssueRef = builder.objectRef<NewsletterIssue>('NewsletterIssue')
NewsletterIssueRef.implement({
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    slug: t.exposeString('slug', { nullable: false }),
    issueNumber: t.exposeInt('issueNumber', { nullable: false }),
    title: t.exposeString('title', { nullable: false }),
    summary: t.exposeString('summary', { nullable: true }),
    publishedAt: t.exposeString('publishedAt', { nullable: false }),
    sections: t.field({
      type: [NewsletterSectionRef],
      nullable: { list: false, items: false },
      resolve: (n) => n.sections,
    }),
  }),
})

const SchoolOrgRef = builder.objectRef<SchoolHome['organization']>('SchoolOrganization')
SchoolOrgRef.implement({
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    name: t.exposeString('name', { nullable: false }),
  }),
})

const SchoolHomeRef = builder.objectRef<SchoolHome>('SchoolHome')
SchoolHomeRef.implement({
  description: 'The School hub: upcoming events, announcements, latest newsletter.',
  fields: (t) => ({
    organization: t.field({ type: SchoolOrgRef, nullable: false, resolve: (h) => h.organization }),
    events: t.field({
      type: [SchoolEventCardRef],
      nullable: { list: false, items: false },
      resolve: (h) => h.events,
    }),
    announcements: t.field({
      type: [AnnouncementSummaryRef],
      nullable: { list: false, items: false },
      resolve: (h) => h.announcements,
    }),
    latestNewsletter: t.field({
      type: NewsletterSummaryRef,
      nullable: true,
      resolve: (h) => h.latestNewsletter,
    }),
  }),
})

const RespondPayloadRef = builder.objectRef<{ result: SchoolResponseResult }>(
  'RespondSchoolEventPayload',
)
RespondPayloadRef.implement({
  fields: (t) => ({
    result: t.field({
      type: ResponseResultEnum,
      nullable: false,
      resolve: (p) => upper(p.result),
    }),
  }),
})

const MarkAnnouncementReadStatus = builder.enumType('MarkAnnouncementReadStatus', {
  values: ['READ', 'NOT_AVAILABLE'] as const,
})

async function viewerMembershipId(supabase: Parameters<typeof getMemberContext>[0]) {
  const context = await getMemberContext(supabase)
  return context.selectedMembershipId ?? context.memberships[0]?.membershipId ?? null
}

builder.queryFields((t) => ({
  /** The School hub, or null when unauthenticated / no membership. */
  schoolHome: t.field({
    type: SchoolHomeRef,
    nullable: true,
    resolve: async (_root, _args, ctx): Promise<SchoolHome | null> => {
      if (!ctx.session) return null
      const membershipId = await viewerMembershipId(ctx.supabase)
      if (!membershipId) return null
      return createSchoolRepository(ctx.supabase).getHome(membershipId)
    },
  }),

  /** A school event by id, with schedule and facts. */
  schoolEvent: t.field({
    type: SchoolEventRef,
    nullable: true,
    args: { id: t.arg.id({ required: true }) },
    resolve: async (_root, { id }, ctx): Promise<SchoolEventDetail | null> => {
      if (!ctx.session) return null
      const membershipId = await viewerMembershipId(ctx.supabase)
      if (!membershipId) return null
      return createSchoolRepository(ctx.supabase).getEvent(membershipId, String(id))
    },
  }),

  /** Going attendees for an event (privacy-aware; hiddenCount for the rest). */
  schoolEventAttendees: t.field({
    type: AttendeesRef,
    nullable: true,
    args: { eventId: t.arg.id({ required: true }) },
    resolve: async (_root, { eventId }, ctx): Promise<SchoolEventAttendees | null> => {
      if (!ctx.session) return null
      const membershipId = await viewerMembershipId(ctx.supabase)
      if (!membershipId) return null
      return createSchoolRepository(ctx.supabase).listEventAttendees(membershipId, String(eventId))
    },
  }),

  /** Announcements, optionally filtered by tag. */
  schoolAnnouncements: t.field({
    type: [AnnouncementSummaryRef],
    nullable: { list: true, items: false },
    args: { filter: t.arg({ type: AnnouncementFilterEnum, required: false }) },
    resolve: async (_root, args, ctx): Promise<SchoolAnnouncementSummary[] | null> => {
      if (!ctx.session) return null
      const membershipId = await viewerMembershipId(ctx.supabase)
      if (!membershipId) return null
      const tag = (args.filter?.toLowerCase() ?? 'all') as SchoolAnnouncementFilter
      return createSchoolRepository(ctx.supabase).listAnnouncements(membershipId, tag)
    },
  }),

  /** A single announcement. */
  schoolAnnouncement: t.field({
    type: AnnouncementRef,
    nullable: true,
    args: { id: t.arg.id({ required: true }) },
    resolve: async (_root, { id }, ctx): Promise<SchoolAnnouncement | null> => {
      if (!ctx.session) return null
      const membershipId = await viewerMembershipId(ctx.supabase)
      if (!membershipId) return null
      return createSchoolRepository(ctx.supabase).getAnnouncement(membershipId, String(id))
    },
  }),

  /** Newsletter archive, newest first. */
  newsletterIssues: t.field({
    type: [NewsletterSummaryRef],
    nullable: { list: true, items: false },
    resolve: async (_root, _args, ctx): Promise<NewsletterSummary[] | null> => {
      if (!ctx.session) return null
      const membershipId = await viewerMembershipId(ctx.supabase)
      if (!membershipId) return null
      return createSchoolRepository(ctx.supabase).listNewsletterIssues(membershipId)
    },
  }),

  /** A newsletter issue by slug, with its sections. */
  newsletterIssue: t.field({
    type: NewsletterIssueRef,
    nullable: true,
    args: { slug: t.arg.string({ required: true }) },
    resolve: async (_root, { slug }, ctx): Promise<NewsletterIssue | null> => {
      if (!ctx.session) return null
      const membershipId = await viewerMembershipId(ctx.supabase)
      if (!membershipId) return null
      return createSchoolRepository(ctx.supabase).getNewsletterIssue(membershipId, slug)
    },
  }),
}))

builder.mutationFields((t) => ({
  /**
   * Respond to a school event. Intents cover the full waitlist-offer flow
   * (GOING / NOT_GOING / JOIN_WAITLIST / ACCEPT_OFFER / PASS_OFFER); the
   * result is the resolved state — FULL, NOT_OFFERED, and OFFER_EXPIRED are
   * first-class outcomes of v2's capacity state machine, not errors.
   */
  respondToSchoolEvent: t.field({
    type: RespondPayloadRef,
    nullable: false,
    args: {
      eventId: t.arg.id({ required: true }),
      intent: t.arg({ type: ResponseIntentEnum, required: true }),
    },
    resolve: async (_root, args, ctx): Promise<{ result: SchoolResponseResult }> => {
      if (!ctx.session) return { result: 'not_available' }
      const membershipId = await viewerMembershipId(ctx.supabase)
      if (!membershipId) return { result: 'not_available' }
      const result = await createSchoolRepository(ctx.supabase).respondToEvent(
        membershipId,
        String(args.eventId),
        args.intent.toLowerCase() as SchoolResponseIntent,
      )
      return { result }
    },
  }),

  /** Mark an announcement read for the viewer. Idempotent. */
  markAnnouncementRead: t.field({
    type: MarkAnnouncementReadStatus,
    nullable: false,
    args: { announcementId: t.arg.id({ required: true }) },
    resolve: async (_root, args, ctx): Promise<'READ' | 'NOT_AVAILABLE'> => {
      if (!ctx.session) return 'NOT_AVAILABLE'
      const membershipId = await viewerMembershipId(ctx.supabase)
      if (!membershipId) return 'NOT_AVAILABLE'
      const result = await createSchoolRepository(ctx.supabase).markAnnouncementRead(
        membershipId,
        String(args.announcementId),
      )
      return upper(result)
    },
  }),
}))

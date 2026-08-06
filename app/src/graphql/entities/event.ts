import { type ResolveCursorConnectionArgs, resolveCursorConnection } from '@pothos/plugin-relay'
import { getAppOrigin } from '@/lib/auth/app-url'
import { getEvent } from '@/lib/events/getEvent'
import type { EventRow, RsvpStatus } from '@/lib/events/listEvents'
import { listEventsPage } from '@/lib/events/listEventsPage'
import { respondRsvp } from '@/lib/events/respondRsvp'
import type { RsvpInput } from '@/lib/events/schemas'
import { getActiveOrganizationId } from '@/lib/members/getActiveOrganizationId'
import { encodeKeysetCursor } from '@/lib/pagination/keyset'
import { builder } from '../builder'

/**
 * Events — Slice 2, and the first Relay **connection**. `eventsConnection`
 * pages with opaque keyset cursors over `(starts_at, id)`, delegating to
 * `lib/events/listEventsPage` so a page's contents match the existing
 * `listEvents` for the same window. `event(id)` delegates to `getEvent`.
 *
 * The node is the list shape (`EventRow`); detail-only fields (endsAt,
 * isPast, …) arrive with the events-detail slice.
 */
const EventRsvpStatus = builder.enumType('RsvpStatus', {
  values: ['GOING', 'NOT_GOING', 'WAITLISTED'] as const,
})

const EventRef = builder.objectRef<EventRow>('Event')
EventRef.implement({
  description: 'An organization event.',
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    title: t.exposeString('title', { nullable: false }),
    description: t.exposeString('description', { nullable: true }),
    location: t.exposeString('location', { nullable: true }),
    startsAt: t.exposeString('startsAt', { nullable: false }),
    publishedAt: t.exposeString('publishedAt', { nullable: true }),
    goingCount: t.exposeInt('goingCount', { nullable: false }),
    waitlistCount: t.exposeInt('waitlistCount', { nullable: false }),
    capacity: t.exposeInt('capacity', { nullable: true }),
    // The viewer's own RSVP. Enum-cased ('going' → GOING) from the /lib value.
    viewerRsvp: t.field({
      type: EventRsvpStatus,
      nullable: true,
      resolve: (e) => (e.viewerRsvp ? (e.viewerRsvp.toUpperCase() as Uppercase<RsvpStatus>) : null),
    }),
  }),
})

const toEventCursor = (e: EventRow) => encodeKeysetCursor(e.startsAt, e.id)

builder.queryFields((t) => ({
  /** A single event by id, or null when RLS hides it (unpublished / other org). */
  event: t.field({
    type: EventRef,
    nullable: true,
    args: { id: t.arg.id({ required: true }) },
    resolve: async (_root, { id }, ctx): Promise<EventRow | null> => {
      if (!ctx.session) return null
      const d = await getEvent(ctx.supabase, String(id), ctx.session.userId)
      if (!d) return null
      // getEvent returns the richer EventDetail; expose the EventRow subset.
      return {
        id: d.id,
        title: d.title,
        description: d.description,
        location: d.location,
        startsAt: d.startsAt,
        publishedAt: d.publishedAt,
        goingCount: d.goingCount,
        waitlistCount: d.waitlistCount,
        capacity: d.capacity,
        viewerRsvp: d.viewerRsvp,
      }
    },
  }),

  /** Upcoming published events for the caller's org, keyset-paginated. */
  eventsConnection: t.connection(
    {
      type: EventRef,
      resolve: async (_root, args, ctx) => {
        const empty = () => resolveCursorConnection({ args, toCursor: toEventCursor }, () => [])
        if (!ctx.session) return empty()
        const organizationId = await getActiveOrganizationId(ctx.supabase, ctx.session.userId)
        if (!organizationId) return empty()
        const viewerId = ctx.session.userId

        return resolveCursorConnection(
          { args, toCursor: toEventCursor },
          ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
            listEventsPage(ctx.supabase, {
              organizationId,
              viewerId,
              before,
              after,
              limit,
              inverted,
            }),
        )
      },
    },
    { name: 'EventConnection' },
    { name: 'EventEdge' },
  ),
}))

// The two states a member can submit; 'waitlisted' is derived by the /lib
// function based on capacity, never sent by the client.
const RsvpResponse = builder.enumType('RsvpResponse', {
  values: ['GOING', 'NOT_GOING'] as const,
})

const RespondRsvpError = builder.enumType('RespondRsvpError', {
  values: ['EVENT_NOT_FOUND', 'DB_ERROR', 'NOT_AUTHENTICATED'] as const,
})

type RespondRsvpErrorValue = 'EVENT_NOT_FOUND' | 'DB_ERROR' | 'NOT_AUTHENTICATED'
type RespondRsvpPayload = {
  // The resolved status — may be WAITLISTED even when the member sent GOING.
  status: Uppercase<'going' | 'not_going' | 'waitlisted'> | null
  error: RespondRsvpErrorValue | null
}

const RespondRsvpPayloadRef = builder.objectRef<RespondRsvpPayload>('RespondRsvpPayload')
RespondRsvpPayloadRef.implement({
  fields: (t) => ({
    status: t.field({ type: EventRsvpStatus, nullable: true, resolve: (p) => p.status }),
    error: t.field({ type: RespondRsvpError, nullable: true, resolve: (p) => p.error }),
  }),
})

builder.mutationFields((t) => ({
  /**
   * RSVP to an event. Delegates to lib/events/respondRsvp, which owns the
   * capacity-aware going/waitlist resolution, waitlist auto-promotion, and
   * confirmation emails (it uses the admin client for the cross-user writes —
   * a deliberate, encapsulated privilege, not the RLS graph).
   */
  respondRsvp: t.field({
    type: RespondRsvpPayloadRef,
    nullable: false,
    args: {
      eventId: t.arg.id({ required: true }),
      status: t.arg({ type: RsvpResponse, required: true }),
    },
    resolve: async (_root, { eventId, status }, ctx): Promise<RespondRsvpPayload> => {
      if (!ctx.session) return { status: null, error: 'NOT_AUTHENTICATED' }
      const appOrigin = await getAppOrigin()
      const input: RsvpInput = {
        eventId: String(eventId),
        status: status === 'GOING' ? 'going' : 'not_going',
      }
      const result = await respondRsvp(appOrigin, ctx.session.userId, ctx.session.email, input)
      return result.ok
        ? { status: result.status.toUpperCase() as RespondRsvpPayload['status'], error: null }
        : { status: null, error: result.error.toUpperCase() as RespondRsvpErrorValue }
    },
  }),
}))

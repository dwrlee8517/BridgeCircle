import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

export type EventDetail = {
  id: string
  organizationId: string
  title: string
  description: string | null
  location: string | null
  startsAt: string
  endsAt: string | null
  publishedAt: string | null
  createdBy: string | null
  goingCount: number
  waitlistCount: number
  /** null when capacity is unlimited (column is nullable in DB). */
  capacity: number | null
  /** Viewer's own RSVP, if any. */
  viewerRsvp: 'going' | 'not_going' | 'waitlisted' | null
  /** True iff this event has been canceled (published_at cleared by admin). */
  isCanceled: boolean
  /** True iff event start is in the past. */
  isPast: boolean
}

/**
 * Fetch a single event with the viewer-relative metadata needed by the
 * detail page (RSVP state, going/waitlist counts, isPast / isCanceled flags).
 *
 * RLS gates row visibility: members only see published events in their org;
 * admins see all events in orgs they admin. A canceled event (published_at
 * NULL) is therefore invisible to members — by design — so the page should
 * 404 for them.
 */
export async function getEvent(
  supabase: SupabaseClient<Database>,
  eventId: string,
  viewerId: string,
): Promise<EventDetail | null> {
  // capacity is added by the day15 migration; the select is forward-compatible
  // and falls back to null on older schemas.
  const { data: event, error } = await supabase
    .from('events')
    .select(
      'id, organization_id, title, description, location, starts_at, ends_at, published_at, created_by, capacity',
    )
    .eq('id', eventId)
    .maybeSingle()

  if (error || !event) return null

  const [{ data: rsvps, error: rsvpErr }, { data: viewerRsvp }] = await Promise.all([
    supabase
      .from('event_rsvps')
      .select('status')
      .eq('event_id', eventId)
      .in('status', ['going', 'waitlisted']),
    supabase
      .from('event_rsvps')
      .select('status')
      .eq('event_id', eventId)
      .eq('user_id', viewerId)
      .maybeSingle(),
  ])

  if (rsvpErr) throw new Error(`getEvent rsvps: ${rsvpErr.message}`)

  let goingCount = 0
  let waitlistCount = 0
  for (const r of rsvps ?? []) {
    if (r.status === 'going') goingCount += 1
    else if (r.status === 'waitlisted') waitlistCount += 1
  }

  return {
    id: event.id,
    organizationId: event.organization_id,
    title: event.title,
    description: event.description,
    location: event.location,
    startsAt: event.starts_at,
    endsAt: event.ends_at,
    publishedAt: event.published_at,
    createdBy: event.created_by,
    goingCount,
    waitlistCount,
    capacity: event.capacity ?? null,
    viewerRsvp: (viewerRsvp?.status as EventDetail['viewerRsvp']) ?? null,
    isCanceled: event.published_at === null,
    isPast: new Date(event.starts_at).getTime() < Date.now(),
  }
}

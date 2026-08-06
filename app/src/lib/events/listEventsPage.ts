import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import { decodeKeysetCursor, keysetOrFilter } from '@/lib/pagination/keyset'
import type { EventRow, RsvpStatus } from './listEvents'

export type ListEventsPageArgs = {
  organizationId: string
  viewerId: string
  /** Cursor bounds (opaque `(starts_at, id)` keyset), from the connection. */
  after?: string
  before?: string
  /** Rows to fetch; the connection resolver over-fetches to detect more pages. */
  limit: number
  /** True when paging backward (last/before): order descending, then reverse. */
  inverted: boolean
  now?: Date
}

/**
 * Keyset page of upcoming, published events for an org, ordered by
 * `(starts_at, id)` — the paginated form of `listEvents`. Same RLS boundary
 * (the injected user client) and the same per-event RSVP hydration, so a page's
 * contents match `listEvents` for the same window.
 *
 * Backed by the `events (organization_id, starts_at, id)` index.
 */
export async function listEventsPage(
  supabase: SupabaseClient<Database>,
  {
    organizationId,
    viewerId,
    after,
    before,
    limit,
    inverted,
    now = new Date(),
  }: ListEventsPageArgs,
): Promise<EventRow[]> {
  const ascending = !inverted

  let query = supabase
    .from('events')
    .select('id, title, description, location, starts_at, published_at, capacity')
    .eq('organization_id', organizationId)
    .gte('starts_at', now.toISOString())
    .not('published_at', 'is', null)

  if (after) {
    const { sortValue, id } = decodeKeysetCursor(after)
    query = query.or(keysetOrFilter('starts_at', 'id', sortValue, id, 'gt'))
  }
  if (before) {
    const { sortValue, id } = decodeKeysetCursor(before)
    query = query.or(keysetOrFilter('starts_at', 'id', sortValue, id, 'lt'))
  }

  const { data: events, error } = await query
    .order('starts_at', { ascending })
    .order('id', { ascending })
    .limit(limit)

  if (error) throw new Error(`listEventsPage events: ${error.message}`)
  // Backward paging fetches descending; flip back to ascending for the caller.
  const rows = inverted ? [...(events ?? [])].reverse() : (events ?? [])
  if (rows.length === 0) return []

  const eventIds = rows.map((e) => e.id)
  const [{ data: rsvps, error: rsvpErr }, { data: viewerRsvps, error: viewerErr }] =
    await Promise.all([
      supabase
        .from('event_rsvps')
        .select('event_id, status')
        .in('event_id', eventIds)
        .in('status', ['going', 'waitlisted']),
      supabase
        .from('event_rsvps')
        .select('event_id, status')
        .in('event_id', eventIds)
        .eq('user_id', viewerId),
    ])

  if (rsvpErr) throw new Error(`listEventsPage rsvps: ${rsvpErr.message}`)
  if (viewerErr) throw new Error(`listEventsPage viewer rsvps: ${viewerErr.message}`)

  const goingByEvent = new Map<string, number>()
  const waitlistByEvent = new Map<string, number>()
  for (const r of rsvps ?? []) {
    if (r.status === 'going') {
      goingByEvent.set(r.event_id, (goingByEvent.get(r.event_id) ?? 0) + 1)
    } else if (r.status === 'waitlisted') {
      waitlistByEvent.set(r.event_id, (waitlistByEvent.get(r.event_id) ?? 0) + 1)
    }
  }
  const viewerByEvent = new Map<string, RsvpStatus>(
    (viewerRsvps ?? []).map((r) => [r.event_id, r.status as RsvpStatus]),
  )

  return rows.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.location,
    startsAt: e.starts_at,
    publishedAt: e.published_at,
    goingCount: goingByEvent.get(e.id) ?? 0,
    waitlistCount: waitlistByEvent.get(e.id) ?? 0,
    capacity: e.capacity ?? null,
    viewerRsvp: viewerByEvent.get(e.id) ?? null,
  }))
}

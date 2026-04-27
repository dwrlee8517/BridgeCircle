import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

export type RsvpStatus = 'going' | 'not_going'

export type EventRow = {
  id: string
  title: string
  description: string | null
  location: string | null
  startsAt: string
  publishedAt: string | null
  goingCount: number
  viewerRsvp: RsvpStatus | null
}

export type ListEventsOptions = {
  /** Include past events. Defaults to false (members see upcoming only). */
  includePast?: boolean
  /** Include drafts (events with no published_at). Admin-only — RLS rejects this for members anyway. */
  includeDrafts?: boolean
}

/**
 * List events for an org. RLS already filters to events the viewer can see
 * (members: published only; admins: all). The flags here only affect the
 * timeframe and ordering — they don't unlock data the viewer wouldn't get
 * anyway.
 */
export async function listEvents(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  viewerId: string,
  options: ListEventsOptions = {},
): Promise<EventRow[]> {
  const { includePast = false, includeDrafts = false } = options
  const nowIso = new Date().toISOString()

  let query = supabase
    .from('events')
    .select('id, title, description, location, starts_at, published_at')
    .eq('organization_id', organizationId)

  if (!includePast) query = query.gte('starts_at', nowIso)
  if (!includeDrafts) query = query.not('published_at', 'is', null)

  const { data: events, error } = await query
    .order('starts_at', { ascending: includePast ? false : true })
    .limit(100)

  if (error) throw new Error(`listEvents events: ${error.message}`)
  if (!events || events.length === 0) return []

  const eventIds = events.map((e) => e.id)

  const [{ data: rsvps, error: rsvpErr }, { data: viewerRsvps, error: viewerErr }] =
    await Promise.all([
      supabase
        .from('event_rsvps')
        .select('event_id, status')
        .in('event_id', eventIds)
        .eq('status', 'going'),
      supabase
        .from('event_rsvps')
        .select('event_id, status')
        .in('event_id', eventIds)
        .eq('user_id', viewerId),
    ])

  if (rsvpErr) throw new Error(`listEvents rsvps: ${rsvpErr.message}`)
  if (viewerErr) throw new Error(`listEvents viewer rsvps: ${viewerErr.message}`)

  const goingByEvent = new Map<string, number>()
  for (const r of rsvps ?? []) {
    goingByEvent.set(r.event_id, (goingByEvent.get(r.event_id) ?? 0) + 1)
  }
  const viewerByEvent = new Map<string, RsvpStatus>(
    (viewerRsvps ?? []).map((r) => [r.event_id, r.status as RsvpStatus]),
  )

  return events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.location,
    startsAt: e.starts_at,
    publishedAt: e.published_at,
    goingCount: goingByEvent.get(e.id) ?? 0,
    viewerRsvp: viewerByEvent.get(e.id) ?? null,
  }))
}

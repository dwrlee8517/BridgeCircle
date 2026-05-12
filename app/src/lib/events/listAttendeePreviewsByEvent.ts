import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import { type EventAttendee, hydrate, trimByEvent, uniqueUserIds } from './attendeePreviewHelpers'

export type { EventAttendee } from './attendeePreviewHelpers'

/**
 * For each event id, return up to `limitPerEvent` going-RSVPs ordered by
 * earliest responded, hydrated with name + avatar from base_profiles.
 *
 * Two DB round trips total (RSVPs, then profiles), regardless of how many
 * events are passed in — used by the events list so a click-driven selection
 * change doesn't trigger a per-event fetch.
 *
 * RLS already filters events the viewer can't see. An unauthorized event id
 * simply produces no entry in the result map.
 */
export async function listAttendeePreviewsByEvent(
  supabase: SupabaseClient<Database>,
  eventIds: string[],
  limitPerEvent: number,
): Promise<Map<string, EventAttendee[]>> {
  if (eventIds.length === 0) return new Map()

  const { data: rsvps, error: rsvpErr } = await supabase
    .from('event_rsvps')
    .select('event_id, user_id, responded_at')
    .in('event_id', eventIds)
    .eq('status', 'going')
    .order('responded_at', { ascending: true })

  if (rsvpErr) throw new Error(`listAttendeePreviewsByEvent rsvps: ${rsvpErr.message}`)
  if (!rsvps || rsvps.length === 0) return new Map()

  const trimmed = trimByEvent(rsvps, limitPerEvent)
  const userIds = uniqueUserIds(trimmed)
  if (userIds.length === 0) return new Map()

  const { data: profiles, error: profilesErr } = await supabase
    .from('base_profiles')
    .select('user_id, name, avatar_url')
    .in('user_id', userIds)

  if (profilesErr) throw new Error(`listAttendeePreviewsByEvent profiles: ${profilesErr.message}`)

  return hydrate(trimmed, profiles ?? [])
}

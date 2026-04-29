import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

export type AttendeeRow = {
  userId: string
  name: string | null
  avatarUrl: string | null
  graduationYear: number | null
  status: 'going' | 'waitlisted'
  /** Wait list position (1-indexed) for waitlisted rows; null for going. */
  waitlistPosition: number | null
  rsvpAt: string
}

export type ListAttendeesResult = {
  going: AttendeeRow[]
  waitlist: AttendeeRow[]
}

/**
 * Returns the going attendees and (if any) the waitlist for a given event.
 * Used by the event detail page so members can see "who's going" and their
 * own waitlist position.
 *
 * RLS notes:
 *   - event_rsvps select policy lets any active org-mate read RSVPs for an
 *     event in their org, so this query goes through the user's session
 *     client just fine.
 *   - base_profiles uses shares_org_with which requires both viewer and
 *     target to be 'active'. That's true here — we only join through
 *     organization_memberships rows that we already know are active (the
 *     user is on this page via the (member) layout's active-membership
 *     check). For the rare case of a stale membership we fall back to a
 *     null name, never to an error.
 *
 * Sorting: going by RSVP time (early-bird), waitlist by RSVP time (so
 * the position is stable as people are promoted off the front).
 */
export async function listAttendees(
  supabase: SupabaseClient<Database>,
  eventId: string,
  organizationId: string,
): Promise<ListAttendeesResult> {
  const { data: rsvps, error } = await supabase
    .from('event_rsvps')
    .select('user_id, status, responded_at')
    .eq('event_id', eventId)
    .in('status', ['going', 'waitlisted'])
    .order('responded_at', { ascending: true })

  if (error) throw new Error(`listAttendees rsvps: ${error.message}`)
  if (!rsvps || rsvps.length === 0) return { going: [], waitlist: [] }

  const userIds = rsvps.map((r) => r.user_id)

  // Pull profile data + grad year. Grad year lives on organization_profiles
  // (per-org). We scope to this event's org so multi-org users still get the
  // right class year. Both queries respect RLS — they'll quietly return only
  // rows the viewer is allowed to see.
  const [{ data: bases }, { data: orgProfiles }] = await Promise.all([
    supabase.from('base_profiles').select('user_id, name, avatar_url').in('user_id', userIds),
    supabase
      .from('organization_profiles')
      .select('graduation_year, organization_membership_id')
      .in(
        'organization_membership_id',
        // Resolve membership IDs for these users in this org. RLS allows
        // members to see other active memberships in their org — same as the
        // directory.
        (
          await supabase
            .from('organization_memberships')
            .select('id, user_id')
            .eq('organization_id', organizationId)
            .in('user_id', userIds)
        ).data?.map((m) => m.id) ?? [],
      ),
  ])

  const baseByUser = new Map((bases ?? []).map((b) => [b.user_id, b]))
  // Map membership_id → org_profile, then also user_id → org_profile via the
  // memberships fetched again (cheap, indexed). Two passes is clearer than
  // jamming both into a single nested fetch.
  const { data: memberships } = await supabase
    .from('organization_memberships')
    .select('id, user_id')
    .eq('organization_id', organizationId)
    .in('user_id', userIds)
  const membershipById = new Map((memberships ?? []).map((m) => [m.id, m]))

  const orgProfileByUser = new Map<string, { graduation_year: number | null }>()
  for (const op of orgProfiles ?? []) {
    const m = membershipById.get(op.organization_membership_id)
    if (m) orgProfileByUser.set(m.user_id, { graduation_year: op.graduation_year })
  }

  let waitlistIdx = 0
  const going: AttendeeRow[] = []
  const waitlist: AttendeeRow[] = []
  for (const r of rsvps) {
    const base = baseByUser.get(r.user_id)
    const op = orgProfileByUser.get(r.user_id)
    const row: AttendeeRow = {
      userId: r.user_id,
      name: base?.name ?? null,
      avatarUrl: base?.avatar_url ?? null,
      graduationYear: op?.graduation_year ?? null,
      status: r.status as 'going' | 'waitlisted',
      waitlistPosition: r.status === 'waitlisted' ? ++waitlistIdx : null,
      rsvpAt: r.responded_at,
    }
    if (r.status === 'going') going.push(row)
    else waitlist.push(row)
  }

  return { going, waitlist }
}

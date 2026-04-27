import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

export type FriendSummary = {
  friendshipId: string
  userId: string
  name: string | null
  headline: string | null
  currentEmployer: string | null
  currentTitle: string | null
  city: string | null
  avatarUrl: string | null
  graduationYear: number | null
  since: string // ISO timestamp from friendships.created_at
}

/**
 * Return the viewer's friends, joined with each friend's basic profile.
 *
 * RLS on friendships allows reads where the viewer is user_a or user_b; the
 * canonical ordering means we may match on either side, so we pull both and
 * pick the "other" user per row.
 */
export async function listFriends(
  supabase: SupabaseClient<Database>,
  viewerId: string,
): Promise<FriendSummary[]> {
  const { data: rows, error } = await supabase
    .from('friendships')
    .select('id, user_a_id, user_b_id, created_at')
    .or(`user_a_id.eq.${viewerId},user_b_id.eq.${viewerId}`)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`listFriends friendships: ${error.message}`)
  if (!rows || rows.length === 0) return []

  const otherIds = Array.from(
    new Set(rows.map((r) => (r.user_a_id === viewerId ? r.user_b_id : r.user_a_id))),
  )

  const [{ data: bases, error: baseErr }, { data: memberships, error: mErr }] = await Promise.all([
    supabase
      .from('base_profiles')
      .select('user_id, name, headline, current_employer, current_title, city, avatar_url')
      .in('user_id', otherIds),
    supabase
      .from('organization_memberships')
      .select('id, user_id')
      .in('user_id', otherIds)
      .eq('status', 'active'),
  ])

  if (baseErr) throw new Error(`listFriends base_profiles: ${baseErr.message}`)
  if (mErr) throw new Error(`listFriends memberships: ${mErr.message}`)

  const membershipIds = (memberships ?? []).map((m) => m.id)
  const { data: orgProfiles } = membershipIds.length
    ? await supabase
        .from('organization_profiles')
        .select('organization_membership_id, graduation_year')
        .in('organization_membership_id', membershipIds)
    : { data: [] as Array<{ organization_membership_id: string; graduation_year: number | null }> }

  const baseByUser = new Map((bases ?? []).map((b) => [b.user_id, b]))
  const membershipByUser = new Map((memberships ?? []).map((m) => [m.user_id, m.id]))
  const gradYearByMembership = new Map(
    (orgProfiles ?? []).map((p) => [p.organization_membership_id, p.graduation_year]),
  )

  const friends: FriendSummary[] = []
  for (const row of rows) {
    const otherId = row.user_a_id === viewerId ? row.user_b_id : row.user_a_id
    const base = baseByUser.get(otherId)
    if (!base) continue // RLS hid them or they were deleted; skip
    const membershipId = membershipByUser.get(otherId)
    const graduationYear = membershipId ? (gradYearByMembership.get(membershipId) ?? null) : null
    friends.push({
      friendshipId: row.id,
      userId: otherId,
      name: base.name,
      headline: base.headline,
      currentEmployer: base.current_employer,
      currentTitle: base.current_title,
      city: base.city,
      avatarUrl: base.avatar_url,
      graduationYear,
      since: row.created_at,
    })
  }

  return friends
}

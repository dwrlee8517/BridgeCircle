import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

export type Classmate = {
  userId: string
  name: string | null
  avatarUrl: string | null
  currentTitle: string | null
  currentEmployer: string | null
}

/**
 * Fellow alumni in the viewer's organization who share the same graduation
 * year, excluding the viewer themselves. Returns up to `limit` (default 5)
 * sorted by recency of joining — newest first to surface fresh names.
 *
 * Used by the right rail on `/friends` as a "people from your class" prompt.
 *
 * Friendship status is intentionally NOT filtered out — even if you're
 * already friends, seeing their name in the rail is fine; clicking goes to
 * their profile, where the friend button just says "Friends ✓". Filtering
 * here would mean another join + a clearly-broken-feeling smaller list.
 */
export async function listClassmates(
  supabase: SupabaseClient<Database>,
  viewerId: string,
  organizationId: string,
  graduationYear: number,
  limit = 5,
): Promise<Classmate[]> {
  const { data: matches } = await supabase
    .from('organization_profiles')
    .select(
      'graduation_year, organization_memberships!inner(user_id, status, organization_id, joined_at)',
    )
    .eq('graduation_year', graduationYear)
    .eq('organization_memberships.status', 'active')
    .eq('organization_memberships.organization_id', organizationId)
    .order('joined_at', { ascending: false, referencedTable: 'organization_memberships' })
    .limit(limit + 5) // overfetch so we can drop self + still hit limit

  const userIds: string[] = []
  for (const row of matches ?? []) {
    const m = row.organization_memberships as { user_id: string } | null
    if (!m) continue
    if (m.user_id === viewerId) continue
    userIds.push(m.user_id)
    if (userIds.length >= limit) break
  }

  if (userIds.length === 0) return []

  const { data: profiles } = await supabase
    .from('base_profiles')
    .select('user_id, name, avatar_url, current_title, current_employer')
    .in('user_id', userIds)

  const byId = new Map((profiles ?? []).map((p) => [p.user_id, p]))

  return userIds
    .map((uid) => {
      const p = byId.get(uid)
      if (!p) return null
      return {
        userId: uid,
        name: p.name,
        avatarUrl: p.avatar_url,
        currentTitle: p.current_title,
        currentEmployer: p.current_employer,
      }
    })
    .filter((c): c is Classmate => c !== null)
}

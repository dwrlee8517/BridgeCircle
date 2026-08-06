import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

/**
 * A directory-tier view of a member — the shape the GraphQL `Member` entity is
 * built from. Composed today from `base_profiles`; the org overlay
 * (`organization_profiles`) and helper availability (`helper_preferences`) fold
 * in as the entity grows in Phase 1.
 */
export type MemberRecord = {
  userId: string
  name: string | null
  preferredName: string | null
  headline: string | null
  currentEmployer: string | null
  currentTitle: string | null
  city: string | null
  university: string | null
  major: string | null
  avatarUrl: string | null
}

/**
 * Batch-load members by user id in a single query — the data-access function a
 * DataLoader keys against, so a graph that touches N members hits the DB once.
 *
 * RLS is the access boundary: the caller injects the *user-scoped* Supabase
 * client, so `base_profiles` rows the viewer cannot see simply don't come back
 * and the caller resolves them to null. Never pass the service-role admin
 * client here — that would defeat row security.
 */
export async function loadMembersByIds(
  supabase: SupabaseClient<Database>,
  ids: readonly string[],
): Promise<Map<string, MemberRecord>> {
  const byId = new Map<string, MemberRecord>()
  if (ids.length === 0) return byId

  const { data, error } = await supabase
    .from('base_profiles')
    .select(
      'user_id, name, preferred_name, headline, current_employer, current_title, city, university, major, avatar_url',
    )
    .in('user_id', ids as string[])
  if (error) throw error

  for (const row of data ?? []) {
    byId.set(row.user_id, {
      userId: row.user_id,
      name: row.name,
      preferredName: row.preferred_name,
      headline: row.headline,
      currentEmployer: row.current_employer,
      currentTitle: row.current_title,
      city: row.city,
      university: row.university,
      major: row.major,
      avatarUrl: row.avatar_url,
    })
  }
  return byId
}

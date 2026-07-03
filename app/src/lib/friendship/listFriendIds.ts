import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

/**
 * The set of user ids the viewer is connected to (friendships). Lightweight
 * companion to `listFriends` — one table read, no profile joins — for
 * surfaces that only need "is this person in my circle?" (the circle mark on
 * Messages, ADR 0011 Phase 3).
 *
 * RLS on friendships allows reads where the viewer is user_a or user_b, so
 * the regular server client is enough.
 */
export async function listFriendIds(
  supabase: SupabaseClient<Database>,
  viewerId: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('friendships')
    .select('user_a_id, user_b_id')
    .or(`user_a_id.eq.${viewerId},user_b_id.eq.${viewerId}`)

  if (error) throw new Error(`listFriendIds: ${error.message}`)

  const ids = new Set<string>()
  for (const row of data ?? []) {
    ids.add(row.user_a_id === viewerId ? row.user_b_id : row.user_a_id)
  }
  return ids
}

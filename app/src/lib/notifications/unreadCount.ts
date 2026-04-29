import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

/**
 * Returns the viewer's unread notification count. Uses head:true so the
 * query returns no rows — just a count from a Range header. Cheap; the
 * (user_id, read_at) combo is well-indexed.
 *
 * Called on every (member) page render to show the bell badge. Errors are
 * swallowed back to 0 (a missing badge is preferable to crashing the layout).
 */
export async function unreadCount(
  supabase: SupabaseClient<Database>,
  viewerId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', viewerId)
    .is('read_at', null)

  if (error) return 0
  return count ?? 0
}

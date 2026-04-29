import 'server-only'
import { createAdminClient } from '@/db/admin'

/**
 * Marks one notification (by id) as read. Authorizes via user_id eq —
 * even though we use the admin client (bypasses RLS), we explicitly scope
 * the update to the caller's user_id so a malformed call can't ack
 * someone else's row.
 */
export async function markNotificationRead(
  notificationId: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient()
  const nowIso = new Date().toISOString()
  const { error } = await admin
    .from('notifications')
    .update({ read_at: nowIso })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .is('read_at', null) // idempotent — re-acking is a no-op
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/**
 * Marks every unread notification for the user as read in one update.
 * Used by the "Mark all as read" action in the bell popover.
 */
export async function markAllNotificationsRead(
  userId: string,
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const admin = createAdminClient()
  const nowIso = new Date().toISOString()
  const { error, count } = await admin
    .from('notifications')
    .update({ read_at: nowIso }, { count: 'exact' })
    .eq('user_id', userId)
    .is('read_at', null)
  if (error) return { ok: false, error: error.message }
  return { ok: true, count: count ?? 0 }
}

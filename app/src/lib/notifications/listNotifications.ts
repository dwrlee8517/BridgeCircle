import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import { NOTIFICATION_TYPES, type NotificationRow, type NotificationType } from './types'

export type ListNotificationsOptions = {
  limit?: number
  unreadOnly?: boolean
}

/**
 * Returns the viewer's notifications, newest first. RLS-gated to own rows
 * via the "users read own notifications" policy, so we just query through
 * the user's session client and trust the result.
 *
 * Filters out unrecognized types defensively — if a future migration adds a
 * type the UI hasn't shipped a renderer for yet, we don't want to crash on
 * the bell render path. Such rows just stay in the DB until the next deploy.
 */
export async function listNotifications(
  supabase: SupabaseClient<Database>,
  viewerId: string,
  options: ListNotificationsOptions = {},
): Promise<NotificationRow[]> {
  const limit = options.limit ?? 30

  let query = supabase
    .from('notifications')
    .select('id, type, target_type, target_id, organization_id, read_at, created_at, payload')
    .eq('user_id', viewerId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (options.unreadOnly) {
    query = query.is('read_at', null)
  }

  const { data: rows, error } = await query

  if (error) throw new Error(`listNotifications: ${error.message}`)
  if (!rows) return []

  const knownTypes = new Set<string>(NOTIFICATION_TYPES)

  return rows
    .filter((r) => knownTypes.has(r.type))
    .map((r) => ({
      id: r.id,
      type: r.type as NotificationType,
      targetType: r.target_type,
      targetId: r.target_id,
      organizationId: r.organization_id,
      readAt: r.read_at,
      createdAt: r.created_at,
      payload: (r.payload as Record<string, unknown> | null) ?? null,
    }))
}

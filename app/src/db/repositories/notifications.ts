import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/db/database.types'
import {
  isNotificationType,
  type NotificationRepository,
  type NotificationRow,
} from '@/lib/notifications/types'

const notificationRowSchema = z.object({
  id: z.coerce.number().int().positive(),
  type: z.string(),
  target_type: z.string().nullable(),
  target_id: z.string().nullable(),
  organization_id: z.guid().nullable(),
  actor_user_id: z.guid().nullable(),
  read_at: z.string().nullable(),
  created_at: z.string(),
  payload: z.record(z.string(), z.unknown()),
})

export function parseNotificationRow(value: unknown): NotificationRow | null {
  const row = notificationRowSchema.parse(value)
  if (!isNotificationType(row.type)) return null
  return {
    id: row.id,
    type: row.type,
    targetType: row.target_type,
    targetId: row.target_id,
    organizationId: row.organization_id,
    actorUserId: row.actor_user_id,
    readAt: row.read_at,
    createdAt: row.created_at,
    payload: row.payload,
  }
}

export function createNotificationRepository(
  client: SupabaseClient<Database>,
): NotificationRepository {
  return {
    async list(options = {}) {
      let query = client
        .from('notifications')
        .select(
          'id, type, target_type, target_id, organization_id, actor_user_id, read_at, created_at, payload',
        )
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(Math.min(Math.max(options.limit ?? 30, 1), 100))

      if (options.unreadOnly) query = query.is('read_at', null)
      const { data, error } = await query
      if (error) throw new Error(`listNotifications: ${error.message}`)
      return (data ?? [])
        .map(parseNotificationRow)
        .filter((row): row is NotificationRow => row !== null)
    },

    async markRead(notificationIds) {
      if (notificationIds.length === 0) return 0
      const { data, error } = await client
        .schema('api')
        .rpc('mark_notifications_read', { p_notification_ids: notificationIds })
      if (error) throw new Error(`markNotificationsRead: ${error.message}`)
      return z.coerce.number().int().nonnegative().parse(data)
    },
  }
}

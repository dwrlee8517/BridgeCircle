import 'server-only'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/db/admin'
import type { Json } from '@/db/database.types'
import type { NotificationType } from './types'

export type CreateNotificationInput = {
  userId: string
  type: NotificationType
  organizationId: string | null
  /** Type tag for the target (e.g. 'friend_request', 'event'). Used by the
   * client to disambiguate which entity targetId points at. */
  targetType?: string | null
  targetId?: string | null
  payload?: Record<string, unknown> | null
}

/**
 * Creates a single notification row. Uses the admin client because RLS on
 * `notifications` is set to "users read own / inserts via service role"
 * per the schema design (background workers can write, no per-user write
 * policy).
 *
 * Failures are captured in Sentry but never thrown — notifications are a
 * convenience; the originating action (friend request, message send, etc.)
 * should not roll back if the bell row didn't write.
 *
 * Self-notifications (userId === actor in payload) are silently skipped.
 * Otherwise we'd ping you for sending your own friend request, etc.
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const actorId = typeof input.payload?.actor_id === 'string' ? input.payload.actor_id : null
  if (actorId && actorId === input.userId) return

  try {
    const admin = createAdminClient()
    // Cast payload through Json — TypeScript treats Record<string, unknown>
    // as too loose for Supabase's Json union (recursive). Our values are
    // always JSON-serializable scalars + strings, so the cast is safe.
    const { error } = await admin.from('notifications').insert({
      user_id: input.userId,
      type: input.type,
      organization_id: input.organizationId,
      target_type: input.targetType ?? null,
      target_id: input.targetId ?? null,
      payload: (input.payload ?? null) as Json | null,
    })
    if (error) {
      Sentry.captureMessage('createNotification insert failed', {
        level: 'warning',
        extra: { error: error.message, type: input.type, userId: input.userId },
      })
    }
  } catch (err) {
    Sentry.captureException(err, {
      extra: { scope: 'createNotification', type: input.type, userId: input.userId },
    })
  }
}

/**
 * Fan-out helper: create the same notification for every user in `userIds`.
 * Silently de-dupes the array. Used by announcement publish + event cancel
 * which each touch many recipients at once.
 */
export async function createNotificationsForMany(
  userIds: string[],
  input: Omit<CreateNotificationInput, 'userId'>,
): Promise<void> {
  const unique = Array.from(new Set(userIds))
  await Promise.all(unique.map((userId) => createNotification({ ...input, userId })))
}

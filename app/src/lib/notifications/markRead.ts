import type { NotificationRepository } from './types'

export async function markNotificationRead(
  repository: NotificationRepository,
  notificationId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await repository.markRead([notificationId])
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'mark_read_failed' }
  }
}

export async function markAllNotificationsRead(
  repository: NotificationRepository,
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  try {
    const count = await repository.markAllRead(new Date().toISOString())
    return { ok: true, count }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'mark_all_failed' }
  }
}

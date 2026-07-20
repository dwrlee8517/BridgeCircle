import type { NotificationRepository } from './types'

export type ListNotificationsOptions = { limit?: number; unreadOnly?: boolean }

export function listNotifications(
  repository: NotificationRepository,
  options: ListNotificationsOptions = {},
) {
  return repository.list(options)
}

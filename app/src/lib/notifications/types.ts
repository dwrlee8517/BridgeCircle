export const NOTIFICATION_TYPES = [
  'connection_requested',
  'connection_accepted',
  'ask_received',
  'ask_accepted',
  'ask_declined',
  'ask_reminder',
  'ask_closed',
  'offer_received',
  'offer_accepted',
  'offer_declined',
  'offer_closed',
  'circle_ask_match',
  'circle_ask_closed',
  'message_received',
  'announcement_published',
  'event_cancelled',
  'profile_update_ready',
] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export type NotificationRow = {
  id: number
  type: NotificationType
  targetType: string | null
  targetId: string | null
  organizationId: string | null
  actorUserId: string | null
  readAt: string | null
  createdAt: string
  payload: Record<string, unknown>
}

export type NotificationRepository = {
  list(options?: { limit?: number; unreadOnly?: boolean }): Promise<NotificationRow[]>
  markRead(notificationIds: number[]): Promise<number>
}

const notificationTypeSet = new Set<string>(NOTIFICATION_TYPES)

export function isNotificationType(value: unknown): value is NotificationType {
  return typeof value === 'string' && notificationTypeSet.has(value)
}

export function notificationIcon(t: NotificationType): string {
  switch (t) {
    case 'connection_requested':
    case 'connection_accepted':
      return 'UserPlus'
    case 'ask_received':
    case 'ask_accepted':
    case 'ask_declined':
    case 'ask_reminder':
    case 'ask_closed':
    case 'offer_received':
    case 'offer_accepted':
    case 'offer_declined':
    case 'offer_closed':
    case 'circle_ask_match':
    case 'circle_ask_closed':
      return 'Handshake'
    case 'message_received':
      return 'MessageSquare'
    case 'announcement_published':
      return 'Megaphone'
    case 'event_cancelled':
      return 'CalendarX'
    case 'profile_update_ready':
      return 'UserRoundCheck'
  }
}

export function notificationLabel(row: NotificationRow): string {
  const actor = typeof row.payload.actor_name === 'string' ? row.payload.actor_name : 'Someone'
  switch (row.type) {
    case 'connection_requested':
      return `${actor} would like to connect`
    case 'connection_accepted':
      return `You and ${actor} are now connected`
    case 'ask_received':
      return `${actor} asked for your help`
    case 'ask_accepted':
      return `${actor} said yes to your ask`
    case 'ask_declined':
      return `${actor} isn't able to help with this right now`
    case 'ask_reminder':
      return `${actor}'s ask is still open — when you have a minute`
    case 'ask_closed':
      return 'Your ask closed quietly'
    case 'offer_received':
      return `${actor} offered to help`
    case 'offer_accepted':
      return `${actor} accepted your offer to help`
    case 'offer_declined':
      return `${actor} chose another path this time`
    case 'offer_closed':
      return 'This offer is now closed'
    case 'circle_ask_match':
      return 'A strong match is ready for your circle ask'
    case 'circle_ask_closed':
      return 'Your circle ask has closed'
    case 'message_received':
      return `New message from ${actor}`
    case 'announcement_published':
      return typeof row.payload.title === 'string' ? row.payload.title : 'New announcement'
    case 'event_cancelled': {
      const title =
        typeof row.payload.event_title === 'string' ? row.payload.event_title : 'An event'
      return `${title} was cancelled`
    }
    case 'profile_update_ready':
      return 'Your profile update is ready to review'
  }
}

export function notificationTargetUrl(row: NotificationRow): string | null {
  switch (row.type) {
    case 'connection_requested':
      return '/inbox'
    case 'connection_accepted':
      return row.targetId ? `/profile/${row.targetId}` : '/inbox'
    case 'ask_received':
    case 'ask_accepted':
    case 'ask_declined':
    case 'ask_reminder':
    case 'ask_closed':
      return row.targetId ? `/ask/${row.targetId}` : '/inbox'
    case 'offer_received':
    case 'offer_accepted':
    case 'offer_declined':
    case 'offer_closed':
      return '/inbox'
    case 'circle_ask_match':
    case 'circle_ask_closed':
      return row.targetId ? `/ask/${row.targetId}` : '/ask'
    case 'message_received':
      return row.targetId ? `/messages/${row.targetId}` : '/inbox'
    case 'announcement_published':
      return '/announcements'
    case 'event_cancelled':
      return row.targetId ? `/events/${row.targetId}` : '/events'
    case 'profile_update_ready':
      return row.targetId ? `/profile/proposals/${row.targetId}` : '/profile/edit'
  }
}

export function notificationShouldToast(t: NotificationType): boolean {
  return ![
    'announcement_published',
    'event_cancelled',
    'ask_closed',
    'offer_closed',
    'circle_ask_closed',
  ].includes(t)
}

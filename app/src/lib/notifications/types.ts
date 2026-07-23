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
  'event_changed',
  'event_cancelled',
  'event_reminder',
  'event_waitlist_spot_opened',
  'profile_update_ready',
] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export const EMAIL_NOTIFICATION_TYPES = [
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
  'event_changed',
  'event_cancelled',
  'event_reminder',
  'event_waitlist_spot_opened',
] as const satisfies readonly NotificationType[]

export type EmailNotificationType = (typeof EMAIL_NOTIFICATION_TYPES)[number]

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
  list(options?: {
    limit?: number
    unreadOnly?: boolean
    beforeCreatedAt?: string
    beforeId?: number
  }): Promise<NotificationRow[]>
  markRead(notificationIds: number[]): Promise<number>
  markAllRead(before: string): Promise<number>
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
    case 'event_changed':
    case 'event_reminder':
      return 'CalendarX'
    case 'event_waitlist_spot_opened':
      return 'CalendarCheck'
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
    case 'event_changed': {
      const title =
        typeof row.payload.event_title === 'string' ? row.payload.event_title : 'An event'
      return `${title} was updated`
    }
    case 'event_reminder': {
      const title =
        typeof row.payload.event_title === 'string' ? row.payload.event_title : 'Your event'
      return `${title} is coming up`
    }
    case 'event_waitlist_spot_opened': {
      const title =
        typeof row.payload.event_title === 'string' ? row.payload.event_title : 'An event'
      return `A spot opened for ${title}`
    }
    case 'profile_update_ready':
      return 'Your profile update is ready to review'
  }
}

export function notificationTargetUrl(row: NotificationRow): string | null {
  if (row.targetType === 'conversation' && row.targetId) {
    return `/messages/${row.targetId}`
  }
  if (row.targetType === 'ask' && row.targetId) {
    return `/help/asks/${row.targetId}`
  }

  switch (row.type) {
    case 'connection_requested':
      return row.actorUserId ? `/profile/${row.actorUserId}` : '/people'
    case 'connection_accepted':
      return row.actorUserId ? `/profile/${row.actorUserId}` : '/people'
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
      return '/help/asks'
    case 'message_received':
      return '/messages'
    case 'announcement_published':
      return row.targetId ? `/school/announcements/${row.targetId}` : '/school/announcements'
    case 'event_changed':
    case 'event_cancelled':
    case 'event_reminder':
    case 'event_waitlist_spot_opened':
      return row.targetId ? `/school/events/${row.targetId}` : '/school'
    case 'profile_update_ready':
      return '/profile/me'
  }
}

export function notificationShouldToast(t: NotificationType): boolean {
  return ![
    'announcement_published',
    'event_changed',
    'event_cancelled',
    'ask_closed',
    'offer_closed',
    'circle_ask_closed',
  ].includes(t)
}

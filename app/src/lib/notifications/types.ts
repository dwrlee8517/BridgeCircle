/**
 * Notification taxonomy. The `notifications.type` column is plain text in
 * the schema; this module gives it a typed enum and the per-type metadata
 * the UI needs (label, icon name, deep link, whether to surface as a toast
 * on realtime arrival).
 *
 * Keeping all per-type metadata in one place (rather than scattered across
 * each emitter) means adding a new type is a one-file change here plus a
 * `createNotification` call at the emit site.
 */

export const NOTIFICATION_TYPES = [
  'friend_request_received',
  'friend_request_accepted',
  'ask_received',
  'ask_accepted',
  'ask_declined',
  'direct_message',
  'ask_message',
  'announcement',
  'event_canceled',
] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export type NotificationRow = {
  id: string
  type: NotificationType
  targetType: string | null
  targetId: string | null
  organizationId: string | null
  readAt: string | null
  createdAt: string
  /** Free-form payload column, JSON-stringified in DB. Holds actor name +
   * any extra context the rendering layer needs (event title, etc.). */
  payload: Record<string, unknown> | null
}

/** Lucide icon name per type — small, scannable. */
export function notificationIcon(t: NotificationType): string {
  switch (t) {
    case 'friend_request_received':
    case 'friend_request_accepted':
      return 'UserPlus'
    case 'ask_received':
    case 'ask_accepted':
    case 'ask_declined':
      return 'Handshake'
    case 'direct_message':
    case 'ask_message':
      return 'MessageSquare'
    case 'announcement':
      return 'Megaphone'
    case 'event_canceled':
      return 'CalendarX'
  }
}

/** One-line text shown in the popover and on /notifications.
 * Pulls actor name out of payload when present; falls back to "Someone". */
export function notificationLabel(row: NotificationRow): string {
  const actor = typeof row.payload?.actor_name === 'string' ? row.payload.actor_name : 'Someone'
  switch (row.type) {
    case 'friend_request_received':
      return `${actor} sent you a friend request`
    case 'friend_request_accepted':
      return `${actor} accepted your friend request`
    case 'ask_received': {
      const askType = row.payload?.ask_type
      if (askType === 'advice') return `${actor} asked you for advice`
      return `${actor} requested mentorship`
    }
    case 'ask_accepted': {
      const askType = row.payload?.ask_type
      if (askType === 'advice') return `${actor} accepted your advice request`
      return `${actor} accepted your mentorship request`
    }
    case 'ask_declined': {
      const askType = row.payload?.ask_type
      if (askType === 'advice') return `${actor} declined your advice request`
      return `${actor} declined your mentorship request`
    }
    case 'direct_message':
      return `New message from ${actor}`
    case 'ask_message':
      return `${actor} sent you a message`
    case 'announcement': {
      const title = typeof row.payload?.title === 'string' ? row.payload.title : 'New announcement'
      return title
    }
    case 'event_canceled': {
      const title =
        typeof row.payload?.event_title === 'string' ? row.payload.event_title : 'An event'
      return `${title} was canceled`
    }
  }
}

/** Where clicking the notification should navigate. Returns null when we
 * can't resolve a target (e.g., target_id missing); the UI then falls back
 * to a no-op click. */
export function notificationTargetUrl(row: NotificationRow): string | null {
  switch (row.type) {
    case 'friend_request_received':
      return '/friends'
    case 'friend_request_accepted':
      return row.targetId ? `/profile/${row.targetId}` : '/friends'
    case 'ask_received':
    case 'ask_declined':
      return row.targetId ? `/ask/${row.targetId}` : '/inbox'
    case 'ask_accepted':
      return row.targetId ? `/ask/thread/${row.targetId}` : '/inbox'
    case 'direct_message':
      return row.targetId ? `/messages/${row.targetId}` : '/messages'
    case 'ask_message':
      return row.targetId ? `/ask/thread/${row.targetId}` : '/inbox'
    case 'announcement':
      return '/announcements'
    case 'event_canceled':
      return row.targetId ? `/events/${row.targetId}` : '/events'
  }
}

/** Whether a realtime arrival of this type should also pop a toast.
 * High-signal "someone interacted with you" types yes; high-volume noisy
 * types (announcement, event_canceled) just bump the badge silently. */
export function notificationShouldToast(t: NotificationType): boolean {
  switch (t) {
    case 'friend_request_received':
    case 'friend_request_accepted':
    case 'ask_received':
    case 'ask_accepted':
    case 'ask_declined':
    case 'direct_message':
    case 'ask_message':
      return true
    case 'announcement':
    case 'event_canceled':
      return false
  }
}

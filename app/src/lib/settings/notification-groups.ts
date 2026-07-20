import type { NotificationType } from '@/lib/notifications/types'

export const NOTIFICATION_GROUPS = [
  {
    id: 'connections',
    label: 'Connections',
    description: 'Requests and accepted connections.',
    types: ['connection_requested', 'connection_accepted'],
  },
  {
    id: 'help',
    label: 'Help',
    description: 'Asks, offers, reminders, and circle matches.',
    types: [
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
    ],
  },
  {
    id: 'messages',
    label: 'Messages',
    description: 'New direct messages.',
    types: ['message_received'],
  },
  {
    id: 'school',
    label: 'School',
    description: 'Announcements, event changes, reminders, and waitlists.',
    types: [
      'announcement_published',
      'event_changed',
      'event_cancelled',
      'event_reminder',
      'event_waitlist_spot_opened',
    ],
  },
  {
    id: 'profile',
    label: 'Profile',
    description: 'Profile updates ready for review.',
    types: ['profile_update_ready'],
  },
] as const satisfies ReadonlyArray<{
  id: string
  label: string
  description: string
  types: readonly NotificationType[]
}>

export type NotificationGroupId = (typeof NOTIFICATION_GROUPS)[number]['id']

export function notificationGroup(id: string) {
  return NOTIFICATION_GROUPS.find((group) => group.id === id) ?? null
}

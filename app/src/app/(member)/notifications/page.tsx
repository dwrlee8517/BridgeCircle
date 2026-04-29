import { format, formatDistanceToNow } from 'date-fns'
import { Bell, CalendarX, Handshake, Megaphone, MessageSquare, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { listNotifications } from '@/lib/notifications/listNotifications'
import {
  type NotificationRow,
  type NotificationType,
  notificationLabel,
  notificationTargetUrl,
} from '@/lib/notifications/types'

/**
 * Standalone notifications page — pull last 100 (the popover only shows 15).
 * No mark-read on click here; this page is the historical view. Click a
 * row to navigate to its target; the bell popover is the place for
 * acknowledging things.
 */
export default async function NotificationsPage() {
  const session = await requireSession()
  const supabase = await createClient()
  const items = await listNotifications(supabase, session.userId, { limit: 100 })

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="text-sm text-muted-foreground">
          Last 100. Use the bell in the top nav to mark items as read.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="Friend requests, mentor responses, messages, and announcements will show up here as they happen."
          action={{ label: 'Browse the directory', href: '/search' }}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {items.map((row) => (
                <li key={row.id}>
                  <Row row={row} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Row({ row }: { row: NotificationRow }) {
  const url = notificationTargetUrl(row)
  const inner = (
    <div
      className={`flex items-start gap-3 px-4 py-3 ${
        row.readAt ? 'opacity-60' : 'bg-muted/20'
      } ${url ? 'hover:bg-muted/40' : ''}`}
    >
      <Icon type={row.type} />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-tight">{notificationLabel(row)}</p>
        <p
          className="mt-0.5 text-xs text-muted-foreground"
          title={format(new Date(row.createdAt), 'PPpp')}
        >
          {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
        </p>
      </div>
      {!row.readAt ? (
        <span role="img" className="mt-1 size-2 shrink-0 rounded-full bg-primary">
          <span className="sr-only">Unread</span>
        </span>
      ) : null}
    </div>
  )

  return url ? (
    <Link href={url} className="block">
      {inner}
    </Link>
  ) : (
    inner
  )
}

function Icon({ type }: { type: NotificationType }) {
  const className = 'mt-0.5 size-4 shrink-0 text-muted-foreground'
  switch (type) {
    case 'friend_request_received':
    case 'friend_request_accepted':
      return <UserPlus className={className} />
    case 'mentorship_request_received':
    case 'mentorship_request_accepted':
    case 'mentorship_request_declined':
      return <Handshake className={className} />
    case 'direct_message':
    case 'mentorship_message':
      return <MessageSquare className={className} />
    case 'announcement':
      return <Megaphone className={className} />
    case 'event_canceled':
      return <CalendarX className={className} />
    default:
      return <Bell className={className} />
  }
}

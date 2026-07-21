import { format, formatDistanceToNow } from 'date-fns'
import {
  Bell,
  CalendarCheck,
  CalendarClock,
  CalendarSync,
  CalendarX,
  CircleHelp,
  Handshake,
  Megaphone,
  MessageSquare,
  UserPlus,
  UserRoundCheck,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { createNotificationRepository } from '@/db/repositories/notifications'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import {
  type NotificationRow,
  type NotificationType,
  notificationLabel,
  notificationTargetUrl,
} from '@/lib/notifications/types'
import {
  markAllNotificationsReadFromPageAction,
  openNotificationAction,
} from '../notifications-actions'

/**
 * Standalone notifications page — pull last 100 (the popover only shows 15).
 * No mark-read on click here; this page is the historical view. Click a
 * row to navigate to its target; the bell popover is the place for
 * acknowledging things.
 */
type SearchParams = { before?: string; beforeId?: string; unread?: string }

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireSession()
  const params = await searchParams
  const supabase = await createClient()
  const items = await createNotificationRepository(supabase).list({
    limit: 50,
    unreadOnly: params.unread === '1',
    beforeCreatedAt: params.before,
    beforeId: params.beforeId ? Number(params.beforeId) : undefined,
  })
  const last = items.at(-1)

  return (
    <div className="density-cozy mx-auto max-w-3xl space-y-5 px-4 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <p className="bc-section-kicker">Your activity</p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Notifications
          </h1>
          <div className="flex gap-3 text-sm">
            <Link
              href="/notifications"
              aria-current={params.unread === '1' ? undefined : 'page'}
              className={params.unread === '1' ? 'text-muted-foreground' : 'font-semibold'}
            >
              All
            </Link>
            <Link
              href="/notifications?unread=1"
              aria-current={params.unread === '1' ? 'page' : undefined}
              className={params.unread === '1' ? 'font-semibold' : 'text-muted-foreground'}
            >
              Unread
            </Link>
          </div>
        </div>
        <form action={markAllNotificationsReadFromPageAction}>
          <Button type="submit" variant="outline" size="sm">
            Mark all read
          </Button>
        </form>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="Connection requests, ask replies, messages, and announcements will show up here as they happen."
          action={{ label: 'Find people', href: '/people' }}
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

      {last && items.length === 50 ? (
        <Button asChild variant="outline" className="w-full">
          <Link
            href={`/notifications?before=${encodeURIComponent(last.createdAt)}&beforeId=${last.id}${params.unread === '1' ? '&unread=1' : ''}`}
          >
            Load older notifications
          </Link>
        </Button>
      ) : null}
    </div>
  )
}

function Row({ row }: { row: NotificationRow }) {
  const url = notificationTargetUrl(row)
  const inner = (
    <div
      className={`flex items-start gap-3 px-4 py-3 ${
        row.readAt ? '' : 'bg-primary-tint/55'
      } ${url ? 'hover:bg-muted/40' : ''}`}
    >
      <Icon type={row.type} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm leading-tight ${row.readAt ? '' : 'font-semibold'}`}>
          {notificationLabel(row)}
        </p>
        <p
          className="mt-0.5 text-xs text-muted-foreground"
          title={format(new Date(row.createdAt), 'PPpp')}
        >
          {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
        </p>
      </div>
      {!row.readAt ? (
        <>
          <span className="sr-only">Unread</span>
          <span className="mt-1 size-2 shrink-0 rounded-full bg-request-attention" aria-hidden />
        </>
      ) : null}
    </div>
  )

  return url ? (
    <form action={openNotificationAction}>
      <input type="hidden" name="notificationId" value={row.id} />
      <button type="submit" className="block w-full text-left">
        {inner}
      </button>
    </form>
  ) : (
    inner
  )
}

const NOTIF_ICON: Record<NotificationType, typeof Bell> = {
  connection_requested: UserPlus,
  connection_accepted: UserPlus,
  ask_received: Handshake,
  ask_accepted: Handshake,
  ask_declined: Handshake,
  ask_reminder: Handshake,
  ask_closed: Handshake,
  offer_received: Handshake,
  offer_accepted: Handshake,
  offer_declined: Handshake,
  offer_closed: Handshake,
  circle_ask_match: CircleHelp,
  circle_ask_closed: CircleHelp,
  message_received: MessageSquare,
  announcement_published: Megaphone,
  event_changed: CalendarSync,
  event_cancelled: CalendarX,
  event_reminder: CalendarClock,
  event_waitlist_spot_opened: CalendarCheck,
  profile_update_ready: UserRoundCheck,
}

/**
 * Tone-tinted icon chip per notification type — mirrors the Civic Editorial
 * prototype's notification dropdown, which color-codes by semantic: ochre for
 * an incoming ask (needs reply), sage for an acceptance, blue for
 * connections/messages, muted for announcements, danger for cancellations.
 * Icon-as-fill is contrast-safe in ochre even though small ochre body text is not.
 */
function notifTone(type: NotificationType): string {
  switch (type) {
    case 'ask_received':
      return 'bg-warning-tint text-accent-ochre'
    case 'ask_accepted':
    case 'offer_accepted':
    case 'connection_accepted':
      return 'bg-success-tint text-accent-sage'
    case 'ask_declined':
    case 'offer_declined':
    case 'event_cancelled':
      return 'bg-danger-tint text-state-danger'
    case 'event_waitlist_spot_opened':
      return 'bg-success-tint text-accent-sage'
    case 'connection_requested':
    case 'message_received':
      return 'bg-primary-tint text-primary'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

function Icon({ type }: { type: NotificationType }) {
  const Glyph = NOTIF_ICON[type] ?? Bell
  return (
    <span
      className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${notifTone(type)}`}
    >
      <Glyph className="size-4" />
    </span>
  )
}

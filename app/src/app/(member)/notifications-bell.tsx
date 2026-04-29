'use client'

import { formatDistanceToNow } from 'date-fns'
import { Bell, CalendarX, Handshake, Megaphone, MessageSquare, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { createClient } from '@/db/client'
import {
  type NotificationRow,
  type NotificationType,
  notificationLabel,
  notificationShouldToast,
  notificationTargetUrl,
} from '@/lib/notifications/types'
import { markAllNotificationsReadAction, markNotificationReadAction } from './notifications-actions'

type Props = {
  /** Initial server-rendered notifications (last 15). */
  initial: NotificationRow[]
  /** Initial unread count from server render. */
  initialUnread: number
  /** Current viewer id, used to filter the realtime channel. */
  viewerId: string
}

/**
 * Bell icon in the top nav. Click → popover with last 15 notifications +
 * unread count badge. Realtime subscribes to the notifications table for
 * the current viewer; new arrivals prepend to the list and bump the badge.
 *
 * Mark-as-read fires only on click — opening the popover doesn't clear
 * the badge by itself (you have to actively acknowledge each one or use
 * "Mark all as read"). Same model as Twitter / GitHub.
 */
export function NotificationsBell({ initial, initialUnread, viewerId }: Props) {
  const [items, setItems] = useState<NotificationRow[]>(initial)
  const [unread, setUnread] = useState<number>(initialUnread)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  // Toast banner state — shown briefly when a high-signal realtime arrival
  // lands. Not a toast library; just an inline banner under the bell.
  const [toast, setToast] = useState<NotificationRow | null>(null)

  // Realtime: subscribe to inserts on notifications for this user.
  // RLS already restricts what reaches us, but we add an explicit filter
  // so the channel is narrowly scoped (cheaper).
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`notifications:${viewerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${viewerId}`,
        },
        (payload) => {
          const r = payload.new as Record<string, unknown>
          const row: NotificationRow = {
            id: r.id as string,
            type: r.type as NotificationType,
            targetType: (r.target_type as string | null) ?? null,
            targetId: (r.target_id as string | null) ?? null,
            organizationId: (r.organization_id as string | null) ?? null,
            readAt: (r.read_at as string | null) ?? null,
            createdAt: r.created_at as string,
            payload: (r.payload as Record<string, unknown> | null) ?? null,
          }
          setItems((prev) => {
            // Dedup by id in case the realtime event races with a server-
            // rendered refresh that already includes this row.
            if (prev.some((x) => x.id === row.id)) return prev
            return [row, ...prev].slice(0, 15)
          })
          setUnread((u) => u + 1)
          if (notificationShouldToast(row.type)) {
            setToast(row)
            window.setTimeout(() => setToast(null), 4500)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [viewerId])

  function handleClickItem(row: NotificationRow) {
    setOpen(false)
    const url = notificationTargetUrl(row)
    // Optimistically mark read in local state first so the badge feels snappy.
    if (!row.readAt) {
      setItems((prev) =>
        prev.map((x) => (x.id === row.id ? { ...x, readAt: new Date().toISOString() } : x)),
      )
      setUnread((u) => Math.max(0, u - 1))
      const fd = new FormData()
      fd.set('notificationId', row.id)
      startTransition(() => {
        markNotificationReadAction(fd).catch(() => {
          // If the mark-read fails the next page-load refresh will reconcile.
        })
      })
    }
    if (url) router.push(url)
  }

  function handleMarkAll() {
    setItems((prev) => prev.map((x) => (x.readAt ? x : { ...x, readAt: new Date().toISOString() })))
    setUnread(0)
    startTransition(() => {
      markAllNotificationsReadAction().catch(() => {
        // best-effort
      })
    })
  }

  const badgeText = unread > 9 ? '9+' : String(unread)

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
            className="relative"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium leading-4 text-destructive-foreground">
                {badgeText}
              </span>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[calc(100vw-1rem)] max-w-[420px] p-0 sm:w-80">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-sm font-medium">Notifications</span>
            {unread > 0 ? (
              <button
                type="button"
                onClick={handleMarkAll}
                disabled={pending}
                className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                Mark all as read
              </button>
            ) : null}
          </div>
          <NotificationList items={items} onItemClick={handleClickItem} />
          <div className="border-t px-3 py-2 text-center">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              See all
            </Link>
          </div>
        </PopoverContent>
      </Popover>

      {toast ? <RealtimeToast row={toast} onClose={() => setToast(null)} /> : null}
    </>
  )
}

function NotificationList({
  items,
  onItemClick,
}: {
  items: NotificationRow[]
  onItemClick: (row: NotificationRow) => void
}) {
  if (items.length === 0) {
    return <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nothing new.</p>
  }
  return (
    <ul className="max-h-80 divide-y overflow-y-auto">
      {items.map((row) => (
        <li key={row.id}>
          <button
            type="button"
            onClick={() => onItemClick(row)}
            className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/50 ${
              row.readAt ? 'opacity-60' : ''
            }`}
          >
            <Icon type={row.type} />
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-tight">{notificationLabel(row)}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
              </p>
            </div>
            {!row.readAt ? (
              <span role="img" className="mt-1 size-2 shrink-0 rounded-full bg-primary">
                <span className="sr-only">Unread</span>
              </span>
            ) : null}
          </button>
        </li>
      ))}
    </ul>
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
  }
}

/** Inline banner that briefly appears when a realtime notification arrives.
 * Auto-dismisses after a few seconds; clicking it navigates + marks read. */
function RealtimeToast({ row, onClose }: { row: NotificationRow; onClose: () => void }) {
  const url = useMemo(() => notificationTargetUrl(row), [row])
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 top-16 z-50 w-72 animate-in fade-in slide-in-from-top-2"
    >
      <Link
        href={url ?? '#'}
        onClick={onClose}
        className="flex items-start gap-2 rounded-md border bg-background p-3 shadow-lg hover:bg-muted/30"
      >
        <Bell className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-tight">{notificationLabel(row)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">just now</p>
        </div>
      </Link>
    </div>
  )
}

'use client'

import { formatDistanceToNow } from 'date-fns'
import { ArrowRight, Send } from 'lucide-react'
import Link from 'next/link'
import { EventTime } from '@/components/ui/event-time'
import type { HomeEvent, HomeFeed, HomeRecentAsk } from '@/lib/home/getHomeFeed'

/**
 * Client pieces of the merged home/ask surface (ask-home.tsx): the
 * announcement strip (client-timezone stamps) and the "Your asks" rail.
 * Moved from the retired dashboard-client.tsx.
 */

export function HomeAnnouncementStrip({
  announcement,
  event,
}: {
  announcement: HomeFeed['latestAnnouncement']
  event: HomeEvent | null
}) {
  if (!announcement && !event) return null

  const href = announcement ? '/announcements' : event ? `/events/${event.id}` : '/school'
  const label = announcement ? 'Announcement' : 'Event'
  const title = announcement?.title ?? event?.title ?? 'School update'
  const stamp = announcement ? (
    shortRelativeTime(new Date(announcement.publishedAt))
  ) : event ? (
    <EventTime iso={event.startsAt} pattern="MMM d" />
  ) : null

  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 border-b border-border bg-primary/[0.03] px-4 py-2 text-xs transition-colors hover:bg-primary/[0.06] sm:px-8"
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <Send className="size-3.5 shrink-0 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-label text-primary">{label}</span>
        <span className="min-w-0 truncate font-medium text-foreground">{title}</span>
      </span>
      {stamp ? (
        <span className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
          <span>{stamp}</span>
          <ArrowRight className="size-3" />
        </span>
      ) : null}
    </Link>
  )
}

function shortRelativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.max(1, Math.round(diffMs / 60_000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 14) return `${days}d ago`
  return formatDistanceToNow(date, { addSuffix: true })
}

/**
 * "Your asks" rail — the viewer's recent outgoing asks with a status dot +
 * lifecycle label. The dot carries the status hue; the label stays
 * foreground/accent so small text never relies on ochre (which fails
 * contrast below ~12px).
 */
export function YourAsksRail({ asks: allAsks }: { asks: HomeRecentAsk[] }) {
  // Cap at 3 so the sections below crest the fold; "See all" covers the rest.
  const asks = allAsks.slice(0, 3)

  return (
    <aside className="flex h-fit w-full flex-col gap-3.5 rounded-md border border-border bg-card px-5 py-4.5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="bc-section-kicker">Your asks</p>
        <Link
          href="/inbox"
          className="text-kicker font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          See all
        </Link>
      </div>
      <ul className="flex flex-col gap-2.5">
        {asks.map((ask, i) => {
          const meta = askStatusMeta(ask)
          return (
            <li
              key={ask.id}
              className={
                i < asks.length - 1
                  ? 'flex items-start gap-2.5 border-b border-muted pb-2.5'
                  : 'flex items-start gap-2.5'
              }
            >
              <span
                className={`mt-1.5 size-1.5 shrink-0 rounded-full ${meta.dotClass}`}
                aria-hidden
              />
              <Link href={`/ask/${ask.id}`} className="group min-w-0 flex-1">
                <p className="text-caption font-medium leading-snug text-foreground group-hover:text-primary">
                  {ask.summary}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`text-xs font-semibold ${meta.labelClass}`}>{meta.label}</span>
                  <span className="font-mono text-xs text-muted-foreground">·</span>
                  <span className="font-mono text-xs text-muted-foreground">{meta.stamp}</span>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}

function askStatusMeta(ask: HomeRecentAsk): {
  label: string
  dotClass: string
  labelClass: string
  stamp: string
} {
  const ago = formatDistanceToNow(new Date(ask.createdAt), { addSuffix: true })
  switch (ask.status) {
    case 'accepted':
      return {
        label: 'Active',
        dotClass: 'bg-accent-sage',
        labelClass: 'text-accent-sage',
        stamp: ask.respondedAt
          ? `replied ${formatDistanceToNow(new Date(ask.respondedAt), { addSuffix: true })}`
          : ago,
      }
    case 'declined':
      // Dignified on the asker's side: the rust dot carries the state; the
      // word "declined" never faces the asker (voice guidelines § decline copy).
      return {
        label: 'Not this time',
        dotClass: 'bg-accent-rust',
        labelClass: 'text-muted-foreground',
        stamp: ago,
      }
    case 'expired':
      return {
        label: 'Expired',
        dotClass: 'bg-muted-foreground',
        labelClass: 'text-muted-foreground',
        stamp: ago,
      }
    default:
      return {
        label: 'Waiting',
        dotClass: 'bg-accent-ochre',
        labelClass: 'text-foreground',
        stamp: `sent ${ago}`,
      }
  }
}

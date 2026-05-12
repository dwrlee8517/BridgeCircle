'use client'

import { format } from 'date-fns'
import { Calendar, ChevronRight, Clock, MapPin, Share2, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import type { EventAttendee } from '@/lib/events/attendeePreviewHelpers'
import type { EventRow } from '@/lib/events/listEvents'
import { RsvpQuickButton } from './rsvp-quick-button'

type Props = {
  events: EventRow[]
  attendeesByEvent: Record<string, EventAttendee[]>
  view: 'upcoming' | 'past'
  initialSelectedId: string | null
}

const NARROW_VIEWPORT_QUERY = '(max-width: 1023px)'

/**
 * Master–detail surface for the events list. Holds `selectedId` in local
 * state so a click only re-renders the right panel — no server round trip,
 * no full RSC payload, no DB queries.
 *
 * Renders the right-panel detail directly from `events[selectedId]` and
 * `attendeesByEvent[selectedId]`, both passed in pre-loaded from the server
 * component. Keeps the URL in sync via `window.history.replaceState` so
 * deep-link / share URLs still work — we deliberately avoid `router.replace`
 * here because it would trigger a hidden RSC refetch on every card click,
 * which is exactly the server cost we're trying to eliminate.
 *
 * Replaces the prior `?selected=` + Server-Component-re-render flow that
 * cost ~6 DB queries and a full RSC round trip per card click.
 */
export function EventsMasterDetail({ events, attendeesByEvent, view, initialSelectedId }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (initialSelectedId && events.some((e) => e.id === initialSelectedId)) {
      return initialSelectedId
    }
    return events[0]?.id ?? null
  })
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (!selectedId) return
    const params = new URLSearchParams()
    if (view === 'past') params.set('view', 'past')
    params.set('selected', selectedId)
    window.history.replaceState(null, '', `/events?${params.toString()}`)
  }, [selectedId, view])

  const selected = events.find((e) => e.id === selectedId) ?? null
  const attendees = selected ? (attendeesByEvent[selected.id] ?? []) : []

  function handleSelect(id: string) {
    setSelectedId(id)
    // On narrow viewports the detail panel sits below the list — scroll it
    // into view so the click feels like "show me that one." On wide
    // viewports the detail is already visible alongside, so skip.
    if (typeof window !== 'undefined' && window.matchMedia(NARROW_VIEWPORT_QUERY).matches) {
      requestAnimationFrame(() => {
        document
          .getElementById('event-detail')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.4fr]">
      <div>
        <div className="space-y-3">
          {events.map((e) => (
            <EventListItem
              key={e.id}
              event={e}
              active={selectedId === e.id}
              onSelect={() => handleSelect(e.id)}
            />
          ))}
        </div>
      </div>
      <div>
        {selected ? (
          <div className="lg:sticky lg:top-24">
            <FeaturedEventDetail
              event={selected}
              attendees={attendees}
              viewIsPast={view === 'past'}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function EventListItem({
  event: e,
  active,
  onSelect,
}: {
  event: EventRow
  active: boolean
  onSelect: () => void
}) {
  const start = new Date(e.startsAt)
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`block w-full rounded-xl border p-5 text-left transition-all ${
        active
          ? 'border-primary bg-card shadow-md'
          : 'border-transparent hover:border-border hover:bg-card hover:shadow-sm'
      }`}
    >
      <div className="flex gap-4">
        <DateTile startsAt={e.startsAt} />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <StatusBadge tone="info">Event</StatusBadge>
          </div>
          <h3 className="truncate text-base font-semibold text-foreground">{e.title}</h3>
          <p className="mt-1 truncate text-[13px] text-muted-foreground">
            {format(start, 'h:mm a')}
            {e.location ? ` · ${e.location}` : ''}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">{e.goingCount} attending</p>
        </div>
      </div>
    </button>
  )
}

function DateTile({ startsAt }: { startsAt: string }) {
  const start = new Date(startsAt)
  return (
    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-[#0b1220] text-center text-white">
      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#b4c5ff]">
        {format(start, 'MMM')}
      </span>
      <span className="bc-fraunces mt-0.5 text-2xl font-bold leading-none tracking-[-0.02em]">
        {format(start, 'd')}
      </span>
    </div>
  )
}

function FeaturedEventDetail({
  event: e,
  attendees,
  viewIsPast,
}: {
  event: EventRow
  attendees: EventAttendee[]
  viewIsPast: boolean
}) {
  const start = new Date(e.startsAt)
  return (
    <Card id="event-detail" className="scroll-mt-24 overflow-hidden p-0">
      <div className="relative overflow-hidden bg-[linear-gradient(135deg,#0b1220_0%,#003ea8_60%,#0051d5_100%)] p-8 text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,.10) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />
        <svg
          aria-hidden="true"
          role="presentation"
          viewBox="0 0 200 200"
          className="absolute -top-10 right-[-40px] h-[200px] w-[200px] opacity-25"
        >
          <title>Decorative two-circle motif</title>
          <circle cx="80" cy="100" r="60" fill="none" stroke="#b4c5ff" strokeWidth="1.5" />
          <circle cx="130" cy="100" r="60" fill="none" stroke="#fff" strokeWidth="1.5" />
        </svg>
        <div className="relative">
          <span className="inline-flex h-6 items-center rounded-full bg-white/15 px-2.5 text-xs font-semibold text-white">
            Featured
          </span>
          <h2
            className="bc-fraunces mt-3 text-3xl font-bold leading-[1.1] tracking-[-0.02em] sm:text-4xl"
            style={{ fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 25' }}
          >
            {e.title}
          </h2>
          {e.description ? (
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-300">
              {e.description.length > 220 ? `${e.description.slice(0, 220)}…` : e.description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="space-y-4 p-7">
        <DetailRow icon="date" label="Date" value={format(start, 'EEE, MMM d, yyyy')} />
        <DetailRow icon="time" label="Time" value={format(start, 'h:mm a')} />
        {e.location ? <DetailRow icon="location" label="Location" value={e.location} /> : null}
        <DetailRow
          icon="attending"
          label="Attending"
          value={`${e.goingCount}${e.capacity ? ` / ${e.capacity}` : ''} alumni`}
          last
        />

        {attendees.length > 0 || e.waitlistCount > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <AttendeeStack
              attendees={attendees}
              goingCount={e.goingCount}
              waitlistCount={e.waitlistCount}
            />
          </div>
        ) : null}

        <div className="flex items-stretch gap-2 border-t pt-4">
          {viewIsPast ? null : (
            <RsvpQuickButton
              eventId={e.id}
              current={e.viewerRsvp}
              isFull={e.capacity !== null && e.goingCount >= e.capacity}
              className="flex-1"
            />
          )}
          <Button asChild variant="outline" size="lg" className={viewIsPast ? 'flex-1' : ''}>
            <Link href={`/events/${e.id}`}>
              View event details
              <ChevronRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="icon-lg" aria-label="Share event">
            <Link href={`/events/${e.id}`}>
              <Share2 className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}

const STACK_PALETTE = [
  { bg: '#dbe1ff', fg: '#00174b' },
  { bg: '#fef3c7', fg: '#78350f' },
  { bg: '#d1fae5', fg: '#064e3b' },
  { bg: '#ffdad6', fg: '#7f1d1d' },
  { bg: '#dbe1ff', fg: '#00174b' },
] as const

function AttendeeStack({
  attendees,
  goingCount,
  waitlistCount,
}: {
  attendees: EventAttendee[]
  goingCount: number
  waitlistCount: number
}) {
  const namesLine = formatAttendeesLine(attendees, goingCount)
  return (
    <div className="flex flex-wrap items-center gap-3">
      {attendees.length > 0 ? (
        <div className="flex">
          {attendees.map((a, idx) => {
            const palette = STACK_PALETTE[idx % STACK_PALETTE.length]
            return (
              <span
                key={a.userId}
                className="inline-flex size-8 items-center justify-center rounded-full text-xs font-semibold ring-2 ring-card"
                style={{
                  background: palette.bg,
                  color: palette.fg,
                  marginLeft: idx === 0 ? 0 : -8,
                }}
                title={a.name ?? undefined}
              >
                {initialsFor(a.name)}
              </span>
            )
          })}
        </div>
      ) : null}
      {namesLine ? <span className="text-sm text-muted-foreground">{namesLine}</span> : null}
      {waitlistCount > 0 ? (
        <Badge variant="outline" className="text-[11px]">
          {waitlistCount} on waitlist
        </Badge>
      ) : null}
    </div>
  )
}

function initialsFor(name: string | null): string {
  if (!name) return '?'
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? '?').toUpperCase()
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
}

function formatAttendeesLine(attendees: EventAttendee[], goingCount: number): string | null {
  if (goingCount === 0) return null
  const firstNames = attendees
    .map((a) => a.name?.split(/\s+/)[0])
    .filter((n): n is string => !!n)
    .slice(0, 2)
  if (firstNames.length === 0) {
    return `${goingCount} ${goingCount === 1 ? 'alum' : 'alumni'} attending`
  }
  const others = Math.max(0, goingCount - firstNames.length)
  if (others === 0) {
    return `${firstNames.join(' and ')} attending`
  }
  return `${firstNames.join(', ')}, and ${others} ${others === 1 ? 'other' : 'others'} attending`
}

function DetailRow({
  icon,
  label,
  value,
  last,
}: {
  icon: 'date' | 'time' | 'location' | 'attending'
  label: string
  value: string
  last?: boolean
}) {
  const Icon = (() => {
    switch (icon) {
      case 'date':
        return Calendar
      case 'time':
        return Clock
      case 'location':
        return MapPin
      case 'attending':
        return UserCheck
    }
  })()
  return (
    <div className={`flex items-start gap-3.5 ${last ? '' : 'border-b pb-4'}`}>
      <Icon className="mt-0.5 size-5 text-primary" />
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
          {label}
        </div>
        <div className="mt-0.5 text-[15px] font-medium text-foreground">{value}</div>
      </div>
    </div>
  )
}

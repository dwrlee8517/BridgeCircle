'use client'

import { format } from 'date-fns'
import { ArrowRight, CalendarPlus, Check, Clock3, MapPin, Ticket, UsersRound } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type { EventAttendee } from '@/lib/events/attendeePreviewHelpers'
import type { EventRow, RsvpStatus } from '@/lib/events/listEvents'
import { cn, getInitials } from '@/lib/utils'
import { rsvpAction } from './actions'
import { getEventMetadata, getEventStableColor } from './metadata'

type Props = {
  events: EventRow[]
  attendeesByEvent: Record<string, EventAttendee[]>
  view: 'upcoming' | 'past'
  initialSelectedId: string | null
}

type DisplayEvent = {
  event: EventRow
  starts: Date
  category: string
  accentHex: string
  venue: string
  locationDetail: string
  summary: string
}

export function EventsMasterDetail({ events, attendeesByEvent, view, initialSelectedId }: Props) {
  const displayEvents = useMemo(
    () => events.map(toDisplayEvent).sort(sortByView(view)),
    [events, view],
  )
  const initialId =
    displayEvents.find((item) => item.event.id === initialSelectedId)?.event.id ??
    displayEvents[0]?.event.id ??
    null
  const [selectedId, setSelectedId] = useState<string | null>(initialId)
  const selected = displayEvents.find((item) => item.event.id === selectedId) ?? displayEvents[0]
  const grouped = groupByMonth(displayEvents)

  return (
    <div className="overflow-hidden rounded-md border border-border bg-card shadow-card md:grid md:grid-cols-[300px_minmax(0,1fr)]">
      <section className="border-border bg-background/75 md:border-r" aria-label="Event list">
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
          <span className="font-mono text-xs font-semibold uppercase tracking-label text-muted-foreground">
            {displayEvents.length} {view === 'past' ? 'past' : 'upcoming'}
          </span>
          <span className="font-sans text-xs font-medium text-muted-foreground">
            {grouped.length} {grouped.length === 1 ? 'month' : 'months'}
          </span>
        </div>

        <div className="md:max-h-[680px] md:overflow-y-auto">
          {grouped.map((group) => (
            <div key={group.key}>
              <div className="flex items-baseline justify-between border-b border-border/60 bg-surface-panel px-4 py-2.5">
                <span className="font-heading text-sm font-semibold text-foreground">
                  {group.month}
                </span>
                <span className="font-mono text-xs uppercase tracking-label text-muted-foreground">
                  {group.year}
                </span>
              </div>
              {group.items.map((item) => {
                const isSelected = selected?.event.id === item.event.id
                return (
                  <button
                    key={item.event.id}
                    type="button"
                    onClick={() => setSelectedId(item.event.id)}
                    className={cn(
                      'grid w-full grid-cols-[auto_1fr] items-center gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors focus-visible:border-focus-ring focus-visible:ring-4 focus-visible:ring-focus-ring-muted',
                      isSelected ? 'bg-card' : 'hover:bg-surface-subtle/65',
                    )}
                    style={{
                      borderLeft: `3px solid ${isSelected ? item.accentHex : 'transparent'}`,
                    }}
                    aria-pressed={isSelected}
                  >
                    <EventDateBlock starts={item.starts} accentHex={item.accentHex} />
                    <span className="min-w-0">
                      <span className="mb-1 flex items-center gap-1.5">
                        <span
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: item.accentHex }}
                          aria-hidden
                        />
                        <span className="font-mono text-xs font-semibold uppercase tracking-label text-muted-foreground">
                          {item.category}
                        </span>
                      </span>
                      <span
                        className={cn(
                          'block truncate font-heading text-sm leading-snug text-foreground',
                          isSelected ? 'font-semibold' : 'font-medium',
                        )}
                      >
                        {item.event.title}
                      </span>
                      <span className="mt-1 block truncate text-xs text-muted-foreground">
                        {format(item.starts, 'h:mm a')} · {item.venue}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </section>

      {selected ? (
        <EventArchiveSpotlight
          item={selected}
          attendees={attendeesByEvent[selected.event.id] ?? []}
          view={view}
        />
      ) : null}
    </div>
  )
}

function EventArchiveSpotlight({
  item,
  attendees,
  view,
}: {
  item: DisplayEvent
  attendees: EventAttendee[]
  view: 'upcoming' | 'past'
}) {
  const { event, starts, accentHex } = item
  const isFull = event.capacity !== null && event.goingCount >= event.capacity

  return (
    <section className="flex min-h-[580px] flex-col" aria-label={`${event.title} details`}>
      <div className="grid gap-5 border-b border-border bg-card px-5 py-6 sm:px-7 md:grid-cols-[1fr_auto] md:items-start">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className="rounded-sm border px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-label"
              style={{
                borderColor: `${accentHex}33`,
                backgroundColor: `${accentHex}12`,
                color: accentHex,
              }}
            >
              {item.category}
            </span>
            <span className="font-mono text-xs uppercase tracking-label text-muted-foreground">
              {view === 'past' ? 'Archive' : format(starts, 'EEE · MMM d')}
            </span>
          </div>
          <h2 className="font-heading text-[28px] font-semibold leading-[1.08] tracking-[-0.01em] text-foreground sm:text-display-md">
            {event.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {item.summary}
          </p>
        </div>

        <div className="w-fit rounded-md border border-border bg-background px-6 py-4 text-center shadow-card">
          <div className="font-mono text-xs font-semibold uppercase tracking-label text-muted-foreground">
            {format(starts, 'MMM')}
          </div>
          <div className="mt-1 font-heading text-[52px] font-semibold leading-none tracking-tighter text-foreground">
            {format(starts, 'd')}
          </div>
          <div className="mt-1.5 font-mono text-xs uppercase tracking-label text-muted-foreground">
            {format(starts, 'EEE')} · {format(starts, 'yyyy')}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-5 px-5 py-5 sm:px-7 sm:py-6">
        <div className="grid overflow-hidden rounded-md border border-border bg-background sm:grid-cols-3">
          <EventFact
            icon={Clock3}
            label="When"
            value={format(starts, 'h:mm a')}
            sub={format(starts, 'EEEE · MMM d, yyyy')}
          />
          <EventFact icon={MapPin} label="Where" value={item.venue} sub={item.locationDetail} />
          <EventFact
            icon={Ticket}
            label="Capacity"
            value={event.capacity ? `${event.capacity} seats` : 'Open'}
            sub={`${event.goingCount} going${event.waitlistCount > 0 ? ` · ${event.waitlistCount} waitlisted` : ''}`}
            last
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <AttendeePreview attendees={attendees} goingCount={event.goingCount} />
          <div className="min-w-[180px] flex-1 sm:max-w-[240px]">
            <CapacityBar event={event} isFull={isFull} />
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border pt-4">
          {view === 'upcoming' ? <ArchiveRsvpButton event={event} isFull={isFull} /> : null}
          <Button asChild variant="outline">
            <a href={`/events/${event.id}/ical`} download>
              <CalendarPlus className="size-4" strokeWidth={1.6} />
              Add to calendar
            </a>
          </Button>
          <div className="hidden flex-1 sm:block" />
          <Button asChild variant="ghost">
            <Link href={`/events/${event.id}`}>
              Full details
              <ArrowRight className="size-4" strokeWidth={1.6} />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function ArchiveRsvpButton({ event, isFull }: { event: EventRow; isFull: boolean }) {
  const [pending, startTransition] = useTransition()
  const [local, setLocal] = useState<{
    eventId: string
    status: RsvpStatus | null
    error: string | null
  } | null>(null)

  const status = local?.eventId === event.id ? local.status : event.viewerRsvp
  const error = local?.eventId === event.id ? local.error : null
  const going = status === 'going'
  const waitlisted = status === 'waitlisted'

  function submit() {
    const nextStatus = going || waitlisted ? 'not_going' : 'going'
    const fd = new FormData()
    fd.set('eventId', event.id)
    fd.set('status', nextStatus)
    setLocal({ eventId: event.id, status, error: null })
    startTransition(async () => {
      const result = await rsvpAction(fd)
      setLocal({
        eventId: event.id,
        status: result.ok ? result.status : status,
        error: result.ok ? null : result.error,
      })
    })
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant={going || waitlisted ? 'offer' : 'cta'}
        onClick={submit}
        disabled={pending}
      >
        {going || waitlisted ? <Check className="size-4" strokeWidth={1.8} /> : null}
        {pending
          ? 'Saving...'
          : going
            ? "You're going"
            : waitlisted
              ? 'On waitlist'
              : isFull
                ? 'Join waitlist'
                : "RSVP - I'm going"}
      </Button>
      {error ? (
        <p className="absolute left-0 top-[calc(100%+4px)] max-w-[220px] text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function EventFact({
  icon: Icon,
  label,
  value,
  sub,
  last = false,
}: {
  icon: typeof Clock3
  label: string
  value: string
  sub: string
  last?: boolean
}) {
  return (
    <div className={cn('p-4', !last && 'border-b border-border sm:border-b-0 sm:border-r')}>
      <div className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-label text-muted-foreground">
        <Icon className="size-3.5" strokeWidth={1.7} />
        {label}
      </div>
      <div className="mt-1.5 font-heading text-sm font-semibold leading-snug text-foreground">
        {value}
      </div>
      <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{sub}</div>
    </div>
  )
}

function EventDateBlock({ starts, accentHex }: { starts: Date; accentHex: string }) {
  return (
    <span className="flex size-12 shrink-0 flex-col overflow-hidden rounded-md border border-border bg-card text-center shadow-card">
      <span
        className="px-1 pt-1.5 font-mono text-xs font-semibold uppercase leading-none"
        style={{ color: accentHex }}
      >
        {format(starts, 'MMM')}
      </span>
      <span className="flex flex-1 items-center justify-center font-heading text-lg font-semibold leading-none text-foreground">
        {format(starts, 'd')}
      </span>
      <span className="pb-1 font-mono text-xs uppercase leading-none text-muted-foreground">
        {format(starts, 'EEE')}
      </span>
    </span>
  )
}

function AttendeePreview({
  attendees,
  goingCount,
}: {
  attendees: EventAttendee[]
  goingCount: number
}) {
  const names = attendees.map((a) => a.name).filter((name): name is string => Boolean(name))

  return (
    <div className="flex min-w-[240px] flex-1 items-center gap-3">
      {attendees.length > 0 ? (
        <AvatarGroup>
          {attendees.slice(0, 5).map((attendee) => (
            <Avatar key={attendee.userId} size="sm" className="rounded-full">
              {attendee.avatarUrl ? <AvatarImage src={attendee.avatarUrl} alt="" /> : null}
              <AvatarFallback>{getInitials(attendee.name)}</AvatarFallback>
            </Avatar>
          ))}
        </AvatarGroup>
      ) : (
        <div className="flex size-8 items-center justify-center rounded-full border border-border bg-surface-panel text-muted-foreground">
          <UsersRound className="size-4" strokeWidth={1.6} />
        </div>
      )}
      <p className="text-xs leading-relaxed text-muted-foreground">
        {goingCount > 0 ? (
          <>
            <strong className="font-semibold text-foreground">
              {names.length >= 2
                ? `${firstName(names[0])}, ${firstName(names[1])}`
                : names[0] || `${goingCount} members`}
            </strong>
            {names.length >= 2
              ? ` and ${Math.max(0, goingCount - 2)} others going`
              : goingCount === 1
                ? ' is going'
                : ` and ${Math.max(0, goingCount - 1)} others going`}
          </>
        ) : (
          'Be one of the first to RSVP.'
        )}
      </p>
    </div>
  )
}

function CapacityBar({ event, isFull }: { event: EventRow; isFull: boolean }) {
  const percent = event.capacity
    ? Math.min(100, Math.round((event.goingCount / event.capacity) * 100))
    : 24
  const almostFull = event.capacity !== null && percent >= 90
  const spotsLeft = event.capacity === null ? null : Math.max(0, event.capacity - event.goingCount)

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span
          className="font-mono text-xs font-semibold uppercase tracking-label"
          style={{ color: almostFull ? 'var(--accent-ochre)' : 'var(--action-offer)' }}
        >
          {event.capacity === null ? 'Open capacity' : isFull ? 'Full' : `${spotsLeft} spots left`}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {event.capacity ? `${event.goingCount} / ${event.capacity}` : `${event.goingCount} going`}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-panel">
        <div
          className="h-full rounded-full transition-[width] duration-medium ease-emphasized"
          style={{
            width: `${percent}%`,
            backgroundColor: almostFull ? 'var(--accent-ochre)' : 'var(--action-offer)',
          }}
        />
      </div>
      {event.waitlistCount > 0 ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{event.waitlistCount} waitlisted</p>
      ) : null}
    </div>
  )
}

function toDisplayEvent(event: EventRow): DisplayEvent {
  const meta = getEventMetadata(event.title)
  const accent = getEventStableColor(event.title)
  const location = event.location ?? meta.street
  const [venue, ...rest] = location.split(',')

  return {
    event,
    starts: new Date(event.startsAt),
    category: meta.category,
    accentHex: accent.hex,
    venue: venue?.trim() || 'Location to be shared',
    locationDetail: rest.join(',').trim() || meta.cityZip || 'Details after RSVP',
    summary: event.description ?? meta.tagline,
  }
}

function sortByView(view: 'upcoming' | 'past') {
  return (a: DisplayEvent, b: DisplayEvent) =>
    view === 'past'
      ? b.starts.getTime() - a.starts.getTime()
      : a.starts.getTime() - b.starts.getTime()
}

function groupByMonth(items: DisplayEvent[]) {
  const groups: {
    key: string
    month: string
    year: string
    items: DisplayEvent[]
  }[] = []

  for (const item of items) {
    const key = format(item.starts, 'yyyy-MM')
    let group = groups.find((candidate) => candidate.key === key)
    if (!group) {
      group = {
        key,
        month: format(item.starts, 'MMMM'),
        year: format(item.starts, 'yyyy'),
        items: [],
      }
      groups.push(group)
    }
    group.items.push(item)
  }

  return groups
}

function firstName(name: string | undefined): string {
  return name?.split(' ')[0] ?? 'Someone'
}

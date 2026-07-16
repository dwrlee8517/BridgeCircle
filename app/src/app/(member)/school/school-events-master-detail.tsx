'use client'

import { format } from 'date-fns'
import {
  ArrowLeft,
  ArrowRight,
  CalendarPlus,
  Check,
  ChevronRight,
  Clock3,
  MapPin,
  Ticket,
  UsersRound,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { CirclesMotif } from '@/components/ui/circles-motif'
import type { EventAttendee } from '@/lib/events/attendeePreviewHelpers'
import type { EventRow, RsvpStatus } from '@/lib/events/listEvents'
import { cn, getInitials } from '@/lib/utils'
import { rsvpAction } from '../events/actions'
import { getEventMetadata, getEventStableColor } from '../events/metadata'

type Props = {
  events: EventRow[]
  attendeesByEvent: Record<string, EventAttendee[]>
  orgName: string
}

const SCHOOL_CATEGORIES = ['All', 'Networking', 'Career', 'Founders', 'Reunion'] as const
type SchoolCategory = (typeof SCHOOL_CATEGORIES)[number]
type ConcreteSchoolCategory = Exclude<SchoolCategory, 'All'>

type DisplayEvent = {
  event: EventRow
  starts: Date
  category: ConcreteSchoolCategory
  categoryLabel: string
  accentHex: string
  venue: string
  locationDetail: string
}

export function SchoolEventsMasterDetail({ events, attendeesByEvent, orgName }: Props) {
  const [activeCategory, setActiveCategory] = useState<SchoolCategory>('All')
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)

  const displayEvents = useMemo(
    () => events.map(toDisplayEvent).sort((a, b) => a.starts.getTime() - b.starts.getTime()),
    [events],
  )

  const categoryCounts = useMemo(() => {
    const counts = new Map<ConcreteSchoolCategory, number>()
    for (const item of displayEvents) {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1)
    }
    return counts
  }, [displayEvents])

  const filteredEvents = useMemo(
    () =>
      activeCategory === 'All'
        ? displayEvents
        : displayEvents.filter((item) => item.category === activeCategory),
    [activeCategory, displayEvents],
  )

  const [selectedId, setSelectedId] = useState<string | null>(filteredEvents[0]?.event.id ?? null)

  const selected = filteredEvents.find((item) => item.event.id === selectedId) ?? filteredEvents[0]
  const grouped = groupByMonth(filteredEvents)

  return (
    <div>
      <div className="mb-3 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="bc-section-kicker mb-3">Upcoming · {events.length} events</p>
          <h2 className="font-heading text-h1 font-semibold leading-tight text-foreground">
            On the calendar
          </h2>
        </div>
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Event category">
          {SCHOOL_CATEGORIES.map((category) => {
            const active = activeCategory === category
            const count =
              category === 'All'
                ? displayEvents.length
                : (categoryCounts.get(category as ConcreteSchoolCategory) ?? 0)
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setActiveCategory(category)
                  setMobileDetailOpen(false)
                }}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-kicker font-medium leading-none transition-colors',
                  active
                    ? 'border-primary/25 bg-primary-tint text-primary'
                    : 'border-border bg-card text-muted-foreground hover:bg-surface-subtle hover:text-foreground',
                )}
              >
                {category}
                {count > 0 ? <span className="ml-1 text-xs opacity-70">{count}</span> : null}
              </button>
            )
          })}
        </div>
      </div>

      {selected ? (
        <div className="bc-events-master-detail overflow-hidden rounded-md border border-border bg-card shadow-[0_1px_0_rgba(12,12,11,0.03),0_18px_36px_-22px_rgba(12,12,11,0.14)] md:grid md:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
          <div
            className={cn(
              'border-border bg-background/72 md:block md:border-r',
              mobileDetailOpen ? 'hidden' : 'block',
            )}
          >
            <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
              <span className="font-mono text-xs font-bold uppercase tracking-label text-muted-foreground">
                {filteredEvents.length} upcoming · {grouped.length}{' '}
                {grouped.length === 1 ? 'month' : 'months'}
              </span>
              <Link
                href="/events"
                className="text-kicker font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                Archive
              </Link>
            </div>

            <div className="max-h-[620px] overflow-y-auto">
              {grouped.map((group) => (
                <div key={group.key}>
                  <div className="flex items-baseline justify-between border-b border-border/60 bg-surface-panel px-4 py-2.5">
                    <span className="font-heading text-sm font-semibold text-foreground">
                      {group.month}
                    </span>
                    <span className="font-mono text-xs uppercase tracking-label text-muted-foreground">
                      {group.year} · {group.items.length}{' '}
                      {group.items.length === 1 ? 'event' : 'events'}
                    </span>
                  </div>
                  {group.items.map((item) => {
                    const isSelected = item.event.id === selected.event.id
                    return (
                      <button
                        key={item.event.id}
                        type="button"
                        onClick={() => {
                          setSelectedId(item.event.id)
                          setMobileDetailOpen(true)
                        }}
                        className={cn(
                          'grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors',
                          isSelected ? 'bg-card' : 'bg-transparent hover:bg-surface-subtle/65',
                        )}
                        style={{
                          borderLeft: `3px solid ${isSelected ? item.accentHex : 'transparent'}`,
                          paddingLeft: isSelected ? '13px' : '13px',
                        }}
                      >
                        <EventListDateBlock starts={item.starts} accentHex={item.accentHex} />
                        <span className="min-w-0">
                          <span className="mb-1 flex items-center gap-1.5">
                            <span
                              className="size-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: item.accentHex }}
                            />
                            <span className="text-xs font-semibold uppercase tracking-label text-muted-foreground">
                              {item.categoryLabel}
                            </span>
                          </span>
                          <span
                            className={cn(
                              'block truncate font-heading text-caption leading-snug text-foreground',
                              isSelected ? 'font-semibold' : 'font-medium',
                            )}
                          >
                            {item.event.title}
                          </span>
                          <span className="mt-1 block truncate text-kicker text-muted-foreground">
                            {format(item.starts, 'h:mm a')} · {item.venue}
                          </span>
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground/70 md:hidden" />
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className={cn('md:block', mobileDetailOpen ? 'block' : 'hidden')}>
            {/* Master-detail pane swap recipe (states-and-motion.md): keyed on
                the selection so reveal + selection change both animate —
                slide on mobile, pure fade on desktop. */}
            <div
              key={selected.event.id}
              className="animate-in fade-in slide-in-from-right-2 duration-medium ease-emphasized md:slide-in-from-right-0 md:duration-fast"
            >
              <EventSpotlight
                item={selected}
                attendees={attendeesByEvent[selected.event.id] ?? []}
                orgName={orgName}
                onMobileBack={() => setMobileDetailOpen(false)}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-border bg-card p-6">
          <p className="font-heading text-xl font-semibold text-foreground">
            No {activeCategory.toLowerCase()} events right now
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Try another category or check the events archive.
          </p>
          <Button asChild size="sm" variant="outline" className="mt-4 rounded-md">
            <Link href="/events">Open events</Link>
          </Button>
        </div>
      )}
    </div>
  )
}

function EventSpotlight({
  item,
  attendees,
  orgName,
  onMobileBack,
}: {
  item: DisplayEvent
  attendees: EventAttendee[]
  orgName: string
  onMobileBack?: () => void
}) {
  const { event, starts, accentHex } = item
  const summary = event.description ?? getEventMetadata(event.title).tagline
  const isFull = event.capacity !== null && event.goingCount >= event.capacity

  return (
    <div className="flex min-h-[560px] flex-col">
      {onMobileBack ? (
        <div className="border-b border-border bg-card px-2 py-2 md:hidden">
          <Button variant="ghost" size="sm" onClick={onMobileBack} className="gap-1.5">
            <ArrowLeft className="size-4" strokeWidth={1.8} />
            Events
          </Button>
        </div>
      ) : null}
      {/* Ink editorial hero — the one sanctioned dark canvas (no
          gradients, no constellation chrome). The event's category color
          appears only as a small chip dot; Electric Sky carries the accent. */}
      <div className="relative grid gap-6 overflow-hidden bg-surface-ink px-5 py-6 text-surface-ink-foreground sm:px-7 md:grid-cols-[1fr_auto] md:items-center">
        <CirclesMotif className="absolute -right-6 -top-8 h-40 w-60 text-primary-on-dark opacity-[0.18]" />
        <div className="relative min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded border border-editorial-rule bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-surface-ink-foreground">
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: accentHex }}
                aria-hidden
              />
              {item.categoryLabel}
            </span>
            <span className="text-xs text-surface-ink-muted">Hosted by {orgName}</span>
          </div>
          <h3 className="font-heading text-h1 font-semibold leading-[1.08] tracking-title text-surface-ink-foreground sm:text-page-title">
            {event.title}
          </h3>
          <p className="mt-2 text-caption leading-relaxed text-surface-ink-muted">
            {format(starts, 'EEE, MMM d · h:mm a')} · {event.location ?? 'Location to be shared'}
          </p>
        </div>

        <div className="relative w-fit rounded-md border border-editorial-rule-strong bg-white/[0.06] px-6 py-4 text-center">
          <div className="font-mono text-xs font-bold uppercase tracking-label text-primary-on-dark">
            {format(starts, 'MMM')}
          </div>
          <div className="mt-1 font-heading text-event-date-md font-semibold leading-none tracking-tighter text-surface-ink-foreground sm:text-event-date-lg">
            {format(starts, 'd')}
          </div>
          <div className="mt-1.5 font-mono text-xs uppercase tracking-label text-surface-ink-muted">
            {format(starts, 'EEE')} · {format(starts, 'yyyy')}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 py-5 sm:px-7 sm:py-6">
        <p className="max-w-2xl text-caption leading-relaxed text-foreground">{summary}</p>

        <div className="grid overflow-hidden rounded-md border border-border bg-background sm:grid-cols-3">
          <EventFactCell
            icon={Clock3}
            label="When"
            value={format(starts, 'h:mm a')}
            sub={format(starts, 'EEEE · MMM d, yyyy')}
          />
          <EventFactCell icon={MapPin} label="Where" value={item.venue} sub={item.locationDetail} />
          <EventFactCell
            icon={Ticket}
            label="Host"
            value={orgName}
            sub={event.capacity ? `${event.capacity} seats` : 'Open capacity'}
            last
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <AttendeePreview attendees={attendees} goingCount={event.goingCount} />
          <div className="min-w-[150px] flex-1 sm:max-w-[220px]">
            <CapacityBar
              goingCount={event.goingCount}
              waitlistCount={event.waitlistCount}
              capacity={event.capacity}
              isFull={isFull}
            />
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <SchoolRsvpButton event={event} isFull={isFull} />
          <Button asChild variant="outline" className="rounded-md">
            <a href={`/events/${event.id}/ical`} download>
              <CalendarPlus className="size-4" strokeWidth={1.6} />
              Add to calendar
            </a>
          </Button>
          <Button asChild variant="ghost" className="rounded-md text-muted-foreground">
            <Link href="/people">Invite a friend</Link>
          </Button>
          <div className="hidden flex-1 sm:block" />
          <Button asChild variant="ghost" className="rounded-md">
            <Link href={`/events/${event.id}`}>
              Full details
              <ArrowRight className="size-4" strokeWidth={1.6} />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

function SchoolRsvpButton({ event, isFull }: { event: EventRow; isFull: boolean }) {
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
      if (result.ok) {
        setLocal({ eventId: event.id, status: result.status, error: null })
      } else {
        setLocal({ eventId: event.id, status, error: result.error })
      }
    })
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant={going || waitlisted ? 'offer' : 'cta'}
        onClick={submit}
        disabled={pending}
        className="rounded-md"
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

function EventFactCell({
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
    <div
      className={cn('p-3.5 sm:p-4', !last && 'border-b border-border sm:border-b-0 sm:border-r')}
    >
      <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-label text-muted-foreground">
        <Icon className="size-3.5" strokeWidth={1.7} />
        {label}
      </div>
      <div className="mt-1.5 font-heading text-caption font-semibold leading-snug text-foreground">
        {value}
      </div>
      <div className="mt-1 text-kicker leading-relaxed text-muted-foreground">{sub}</div>
    </div>
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
      <p className="text-caption leading-relaxed text-muted-foreground">
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

function CapacityBar({
  goingCount,
  waitlistCount,
  capacity,
  isFull,
}: {
  goingCount: number
  waitlistCount: number
  capacity: number | null
  isFull: boolean
}) {
  const percent = capacity ? Math.min(100, Math.round((goingCount / capacity) * 100)) : 24
  const almostFull = capacity !== null && percent >= 90
  const fill = almostFull ? 'var(--accent-ochre)' : 'var(--action-offer)'
  const spotsLeft = capacity === null ? null : Math.max(0, capacity - goingCount)

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span
          className="text-xs font-semibold"
          style={{ color: almostFull ? 'var(--accent-ochre)' : 'var(--action-offer)' }}
        >
          {capacity === null
            ? `${goingCount} going · open capacity`
            : isFull
              ? 'Full — waitlist open'
              : `${goingCount} going · ${spotsLeft} ${spotsLeft === 1 ? 'seat' : 'seats'} open`}
        </span>
        <span className="font-mono text-kicker text-muted-foreground">
          {capacity ? `${goingCount} / ${capacity}` : null}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-panel">
        <div
          className="h-full rounded-full transition-[width]"
          style={{ width: `${percent}%`, backgroundColor: fill }}
        />
      </div>
      {waitlistCount > 0 ? (
        <p className="mt-1.5 text-kicker text-muted-foreground">{waitlistCount} waitlisted</p>
      ) : null}
    </div>
  )
}

function EventListDateBlock({ starts, accentHex }: { starts: Date; accentHex: string }) {
  return (
    <span className="grid h-14 w-12 shrink-0 grid-rows-[14px_1fr_14px] items-center rounded-md border border-border bg-card px-1 py-1 text-center shadow-card">
      <span
        className="font-mono text-xs font-bold uppercase leading-none"
        style={{ color: accentHex }}
      >
        {format(starts, 'MMM')}
      </span>
      <span className="font-heading text-lg font-semibold leading-none text-foreground">
        {format(starts, 'd')}
      </span>
      <span className="font-mono text-xs uppercase leading-none text-muted-foreground">
        {format(starts, 'EEE')}
      </span>
    </span>
  )
}

function toDisplayEvent(event: EventRow): DisplayEvent {
  const meta = getEventMetadata(event.title)
  const accent = getEventStableColor(event.title)
  const locationParts = (event.location ?? '').split(',').map((part) => part.trim())
  const venue = locationParts[0] || 'Location to be shared'
  const locationDetail =
    locationParts.length > 1 ? locationParts.slice(1).join(', ') : (event.location ?? meta.cityZip)

  return {
    event,
    starts: new Date(event.startsAt),
    category: schoolCategoryFor(event.title, meta.category),
    categoryLabel: meta.category,
    accentHex: accent.hex,
    venue,
    locationDetail,
  }
}

function schoolCategoryFor(title: string, metadataCategory: string): ConcreteSchoolCategory {
  const normalized = `${title} ${metadataCategory}`.toLowerCase()
  if (normalized.includes('reunion') || normalized.includes('mixer')) return 'Reunion'
  if (
    normalized.includes('founder') ||
    normalized.includes('roundtable') ||
    normalized.includes('product') ||
    normalized.includes('tech')
  ) {
    return 'Founders'
  }
  if (
    normalized.includes('career') ||
    normalized.includes('mentor') ||
    normalized.includes('panel') ||
    normalized.includes('creative')
  ) {
    return 'Career'
  }
  return 'Networking'
}

function groupByMonth(items: DisplayEvent[]) {
  const groups = new Map<
    string,
    { key: string; month: string; year: string; items: DisplayEvent[] }
  >()
  for (const item of items) {
    const key = format(item.starts, 'yyyy-MM')
    const existing = groups.get(key)
    if (existing) {
      existing.items.push(item)
    } else {
      groups.set(key, {
        key,
        month: format(item.starts, 'MMMM'),
        year: format(item.starts, 'yyyy'),
        items: [item],
      })
    }
  }
  return Array.from(groups.values())
}

function firstName(name: string | undefined): string {
  return name?.split(/\s+/)[0] ?? 'Members'
}

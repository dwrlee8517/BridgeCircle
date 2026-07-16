import { format } from 'date-fns'
import {
  ArrowLeft,
  CalendarDays,
  CalendarPlus,
  Clock3,
  ExternalLink,
  MapPin,
  PencilLine,
  Ticket,
  UsersRound,
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { EventTime } from '@/components/ui/event-time'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { getEvent } from '@/lib/events/getEvent'
import { type AttendeeRow, listAttendees } from '@/lib/events/listAttendees'
import type { EventRow } from '@/lib/events/listEvents'
import { listEvents } from '@/lib/events/listEvents'
import { cn, getInitials } from '@/lib/utils'
import { getEventMetadata, getEventStableColor } from '../metadata'
import { RsvpButtons } from '../rsvp-buttons'

type Params = { id: string }

export default async function EventDetailPage({ params }: { params: Promise<Params> }) {
  const session = await requireSession()
  const { id } = await params
  const supabase = await createClient()

  const event = await getEvent(supabase, id, session.userId)
  if (!event) notFound()

  const [attendees, { data: adminRole }, allEvents] = await Promise.all([
    listAttendees(supabase, event.id, event.organizationId),
    supabase
      .from('admin_role_assignments')
      .select('role')
      .eq('user_id', session.userId)
      .eq('organization_id', event.organizationId)
      .in('role', ['super_admin', 'admin'])
      .limit(1)
      .maybeSingle(),
    listEvents(supabase, event.organizationId, session.userId, { includePast: true }),
  ])
  const isAdmin = !!adminRole
  const isFull =
    event.capacity !== null && event.goingCount >= event.capacity && event.viewerRsvp !== 'going'
  const starts = new Date(event.startsAt)
  const accent = getEventStableColor(event.title)
  const meta = getEventMetadata(event.title)
  const eventSummary = getDisplayEventSummary(event.description, meta.tagline)
  const capacityLabel = event.capacity
    ? `${event.goingCount} / ${event.capacity} seats`
    : `${event.goingCount} going`

  // eslint-disable-next-line react-hooks/purity -- server component request-time grouping
  const now = Date.now()
  const upcoming = allEvents
    .filter((e) => new Date(e.startsAt).getTime() >= now && e.id !== event.id)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
  const past = allEvents
    .filter((e) => new Date(e.startsAt).getTime() < now && e.id !== event.id)
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())

  return (
    <main className="density-cozy min-h-full bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-label text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.8} />
          All events
        </Link>

        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-md border border-border bg-card shadow-card">
              <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-[1fr_auto] md:items-start">
                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-sm border px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-label"
                      style={{
                        borderColor: `${accent.hex}33`,
                        backgroundColor: `${accent.hex}12`,
                        color: accent.hex,
                      }}
                    >
                      {meta.category}
                    </span>
                    <EventStatus isPast={event.isPast} starts={starts} accentHex={accent.hex} />
                  </div>
                  <h1 className="font-heading text-display-md font-semibold leading-[1.08] tracking-title text-foreground sm:text-display-event">
                    {event.title}
                  </h1>
                  <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
                    {eventSummary}
                  </p>
                </div>

                <DateBlock starts={starts} accentHex={accent.hex} />
              </div>

              <div className="grid border-t border-border bg-background sm:grid-cols-3">
                <EventFact
                  icon={Clock3}
                  label="When"
                  value={<EventTime iso={event.startsAt} pattern="h:mm a" withZone />}
                  sub={format(starts, 'EEEE · MMM d, yyyy')}
                />
                <EventFact
                  icon={MapPin}
                  label="Where"
                  value={event.location ?? 'Location to be shared'}
                  sub={eventFormat(event.location)}
                />
                <EventFact
                  icon={UsersRound}
                  label="Response"
                  value={capacityLabel}
                  sub={
                    event.waitlistCount > 0
                      ? `${event.waitlistCount} waitlisted`
                      : 'Open to members'
                  }
                  last
                />
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="rounded-md border border-border bg-card p-5 shadow-card sm:p-6">
                <SectionLabel icon={Ticket}>About this event</SectionLabel>
                <p className="mt-4 whitespace-pre-line text-base leading-8 text-foreground">
                  {eventSummary}
                </p>
              </div>

              <div className="rounded-md border border-border bg-card p-5 shadow-card sm:p-6">
                <SectionLabel icon={CalendarDays}>Program flow</SectionLabel>
                <ol className="mt-5 space-y-0">
                  {meta.agenda.map((item, index) => (
                    <li
                      key={`${item.time}-${item.title}`}
                      className="grid grid-cols-[72px_1fr] gap-4"
                    >
                      <div className="flex flex-col items-center">
                        <span
                          className="rounded-sm px-2 py-1 text-center font-mono text-xs font-semibold"
                          style={{ backgroundColor: `${accent.hex}12`, color: accent.hex }}
                        >
                          {item.time}
                        </span>
                        {index < meta.agenda.length - 1 ? (
                          <span className="mt-2 h-10 w-px bg-border" aria-hidden />
                        ) : null}
                      </div>
                      <div className="pb-6">
                        <p className="font-semibold leading-snug text-foreground">{item.title}</p>
                        {item.sub ? (
                          <p className="mt-1 text-sm leading-5 text-muted-foreground">{item.sub}</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            <section className="rounded-md border border-border bg-card p-5 shadow-card sm:p-6">
              <SectionLabel icon={MapPin}>Where to gather</SectionLabel>
              <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-start">
                <div>
                  <h2 className="font-heading text-xl font-semibold text-foreground">
                    {event.location ?? 'Location to be shared'}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {meta.street}, {meta.cityZip}
                  </p>
                </div>
                <div className="rounded-md border border-border bg-background p-4">
                  <p className="bc-card-label">Getting there</p>
                  <Button asChild variant="outline" size="sm" className="mt-3 w-full rounded-md">
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(
                        [event.location, meta.street, meta.cityZip].filter(Boolean).join(', '),
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Get directions
                      <ExternalLink className="size-3.5" />
                    </a>
                  </Button>
                </div>
              </div>
            </section>

            <AttendeeRoster
              title="Who's going"
              attendees={attendees.going}
              accentHex={accent.hex}
            />

            {attendees.waitlist.length > 0 ? (
              <AttendeeRoster
                title="Waitlist"
                attendees={attendees.waitlist}
                accentHex={accent.hex}
                showWaitlistPosition
              />
            ) : null}

            <section className="border-t border-border pt-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="font-heading text-xl font-semibold text-foreground">More events</h2>
                <Link
                  href="/events"
                  className="text-xs font-semibold uppercase tracking-label text-muted-foreground hover:text-foreground"
                >
                  View all
                </Link>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <RelatedEventsSection title="Upcoming" events={upcoming} />
                <RelatedEventsSection title="Past" events={past} subdued />
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div
              className="rounded-md border border-border bg-card p-5 shadow-card"
              style={{ borderTopColor: accent.hex, borderTopWidth: 3 }}
            >
              <div className="flex items-center gap-2">
                <Ticket className="size-4" style={{ color: accent.hex }} />
                <h2 className="font-heading text-xl font-semibold text-foreground">Your RSVP</h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Save your spot and use the directory to plan who you want to meet.
              </p>

              <div className="mt-5">
                {!event.isPast ? (
                  <RsvpButtons
                    eventId={event.id}
                    current={event.viewerRsvp}
                    isFull={isFull}
                    size="default"
                  />
                ) : (
                  <div className="rounded-md border border-border bg-background px-3 py-2.5 text-sm font-medium text-muted-foreground">
                    This event has ended.
                  </div>
                )}
              </div>

              <CapacityMeter event={event} accentHex={accent.hex} />

              <div className="mt-5 space-y-2 border-t border-border pt-5">
                <Button asChild variant="outline" className="w-full justify-start">
                  <a href={`/events/${event.id}/ical`} download>
                    <CalendarPlus className="size-4" strokeWidth={1.6} />
                    Add to calendar
                  </a>
                </Button>
                {isAdmin ? (
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href={`/admin/events/${event.id}/edit`}>
                      <PencilLine className="size-4" strokeWidth={1.6} />
                      Edit event
                    </Link>
                  </Button>
                ) : null}
              </div>

              <dl className="mt-5 space-y-3 border-t border-dashed border-border pt-5">
                {/* Seats intentionally omitted — the meter above already says it. */}
                <SpecLine label="Format" value={eventFormat(event.location)} />
                <SpecLine
                  label="Starts"
                  value={<EventTime iso={event.startsAt} pattern="h:mm a" withZone />}
                />
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

function DateBlock({ starts, accentHex }: { starts: Date; accentHex: string }) {
  return (
    <div className="w-fit rounded-md border border-border bg-background px-6 py-4 text-center shadow-card">
      <div
        className="font-mono text-xs font-semibold uppercase tracking-label"
        style={{ color: accentHex }}
      >
        {format(starts, 'MMM')}
      </div>
      <div className="mt-1 font-heading text-event-date font-semibold leading-none tracking-tighter text-foreground">
        {format(starts, 'd')}
      </div>
      <div className="mt-1.5 font-mono text-xs uppercase tracking-label text-muted-foreground">
        {format(starts, 'EEE')} · {format(starts, 'yyyy')}
      </div>
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
  value: React.ReactNode
  sub: string
  last?: boolean
}) {
  return (
    <div className={cn('p-4', !last && 'border-b border-border sm:border-b-0 sm:border-r')}>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-label text-muted-foreground">
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

function EventStatus({
  isPast,
  starts,
  accentHex,
}: {
  isPast: boolean
  starts: Date
  accentHex: string
}) {
  if (isPast) {
    return (
      <span className="rounded-sm border border-border bg-background px-2.5 py-1 text-xs font-semibold uppercase tracking-label text-muted-foreground">
        Past event
      </span>
    )
  }

  return (
    <span
      className="rounded-sm border px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-label"
      style={{
        borderColor: `${accentHex}33`,
        backgroundColor: `${accentHex}12`,
        color: accentHex,
      }}
    >
      {format(starts, 'MMM d')} · {format(starts, 'h:mm a')}
    </span>
  )
}

function SectionLabel({ icon: Icon, children }: { icon: typeof Ticket; children: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-label text-muted-foreground">
      <Icon className="size-4" strokeWidth={1.7} />
      {children}
    </div>
  )
}

function CapacityMeter({
  event,
  accentHex,
}: {
  event: {
    capacity: number | null
    goingCount: number
    waitlistCount: number
  }
  accentHex: string
}) {
  const percent = event.capacity
    ? Math.min(100, Math.round((event.goingCount / event.capacity) * 100))
    : 24
  const spotsLeft = event.capacity === null ? null : Math.max(0, event.capacity - event.goingCount)

  return (
    <div className="mt-5 border-t border-border pt-5">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-xs font-semibold text-muted-foreground">
          {event.capacity === null
            ? `${event.goingCount} going · open capacity`
            : `${event.goingCount} going · ${spotsLeft} ${spotsLeft === 1 ? 'seat' : 'seats'} open`}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {event.capacity ? `${event.goingCount} / ${event.capacity}` : null}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-panel">
        <div
          className="h-full rounded-full transition-[width] duration-medium ease-emphasized"
          style={{ width: `${percent}%`, backgroundColor: accentHex }}
        />
      </div>
      {event.waitlistCount > 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">{event.waitlistCount} waitlisted</p>
      ) : null}
    </div>
  )
}

function AttendeeRoster({
  title,
  attendees,
  accentHex,
  showWaitlistPosition = false,
}: {
  title: string
  attendees: AttendeeRow[]
  accentHex: string
  showWaitlistPosition?: boolean
}) {
  return (
    <section className="rounded-md border border-border bg-card p-5 shadow-card sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <SectionLabel icon={UsersRound}>{title}</SectionLabel>
        <span className="font-mono text-xs text-muted-foreground">{attendees.length}</span>
      </div>
      {attendees.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No one has RSVP&apos;d yet.</p>
      ) : (
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {attendees.slice(0, 12).map((attendee) => (
            <div
              key={`${attendee.userId}-${attendee.status}`}
              className="flex items-center gap-3 rounded-md border border-border bg-background p-3"
            >
              <Avatar size="sm" className="rounded-md">
                {attendee.avatarUrl ? (
                  <AvatarImage src={attendee.avatarUrl} alt={attendee.name ?? 'Member'} />
                ) : null}
                <AvatarFallback>{getInitials(attendee.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {attendee.name ?? 'Member'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {attendee.graduationYear ? `Class of ${attendee.graduationYear}` : 'Member'}
                </p>
              </div>
              {showWaitlistPosition && attendee.waitlistPosition ? (
                <span
                  className="rounded-sm border px-2 py-1 font-mono text-xs font-semibold"
                  style={{
                    borderColor: `${accentHex}33`,
                    backgroundColor: `${accentHex}12`,
                    color: accentHex,
                  }}
                >
                  #{attendee.waitlistPosition}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function RelatedEventsSection({
  title,
  events,
  subdued = false,
}: {
  title: string
  events: EventRow[]
  subdued?: boolean
}) {
  return (
    <div className="rounded-md border border-border bg-card p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-heading text-base font-semibold text-foreground">{title}</h3>
        <span className="font-mono text-xs text-muted-foreground">{events.length}</span>
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing else here yet.</p>
      ) : (
        <div className="space-y-1">
          {events.slice(0, 3).map((event) => {
            const starts = new Date(event.startsAt)
            return (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="grid grid-cols-[44px_1fr] gap-3 rounded-md p-2 transition-colors hover:bg-surface-subtle"
              >
                <span
                  className={cn(
                    'flex size-11 flex-col items-center justify-center rounded-sm border text-center',
                    subdued
                      ? 'bg-background text-muted-foreground'
                      : 'bg-primary-tint text-primary',
                  )}
                >
                  <span className="font-mono text-xs font-semibold uppercase leading-none">
                    {format(starts, 'MMM')}
                  </span>
                  <span className="mt-0.5 font-heading text-base font-semibold leading-none">
                    {format(starts, 'd')}
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {event.title}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {format(starts, 'h:mm a')}
                  </span>
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SpecLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs font-semibold uppercase tracking-label text-muted-foreground">
        {label}
      </dt>
      <dd className="text-right text-sm font-medium text-foreground">{value}</dd>
    </div>
  )
}

function getDisplayEventSummary(description: string | null, fallback: string): string {
  if (
    description
      ?.toLowerCase()
      .includes('future of generative ai, developer tooling, and product design')
  ) {
    return fallback
  }

  return description ?? fallback
}

function eventFormat(location: string | null): string {
  const normalized = location?.toLowerCase() ?? ''
  if (normalized.includes('zoom') || normalized.includes('virtual')) return 'Virtual'
  return 'In person'
}

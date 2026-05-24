import { format } from 'date-fns'
import {
  ArrowLeft,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  type LucideIcon,
  MapPin,
  PencilLine,
  Ticket,
  UsersRound,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { getEvent } from '@/lib/events/getEvent'
import { type AttendeeRow, listAttendees } from '@/lib/events/listAttendees'
import type { EventRow } from '@/lib/events/listEvents'
import { listEvents } from '@/lib/events/listEvents'
import { getEventMetadata, getEventStableColor } from '../metadata'
import { RsvpButtons } from '../rsvp-buttons'

type Params = { id: string }

const STACK_PALETTE = [
  { bg: 'bg-primary/10 border-primary/20', text: 'text-primary' }, // Electric Sky
  { bg: 'bg-accent-ochre/10 border-accent-ochre/20', text: 'text-accent-ochre' }, // Ochre
  { bg: 'bg-accent-sage/10 border-accent-sage/20', text: 'text-accent-sage' }, // Sage
  { bg: 'bg-accent-plum/10 border-accent-plum/20', text: 'text-accent-plum' }, // Plum
  { bg: 'bg-accent-rust/10 border-accent-rust/20', text: 'text-accent-rust' }, // Rust
] as const

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

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()
  const upcoming = allEvents
    .filter((e) => new Date(e.startsAt).getTime() >= now)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
  const past = allEvents
    .filter((e) => new Date(e.startsAt).getTime() < now)
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())

  return (
    <main className="animate-slideup">
      <div
        className="border-b border-border/70"
        style={{
          background: `radial-gradient(circle at 8% 12%, ${accent.hex}18 0, transparent 34%), linear-gradient(180deg, var(--surface-page) 0%, var(--surface-panel) 100%)`,
        }}
      >
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-8 lg:py-8">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" strokeWidth={1.8} />
            All events
          </Link>

          <section className="mt-4 overflow-hidden rounded-[8px] border border-border/70 bg-card shadow-[0_24px_70px_rgba(12,12,11,0.08)] sm:mt-6">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="relative overflow-hidden p-5 sm:min-h-[380px] sm:p-8 lg:p-10">
                <EventPosterMotif accentHex={accent.hex} />

                <div className="relative z-10 flex flex-col justify-between gap-8 sm:min-h-[300px] sm:gap-12">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex size-16 shrink-0 flex-col items-center justify-center rounded-[8px] border text-center shadow-sm"
                        style={{
                          borderColor: `${accent.hex}44`,
                          backgroundColor: `${accent.hex}12`,
                          color: accent.hex,
                        }}
                      >
                        <span className="font-heading text-2xl font-semibold leading-none">
                          {format(starts, 'd')}
                        </span>
                        <span className="mt-1 font-mono text-[9px] font-bold uppercase">
                          {format(starts, 'MMM')}
                        </span>
                      </div>
                      <div>
                        <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">
                          {meta.category}
                        </p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {format(starts, 'EEEE')} at {format(starts, 'h:mm a')}
                        </p>
                      </div>
                    </div>

                    <EventStatus isPast={event.isPast} startsAt={event.startsAt} accent={accent} />
                  </div>

                  <div className="max-w-3xl">
                    <h1 className="font-heading text-[38px] font-semibold leading-[0.98] text-foreground sm:text-5xl lg:text-6xl">
                      {event.title}
                    </h1>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:mt-5 sm:text-lg">
                      {eventSummary}
                    </p>
                  </div>

                  <div className="hidden gap-3 sm:grid md:grid-cols-3">
                    <EventFact icon={Clock3} label="When" value={format(starts, 'MMM d, h:mm a')} />
                    <EventFact
                      icon={MapPin}
                      label="Where"
                      value={event.location ?? 'Location to be shared'}
                    />
                    <EventFact icon={UsersRound} label="Response" value={capacityLabel} />
                  </div>
                </div>
              </div>

              <aside
                className="border-t border-border/70 p-5 sm:p-8 lg:border-l lg:border-t-0"
                style={{ backgroundColor: `${accent.hex}0d` }}
              >
                <div className="flex h-full flex-col justify-between gap-5 sm:gap-8">
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <Ticket className="size-4" style={{ color: accent.hex }} />
                        <h2 className="font-heading text-xl font-semibold text-foreground">
                          Your spot
                        </h2>
                      </div>
                      <p className="mt-2 hidden text-sm leading-6 text-muted-foreground sm:block">
                        RSVP here, then use People to plan who you want to meet before you arrive.
                      </p>
                    </div>

                    {!event.isPast ? (
                      <div className="[&>div>div]:grid [&>div>div]:grid-cols-2 [&_button]:w-full">
                        <RsvpButtons
                          eventId={event.id}
                          current={event.viewerRsvp}
                          isFull={isFull}
                          size="sm"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-[6px] border border-border/60 bg-card/70 px-3 py-2.5 text-sm font-medium text-muted-foreground">
                        <CheckCircle2 className="size-4" strokeWidth={1.8} />
                        This event has ended
                      </div>
                    )}

                    <RegistrationMeter
                      goingCount={event.goingCount}
                      capacity={event.capacity}
                      accentHex={accent.hex}
                    />

                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-full justify-start rounded-[6px] border-border/70 bg-card/80"
                      >
                        <a href={`/events/${event.id}/ical`} download>
                          <CalendarPlus className="size-4" strokeWidth={1.6} />
                          Add to calendar
                        </a>
                      </Button>
                      {isAdmin ? (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="w-full justify-start rounded-[6px] border-border/70 bg-card/80"
                        >
                          <Link href={`/admin/events/${event.id}/edit`}>
                            <PencilLine className="size-4" strokeWidth={1.6} />
                            Edit event
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <div className="hidden border-t border-dashed border-border/70 pt-5 sm:block">
                    <dl className="space-y-3">
                      <SpecLine label="Format" value={eventFormat(event.location)} />
                      <SpecLine label="Seats" value={capacityLabel} />
                      <SpecLine label="Starts" value={format(starts, 'h:mm a')} />
                    </dl>
                  </div>
                </div>
              </aside>
            </div>
          </section>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
        <div className="overflow-hidden rounded-[8px] border border-border/70 bg-card shadow-sm">
          <section className="grid lg:grid-cols-[230px_minmax(0,1fr)]">
            <EventPassSpine
              eventTitle={event.title}
              starts={starts}
              location={event.location}
              goingCount={event.goingCount}
              capacity={event.capacity}
              accentHex={accent.hex}
            />

            <div className="space-y-10 p-6 sm:p-8">
              <section className="grid gap-8 xl:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
                <div className="space-y-4">
                  <SectionLabel icon={Ticket}>Event notes</SectionLabel>
                  <p className="text-base leading-8 text-foreground whitespace-pre-line">
                    {eventSummary}
                  </p>
                  <div className="grid gap-3 pt-2 sm:grid-cols-2 xl:grid-cols-1">
                    <CompactFact
                      label="Format"
                      value={eventFormat(event.location)}
                      accentHex={accent.hex}
                    />
                    <CompactFact label="Response" value={capacityLabel} accentHex={accent.hex} />
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-[8px] border border-border/70 bg-surface-panel/45 p-5">
                  <DossierMotif accentHex={accent.hex} />
                  <div className="relative z-10">
                    <SectionLabel icon={CalendarDays}>Program flow</SectionLabel>
                    <ol className="mt-6 space-y-0">
                      {meta.agenda.map((it, idx) => (
                        /* biome-ignore lint/suspicious/noArrayIndexKey: stable metadata order */
                        <li key={idx} className="grid grid-cols-[74px_1fr] gap-4">
                          <div className="flex flex-col items-center">
                            <span
                              className="rounded-[6px] px-2 py-1 text-center font-mono text-[10px] font-bold"
                              style={{ backgroundColor: `${accent.hex}12`, color: accent.hex }}
                            >
                              {it.time}
                            </span>
                            {idx < meta.agenda.length - 1 ? (
                              <span className="mt-2 h-12 w-px bg-border" />
                            ) : null}
                          </div>
                          <div className="pb-7">
                            <p className="text-base font-semibold leading-snug text-foreground">
                              {it.title}
                            </p>
                            {it.sub ? (
                              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                                {it.sub}
                              </p>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </section>

              <section className="grid gap-6 border-y border-border/70 py-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
                <div>
                  <SectionLabel icon={MapPin}>Gathering coordinates</SectionLabel>
                  <h2 className="mt-4 font-heading text-2xl font-semibold text-foreground">
                    {event.location ?? 'Location to be shared'}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {meta.street}, {meta.cityZip}
                  </p>
                </div>
                <LocationPanel accentHex={accent.hex} coordinates={meta.coordinates} />
              </section>

              <AttendeeRoster title="Who's going" attendees={attendees.going} accent={accent} />

              {attendees.waitlist.length > 0 ? (
                <AttendeeRoster
                  title="Waitlist"
                  attendees={attendees.waitlist}
                  accent={accent}
                  showWaitlistPosition
                />
              ) : null}
            </div>
          </section>
        </div>

        <section className="mt-10 border-t border-border/70 pt-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="font-heading text-xl font-semibold text-foreground">More events</h2>
            <Link
              href="/events"
              className="font-mono text-[10px] font-bold uppercase text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <RelatedEventsSection
              title="Upcoming"
              events={upcoming}
              currentEventId={event.id}
              subdued={false}
            />
            <RelatedEventsSection title="Past" events={past} currentEventId={event.id} subdued />
          </div>
        </section>
      </div>
    </main>
  )
}

function getCountdownDays(startsAt: string): string {
  const start = new Date(startsAt)
  const now = new Date()
  const diffMs = start.getTime() - now.getTime()
  if (diffMs <= 0) return '0d'
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return `${diffDays}d`
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

function EventPassSpine({
  eventTitle,
  starts,
  location,
  goingCount,
  capacity,
  accentHex,
}: {
  eventTitle: string
  starts: Date
  location: string | null
  goingCount: number
  capacity: number | null
  accentHex: string
}) {
  return (
    <aside
      className="relative border-b border-border/70 p-6 sm:p-8 lg:border-b-0 lg:border-r"
      style={{ backgroundColor: `${accentHex}0f` }}
    >
      <div
        aria-hidden="true"
        className="absolute right-[-7px] top-0 hidden h-full w-[14px] lg:block"
        style={{
          backgroundImage: `radial-gradient(circle, var(--background) 6px, transparent 6.5px)`,
          backgroundPosition: 'center 10px',
          backgroundSize: '14px 28px',
        }}
      />

      <div className="relative z-10 flex h-full flex-col justify-between gap-10">
        <div className="space-y-5">
          <SectionLabel icon={Ticket}>Event pass</SectionLabel>
          <div
            className="flex size-20 flex-col items-center justify-center rounded-[8px] border bg-card text-center shadow-sm"
            style={{ borderColor: `${accentHex}44`, color: accentHex }}
          >
            <span className="font-heading text-3xl font-semibold leading-none">
              {format(starts, 'd')}
            </span>
            <span className="mt-1 font-mono text-[10px] font-bold uppercase">
              {format(starts, 'MMM')}
            </span>
          </div>
          <h3 className="font-heading text-2xl font-semibold leading-tight text-foreground">
            {eventTitle}
          </h3>
        </div>

        <div className="space-y-3">
          <EventPassLine icon={Clock3} label="When" value={format(starts, 'MMM d, h:mm a')} />
          <EventPassLine icon={MapPin} label="Where" value={location ?? 'Location to be shared'} />
          <EventPassLine
            icon={UsersRound}
            label="Seats"
            value={capacity ? `${goingCount} / ${capacity} booked` : `${goingCount} going`}
          />
        </div>

        <div className="border-t border-dashed border-border/70 pt-5">
          <div className="h-2 overflow-hidden rounded-full bg-card">
            <div
              className="h-full rounded-full"
              style={{
                backgroundColor: accentHex,
                width: `${Math.min(100, (goingCount / (capacity || 100)) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </aside>
  )
}

function EventPassLine({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 border-t border-border/60 pt-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.7} />
      <div className="min-w-0">
        <p className="font-mono text-[9px] font-bold uppercase text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm font-semibold leading-snug text-foreground">{value}</p>
      </div>
    </div>
  )
}

function CompactFact({
  label,
  value,
  accentHex,
}: {
  label: string
  value: string
  accentHex: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[6px] border border-border/70 bg-surface-panel/45 px-3 py-2.5">
      <span className="font-mono text-[9px] font-bold uppercase text-muted-foreground">
        {label}
      </span>
      <span
        className="text-right text-sm font-semibold text-foreground"
        style={{ color: accentHex }}
      >
        {value}
      </span>
    </div>
  )
}

function DossierMotif({ accentHex }: { accentHex: string }) {
  return (
    <svg
      aria-hidden="true"
      role="presentation"
      viewBox="0 0 220 220"
      className="pointer-events-none absolute -right-16 -top-16 size-60 stroke-current opacity-[0.08]"
      style={{ color: accentHex }}
    >
      <title>Decorative dossier rings</title>
      <circle cx="110" cy="110" r="86" fill="none" strokeWidth="1" />
      <circle cx="110" cy="110" r="54" fill="none" strokeWidth="1" />
      <path d="M24 110h172M110 24v172" fill="none" strokeWidth="1" strokeDasharray="4 6" />
    </svg>
  )
}

function LocationPanel({ accentHex, coordinates }: { accentHex: string; coordinates: string }) {
  return (
    <div className="relative h-44 overflow-hidden rounded-[8px] border border-border/70 bg-card">
      <svg
        aria-hidden="true"
        role="presentation"
        width="100%"
        height="100%"
        className="absolute inset-0 opacity-40"
      >
        <title>Decorative location grid</title>
        <defs>
          <pattern id="event-location-grid" width="34" height="34" patternUnits="userSpaceOnUse">
            <path d="M 34 0 L 0 0 0 34" fill="none" stroke="currentColor" strokeWidth="0.75" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#event-location-grid)" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex size-12 items-center justify-center rounded-full border border-border/70 bg-card shadow-md">
          <span
            className="absolute size-9 animate-ping rounded-full opacity-20"
            style={{ backgroundColor: accentHex }}
          />
          <span className="size-3 rounded-full" style={{ backgroundColor: accentHex }} />
        </div>
      </div>
      <span className="absolute bottom-3 right-3 font-mono text-[9px] font-bold uppercase text-muted-foreground">
        {coordinates}
      </span>
    </div>
  )
}

function eventFormat(location: string | null): string {
  const normalized = location?.toLowerCase() ?? ''
  if (normalized.includes('zoom') || normalized.includes('virtual')) return 'Virtual'
  return 'In person'
}

function EventPosterMotif({ accentHex }: { accentHex: string }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -right-24 -top-24 size-72 rounded-full"
        style={{
          background: `radial-gradient(circle, ${accentHex}24 0%, ${accentHex}10 42%, transparent 70%)`,
        }}
      />
      <div
        className="absolute bottom-0 left-0 h-2 w-full"
        style={{
          background: `linear-gradient(90deg, ${accentHex}, transparent)`,
        }}
      />
      <svg
        viewBox="0 0 260 260"
        className="absolute -bottom-14 right-4 size-72 stroke-current opacity-[0.07]"
        style={{ color: accentHex }}
      >
        <title>Decorative event poster rings</title>
        <circle cx="130" cy="130" r="108" fill="none" strokeWidth="1" />
        <circle cx="130" cy="130" r="74" fill="none" strokeWidth="1" />
        <circle cx="130" cy="130" r="40" fill="none" strokeWidth="1" />
        <path d="M24 130h212M130 24v212" fill="none" strokeWidth="1" strokeDasharray="4 6" />
      </svg>
    </div>
  )
}

function EventStatus({
  isPast,
  startsAt,
  accent,
}: {
  isPast: boolean
  startsAt: string
  accent: ReturnType<typeof getEventStableColor>
}) {
  if (isPast) {
    return (
      <span className="rounded-[6px] border border-border/70 bg-card px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-muted-foreground">
        Past event
      </span>
    )
  }

  return (
    <span
      className="rounded-[6px] border px-2.5 py-1 font-mono text-[10px] font-bold uppercase"
      style={{
        borderColor: `${accent.hex}33`,
        backgroundColor: `${accent.hex}12`,
        color: accent.hex,
      }}
    >
      T-{getCountdownDays(startsAt)}
    </span>
  )
}

function EventFact({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-[6px] border border-border/60 bg-card/75 px-3 py-2.5 shadow-sm sm:py-3">
      <Icon
        className="mt-0.5 size-3.5 shrink-0 text-muted-foreground sm:size-4"
        strokeWidth={1.7}
      />
      <div className="min-w-0">
        <p className="font-mono text-[9px] font-bold uppercase text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm font-semibold leading-snug text-foreground">{value}</p>
      </div>
    </div>
  )
}

function RegistrationMeter({
  goingCount,
  capacity,
  accentHex,
}: {
  goingCount: number
  capacity: number | null
  accentHex: string
}) {
  const percent = Math.min(100, (goingCount / (capacity || 100)) * 100)

  return (
    <div className="rounded-[6px] border border-border/70 bg-card/75 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-4">
        <span className="font-mono text-[10px] font-bold uppercase text-muted-foreground">
          Registration
        </span>
        <span className="text-sm font-semibold text-foreground">
          {capacity ? `${goingCount} / ${capacity} booked` : 'Open seats'}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ backgroundColor: accentHex, width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function SpecLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold text-foreground">{value}</dd>
    </div>
  )
}

function SectionLabel({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase text-muted-foreground">
      <Icon className="size-4" strokeWidth={1.7} />
      {children}
    </div>
  )
}

function AttendeeRoster({
  title,
  attendees,
  accent,
  showWaitlistPosition = false,
}: {
  title: string
  attendees: AttendeeRow[]
  accent: ReturnType<typeof getEventStableColor>
  showWaitlistPosition?: boolean
}) {
  return (
    <section>
      <div className="flex items-end justify-between gap-4 border-b border-border/70 pb-4">
        <SectionLabel icon={UsersRound}>{title}</SectionLabel>
        <span className="font-mono text-[10px] font-bold uppercase text-muted-foreground">
          {attendees.length}
        </span>
      </div>

      {attendees.length === 0 ? (
        <p className="py-6 text-sm text-muted-foreground">No RSVPs yet. Be the first.</p>
      ) : (
        <ul className="grid gap-x-6 sm:grid-cols-2">
          {attendees.slice(0, 50).map((attendee, idx) => (
            <li key={attendee.userId} className="border-b border-border/50 py-3">
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={`/profile/${attendee.userId}`}
                  className="flex min-w-0 items-center gap-3 text-foreground hover:underline"
                >
                  <AttendeeAvatar attendee={attendee} index={idx} />
                  <span className="truncate text-sm font-semibold">
                    {attendee.name ?? (
                      <span className="italic text-muted-foreground">(no name)</span>
                    )}
                  </span>
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  {attendee.graduationYear ? (
                    <span className="font-mono text-[10px] font-bold text-muted-foreground">
                      &apos;{attendee.graduationYear.toString().slice(2)}
                    </span>
                  ) : null}
                  {showWaitlistPosition && attendee.waitlistPosition ? (
                    <span
                      className="rounded-[4px] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase"
                      style={{ backgroundColor: `${accent.hex}12`, color: accent.hex }}
                    >
                      #{attendee.waitlistPosition}
                    </span>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
          {attendees.length > 50 ? (
            <li className="py-4 text-sm text-muted-foreground sm:col-span-2">
              + {attendees.length - 50} more
            </li>
          ) : null}
        </ul>
      )}
    </section>
  )
}

function AttendeeAvatar({ attendee, index }: { attendee: AttendeeRow; index: number }) {
  const palette = STACK_PALETTE[index % STACK_PALETTE.length] || STACK_PALETTE[0]

  return (
    <div
      className={`relative size-9 shrink-0 overflow-hidden rounded-[6px] border ${
        attendee.avatarUrl ? 'border-border/30 bg-secondary' : palette.bg
      }`}
    >
      {attendee.avatarUrl ? (
        <Image
          src={attendee.avatarUrl}
          alt={attendee.name ?? ''}
          width={36}
          height={36}
          unoptimized
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center font-mono text-xs font-bold uppercase ${palette.text}`}
        >
          {(attendee.name ?? '?').slice(0, 1)}
        </div>
      )}
    </div>
  )
}

function RelatedEventsSection({
  title,
  events,
  currentEventId,
  subdued,
}: {
  title: string
  events: EventRow[]
  currentEventId: string
  subdued: boolean
}) {
  if (events.length === 0) return null

  return (
    <section className="rounded-[8px] border border-border/70 bg-card p-4 shadow-sm">
      <h3 className="font-heading text-base font-semibold text-foreground">{title}</h3>
      <ul className="mt-4 space-y-2">
        {events.map((event) => (
          <RelatedEventRow
            key={event.id}
            event={event}
            isCurrent={event.id === currentEventId}
            subdued={subdued}
          />
        ))}
      </ul>
    </section>
  )
}

function RelatedEventRow({
  event,
  isCurrent,
  subdued,
}: {
  event: EventRow
  isCurrent: boolean
  subdued: boolean
}) {
  const eventAccent = getEventStableColor(event.title)
  const eventMeta = getEventMetadata(event.title)
  const eventDate = new Date(event.startsAt)
  const content = (
    <>
      <span
        className="mt-1 size-2 shrink-0 rounded-full"
        style={{ backgroundColor: eventAccent.hex }}
      />
      <span className="min-w-0">
        <span className="block font-mono text-[9px] font-bold uppercase text-muted-foreground">
          {eventMeta.category}
        </span>
        <span className="mt-1 block text-sm font-semibold leading-snug text-foreground">
          {event.title}
        </span>
        <span className="mt-1 block font-mono text-[10px] text-muted-foreground">
          {format(eventDate, 'MMM d, h:mm a')}
        </span>
      </span>
    </>
  )

  if (isCurrent) {
    return (
      <li
        className={`flex gap-3 rounded-[6px] border border-border/70 bg-secondary/40 p-3 ${
          subdued ? 'opacity-75' : ''
        }`}
      >
        {content}
      </li>
    )
  }

  return (
    <li>
      <Link
        href={`/events/${event.id}`}
        className={`flex gap-3 rounded-[6px] p-3 transition-colors hover:bg-secondary/45 ${
          subdued ? 'opacity-75 hover:opacity-100' : ''
        }`}
      >
        {content}
      </Link>
    </li>
  )
}

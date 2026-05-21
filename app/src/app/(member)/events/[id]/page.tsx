import { format } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { getEvent } from '@/lib/events/getEvent'
import { listAttendees } from '@/lib/events/listAttendees'
import { listEvents } from '@/lib/events/listEvents'
import { getEventMetadata, getEventStableColor } from '../metadata'
import { RsvpButtons } from '../rsvp-buttons'

type Params = { id: string }

const STACK_PALETTE = [
  { bg: 'bg-primary/10 border-primary/20', text: 'text-primary' }, // Cobalt
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
  const _ends = event.endsAt ? new Date(event.endsAt) : null

  const accent = getEventStableColor(event.title)
  const meta = getEventMetadata(event.title)

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()
  const upcoming = allEvents
    .filter((e) => new Date(e.startsAt).getTime() >= now)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
  const past = allEvents
    .filter((e) => new Date(e.startsAt).getTime() < now)
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-6 animate-slideup">
      <div>
        <Link
          href="/events"
          className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground transition-colors"
        >
          ← All events
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
        {/* Left Column: Event details, RSVP, Attendees */}
        <div className="space-y-6">
          {/* Main Details Panel */}
          <div
            className="border border-border/40 rounded-[6px] bg-card overflow-hidden"
            style={{ borderTop: `4px solid ${accent.hex}` }}
          >
            {/* Header Block */}
            <div className="relative overflow-hidden bg-secondary/50 dark:bg-secondary p-6 sm:p-8 border-b-[3px] border-double border-border/60">
              {/* Concentric Circles SVG vector watermark */}
              <svg
                aria-hidden="true"
                role="presentation"
                viewBox="0 0 100 100"
                className="absolute -top-10 right-[-40px] size-64 pointer-events-none stroke-current opacity-5"
                style={{ color: accent.hex }}
              >
                <title>Decorative geometric motif</title>
                <circle cx="50" cy="50" r="45" fill="none" strokeWidth="0.75" />
                <circle cx="50" cy="50" r="30" fill="none" strokeWidth="0.75" />
                <circle cx="50" cy="50" r="15" fill="none" strokeWidth="0.75" />
                <line x1="0" y1="50" x2="100" y2="50" strokeWidth="0.5" strokeDasharray="2 2" />
                <line x1="50" y1="0" x2="50" y2="100" strokeWidth="0.5" strokeDasharray="2 2" />
              </svg>

              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] px-2 py-0.5 rounded bg-foreground text-background">
                    {meta.category}
                  </span>
                  {event.isPast ? (
                    <span className="rounded-[4px] border border-border/60 bg-secondary/60 font-mono text-[9px] font-bold uppercase tracking-[0.08em] px-2 py-0.5 text-muted-foreground">
                      past
                    </span>
                  ) : (
                    <span
                      className="font-mono text-[9px] font-bold bg-opacity-10 px-1.5 py-0.5 rounded tracking-wider"
                      style={{ color: accent.hex, backgroundColor: `${accent.hex}1a` }}
                    >
                      T-{getCountdownDays(event.startsAt)}
                    </span>
                  )}
                </div>

                <h1 className="bc-fraunces text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.05]">
                  {event.title}
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed font-serif italic max-w-3xl">
                  &ldquo;{meta.tagline || event.description}&rdquo;
                </p>
              </div>
            </div>

            {/* Content Block / Asymmetric Multi-Column split */}
            <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr] border-b border-border/40">
              {/* Left Segment: Agenda & Coordinates */}
              <div className="p-6 sm:p-8 space-y-8 md:border-r border-border/40">
                <div>
                  <h4 className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
                    Event Manifesto & Goals
                  </h4>
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-line font-sans">
                    {event.description}
                  </p>
                </div>

                {/* Timeline Agenda list */}
                <div>
                  <h4 className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-4">
                    Agenda Schedule
                  </h4>
                  <ol className="space-y-4">
                    {meta.agenda.map((it, idx) => (
                      /* biome-ignore lint/suspicious/noArrayIndexKey: stable order */
                      <li key={idx} className="flex items-start gap-4">
                        <span className="font-mono text-[10px] font-semibold text-muted-foreground w-16 shrink-0 mt-0.5">
                          {it.time}
                        </span>
                        <div className="border-l-2 pl-3" style={{ borderColor: accent.hex }}>
                          <div className="text-[13px] font-semibold text-foreground">
                            {it.title}
                          </div>
                          {it.sub && (
                            <div className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                              {it.sub}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Location Map Line Art */}
                <div className="pt-2">
                  <h4 className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
                    Gathering Coordinates
                  </h4>
                  <div className="h-36 bg-secondary/10 border border-border/40 rounded-[6px] relative overflow-hidden">
                    <svg
                      width="100%"
                      height="100%"
                      className="opacity-20 stroke-current text-muted-foreground animate-pulse"
                    >
                      <title>Decorative grid line art</title>
                      <line x1="0" y1="30" x2="800" y2="30" strokeWidth="1" />
                      <line x1="0" y1="70" x2="800" y2="70" strokeWidth="1" />
                      <line x1="0" y1="110" x2="800" y2="110" strokeWidth="1" />
                      <line x1="140" y1="0" x2="140" y2="160" strokeWidth="1" />
                      <line x1="320" y1="0" x2="320" y2="160" strokeWidth="1" />
                      <line x1="500" y1="0" x2="500" y2="160" strokeWidth="1" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="size-8 bg-card rounded-full flex items-center justify-center shadow relative border border-border/20">
                        <span
                          className="size-2.5 rounded-full absolute animate-ping opacity-75"
                          style={{ backgroundColor: accent.hex }}
                        />
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: accent.hex }}
                        />
                      </div>
                    </div>
                    <span className="absolute bottom-2 right-2 font-mono text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                      {meta.coordinates}
                    </span>
                  </div>
                  <div className="mt-3 text-xs font-semibold text-foreground">
                    {event.location} &middot;{' '}
                    <span className="text-muted-foreground font-normal">
                      {meta.street}, {meta.cityZip}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Segment: Editorial RSVP ticket stub & hosts */}
              <div className="p-6 sm:p-8 bg-secondary/10 dark:bg-secondary/5 space-y-6 flex flex-col justify-between">
                <div className="space-y-6">
                  {/* Practical Specifications Checklist */}
                  <div>
                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      Gathering Specs
                    </span>
                    <div className="mt-2.5 border-t border-border/40">
                      <div className="flex items-center justify-between border-b border-border/40 py-2.5 text-[11px]">
                        <span className="text-muted-foreground">Format</span>
                        <span className="font-semibold text-foreground">
                          {event.location?.toLowerCase().includes('zoom') ||
                          event.location?.toLowerCase().includes('virtual')
                            ? 'Virtual Interactive'
                            : 'In-Person Gathering'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b border-border/40 py-2.5 text-[11px]">
                        <span className="text-muted-foreground">Prerequisite</span>
                        <span
                          className="font-semibold text-foreground truncate max-w-[120px]"
                          title={meta.preparations[0]}
                        >
                          {meta.preparations[0] ? 'See Preparations' : 'None'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b border-border/40 py-2.5 text-[11px]">
                        <span className="text-muted-foreground">Timing</span>
                        <span className="font-semibold text-foreground">
                          {format(starts, 'h:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-2">
                    {!event.isPast ? (
                      <RsvpButtons
                        eventId={event.id}
                        current={event.viewerRsvp}
                        isFull={isFull}
                        size="sm"
                      />
                    ) : null}
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-full rounded-[6px] border-border/60"
                    >
                      <a href={`/events/${event.id}/ical`} download>
                        Add to calendar
                      </a>
                    </Button>
                    {isAdmin ? (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-full rounded-[6px] border-border/60"
                      >
                        <Link href={`/admin/events/${event.id}/edit`}>Edit Event</Link>
                      </Button>
                    ) : null}
                  </div>
                </div>

                {/* Ticket Stub RSVP info */}
                <div className="pt-6 border-t border-dashed border-border/40 relative">
                  <div className="space-y-3">
                    <div className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider flex justify-between">
                      <span>REGISTRATION</span>
                      <span className="font-bold text-foreground">
                        {event.capacity
                          ? `${event.goingCount} / ${event.capacity} booked`
                          : 'Open Seats'}
                      </span>
                    </div>

                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          backgroundColor: accent.hex,
                          width: `${Math.min(100, (event.goingCount / (event.capacity || 100)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Going Attendees Panel */}
          <div className="border border-border/40 rounded-[6px] bg-card overflow-hidden">
            <div className="border-b border-border/60 bg-secondary/30 px-6 py-4">
              <h2 className="font-heading text-base font-semibold text-foreground tracking-[-0.015em]">
                Who&apos;s going ({attendees.going.length})
              </h2>
            </div>
            <div className="p-6 sm:p-8">
              {attendees.going.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">
                  No RSVPs yet &mdash; be the first.
                </p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {attendees.going.slice(0, 50).map((a, idx) => {
                    const palette = STACK_PALETTE[idx % STACK_PALETTE.length] || STACK_PALETTE[0]
                    return (
                      <li
                        key={a.userId}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-[6px] border border-border/20 bg-secondary/10 hover:border-border/40 transition-colors"
                      >
                        <Link
                          href={`/profile/${a.userId}`}
                          className="flex items-center gap-2.5 hover:underline text-foreground min-w-0"
                        >
                          <div
                            className={`relative size-8 shrink-0 overflow-hidden rounded-[6px] border ${a.avatarUrl ? 'border-border/30 bg-secondary' : palette.bg}`}
                          >
                            {a.avatarUrl ? (
                              <Image
                                src={a.avatarUrl}
                                alt={a.name ?? ''}
                                width={32}
                                height={32}
                                unoptimized
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div
                                className={`flex h-full w-full items-center justify-center font-mono text-xs font-bold uppercase ${palette.text}`}
                              >
                                {(a.name ?? '?').slice(0, 1)}
                              </div>
                            )}
                          </div>
                          <span className="text-[13px] font-medium truncate">
                            {a.name ?? (
                              <span className="italic text-muted-foreground">(no name)</span>
                            )}
                          </span>
                        </Link>
                        {a.graduationYear ? (
                          <span className="font-mono text-[10px] font-bold text-muted-foreground/80 shrink-0">
                            &apos;{a.graduationYear.toString().slice(2)}
                          </span>
                        ) : null}
                      </li>
                    )
                  })}
                  {attendees.going.length > 50 ? (
                    <li className="text-[13px] text-muted-foreground col-span-2 pt-2 text-center">
                      + {attendees.going.length - 50} more
                    </li>
                  ) : null}
                </ul>
              )}
            </div>
          </div>

          {/* Waitlist Panel */}
          {attendees.waitlist.length > 0 ? (
            <div className="border border-border/40 rounded-[6px] bg-card overflow-hidden">
              <div className="border-b border-border/60 bg-secondary/30 px-6 py-4">
                <h2 className="font-heading text-base font-semibold text-foreground tracking-[-0.015em]">
                  Waitlist ({attendees.waitlist.length})
                </h2>
              </div>
              <div className="p-6 sm:p-8">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {attendees.waitlist.map((a, idx) => {
                    const palette = STACK_PALETTE[idx % STACK_PALETTE.length] || STACK_PALETTE[0]
                    return (
                      <li
                        key={a.userId}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-[6px] border border-border/20 bg-secondary/10 hover:border-border/40 transition-colors"
                      >
                        <Link
                          href={`/profile/${a.userId}`}
                          className="flex items-center gap-2.5 hover:underline text-foreground min-w-0"
                        >
                          <div
                            className={`relative size-8 shrink-0 overflow-hidden rounded-[6px] border ${a.avatarUrl ? 'border-border/30 bg-secondary' : palette.bg}`}
                          >
                            {a.avatarUrl ? (
                              <Image
                                src={a.avatarUrl}
                                alt={a.name ?? ''}
                                width={32}
                                height={32}
                                unoptimized
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div
                                className={`flex h-full w-full items-center justify-center font-mono text-xs font-bold uppercase ${palette.text}`}
                              >
                                {(a.name ?? '?').slice(0, 1)}
                              </div>
                            )}
                          </div>
                          <span className="text-[13px] font-medium truncate">
                            {a.name ?? (
                              <span className="italic text-muted-foreground">(no name)</span>
                            )}
                          </span>
                        </Link>
                        <span className="rounded-[4px] border border-border/60 bg-secondary/50 font-mono text-[9px] font-bold uppercase tracking-[0.08em] px-1.5 py-0.5 text-muted-foreground shrink-0">
                          #{a.waitlistPosition}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right Column: Other Events Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-6">
          <div className="border border-border/40 rounded-[6px] bg-card overflow-hidden p-5 space-y-6">
            <div>
              <h3 className="font-heading text-sm font-semibold text-foreground tracking-[-0.015em] border-b border-border/40 pb-3">
                Other Events
              </h3>
            </div>

            {upcoming.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Upcoming
                </h4>
                <ul className="space-y-2.5">
                  {upcoming.map((e) => {
                    const isCurrent = e.id === event.id
                    const evAccent = getEventStableColor(e.title)
                    const evMeta = getEventMetadata(e.title)
                    const evDate = new Date(e.startsAt)

                    return (
                      <li key={e.id}>
                        {isCurrent ? (
                          <div
                            className="p-3 rounded-[6px] bg-secondary/30 border border-border/60 flex flex-col gap-1"
                            style={{ borderLeft: `3px solid ${evAccent.hex}` }}
                          >
                            <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                              <span>{evMeta.category}</span>
                              <span className="text-[8px] px-1 bg-foreground/10 text-foreground rounded font-mono font-bold">
                                Active
                              </span>
                            </span>
                            <span className="bc-fraunces text-[13px] font-bold leading-snug text-foreground">
                              {e.title}
                            </span>
                            <span className="font-mono text-[9px] text-muted-foreground">
                              {format(evDate, 'MMM d · h:mm a')}
                            </span>
                          </div>
                        ) : (
                          <Link
                            href={`/events/${e.id}`}
                            className="p-3 rounded-[6px] border border-border/25 hover:border-border/60 hover:bg-secondary/15 transition-all flex flex-col gap-1 group block"
                            style={{ borderLeft: `3px solid ${evAccent.hex}` }}
                          >
                            <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                              {evMeta.category}
                            </span>
                            <span className="bc-fraunces text-[13px] font-bold leading-snug text-foreground group-hover:underline">
                              {e.title}
                            </span>
                            <span className="font-mono text-[9px] text-muted-foreground">
                              {format(evDate, 'MMM d · h:mm a')}
                            </span>
                          </Link>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {past.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Past
                </h4>
                <ul className="space-y-2.5">
                  {past.map((e) => {
                    const isCurrent = e.id === event.id
                    const evAccent = getEventStableColor(e.title)
                    const evMeta = getEventMetadata(e.title)
                    const evDate = new Date(e.startsAt)

                    return (
                      <li key={e.id}>
                        {isCurrent ? (
                          <div
                            className="p-3 rounded-[6px] bg-secondary/30 border border-border/60 flex flex-col gap-1 opacity-70"
                            style={{ borderLeft: `3px solid ${evAccent.hex}` }}
                          >
                            <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                              <span>{evMeta.category}</span>
                              <span className="text-[8px] px-1 bg-foreground/10 text-foreground rounded font-mono font-bold">
                                Active
                              </span>
                            </span>
                            <span className="bc-fraunces text-[13px] font-bold leading-snug text-foreground">
                              {e.title}
                            </span>
                            <span className="font-mono text-[9px] text-muted-foreground">
                              {format(evDate, 'MMM d · h:mm a')}
                            </span>
                          </div>
                        ) : (
                          <Link
                            href={`/events/${e.id}`}
                            className="p-3 rounded-[6px] border border-border/25 hover:border-border/60 hover:bg-secondary/15 transition-all flex flex-col gap-1 group block opacity-75 hover:opacity-100"
                            style={{ borderLeft: `3px solid ${evAccent.hex}` }}
                          >
                            <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                              {evMeta.category}
                            </span>
                            <span className="bc-fraunces text-[13px] font-bold leading-snug text-foreground group-hover:underline">
                              {e.title}
                            </span>
                            <span className="font-mono text-[9px] text-muted-foreground">
                              {format(evDate, 'MMM d · h:mm a')}
                            </span>
                          </Link>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
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

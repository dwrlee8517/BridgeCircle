import { ArrowRight, CalendarPlus, ChevronRight, MapPin, Megaphone, UsersRound } from 'lucide-react'
import Link from 'next/link'
import type {
  NewsletterSummary,
  SchoolAnnouncementSummary,
  SchoolEventCard,
  SchoolHome,
} from '@/lib/school/contracts'
import { newsletterDisplayTitle } from '@/lib/school/presentation'
import { formatEventDate } from '@/lib/school/time'
import { cn } from '@/lib/utils'
import { EventTime } from './event-time'
import { RsvpControl } from './rsvp-control'

export function SchoolHub({
  home,
  selectedEvent,
}: {
  home: SchoolHome
  selectedEvent: SchoolEventCard | null
}) {
  const attending = home.events.filter((event) => ['going', 'offered'].includes(event.viewerRsvp))

  return (
    <div className="min-h-full bg-surface-canvas px-4 py-6 sm:px-7 lg:px-10 lg:py-8">
      <div className="mx-auto w-full max-w-[1060px]">
        <header className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-overline font-bold tracking-caps text-text-secondary uppercase">
              {home.organization.name}
            </p>
            <h1 className="mt-1 font-heading text-page-title font-extrabold tracking-heading text-text-primary">
              Close to school, not buried in it.
            </h1>
            <p className="mt-1 text-control font-medium text-text-secondary">
              The next reason to return, and the notes worth keeping up with.
            </p>
          </div>
        </header>

        <AttendingStrip events={attending} selectedId={selectedEvent?.id ?? null} />

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.85fr)]">
          <section className="min-w-0 space-y-4" aria-label="School events">
            {selectedEvent ? (
              <EventCover event={selectedEvent} />
            ) : (
              <EmptyPanel
                title="Nothing on the calendar yet"
                body="When the school publishes the next gathering, it will land here."
              />
            )}
            <UpcomingEvents events={home.events} selectedId={selectedEvent?.id ?? null} />
          </section>

          <aside className="min-w-0 space-y-4" aria-label="School reading">
            <AnnouncementPanel items={home.announcements} />
            <NewsletterPanel issue={home.latestNewsletter} />
          </aside>
        </div>
      </div>
    </div>
  )
}

function AttendingStrip({
  events,
  selectedId,
}: {
  events: SchoolEventCard[]
  selectedId: string | null
}) {
  return (
    <section
      aria-label="Events you are attending"
      className="overflow-hidden rounded-2xl bg-surface-card px-4 py-3 shadow-card ring-1 ring-border-subtle [contain:paint] sm:px-5"
    >
      <div className="flex items-center gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="flex shrink-0 items-center gap-2 pr-2 text-chip font-bold text-text-secondary">
          <CalendarPlus className="size-4 text-action-weak-text" aria-hidden="true" />
          Your events
        </span>
        {events.length > 0 ? (
          events.map((event) => (
            <Link
              key={event.id}
              href={`/school?event=${event.id}`}
              aria-current={event.id === selectedId ? 'true' : undefined}
              className={cn(
                'flex min-w-[188px] shrink-0 items-center gap-3 rounded-xl px-3 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
                event.id === selectedId ? 'bg-primary-tint-strong' : 'hover:bg-surface-subtle',
              )}
            >
              <DateTile event={event} compact />
              <span className="min-w-0">
                <span className="block truncate text-caption font-bold text-text-primary">
                  {event.title}
                </span>
                <span className="mt-0.5 block truncate text-fine font-semibold text-text-secondary">
                  {event.locationName ?? 'Online'}
                </span>
              </span>
            </Link>
          ))
        ) : (
          <span className="text-caption font-medium text-text-muted">
            Nothing saved yet · browse the next events below
          </span>
        )}
      </div>
    </section>
  )
}

function EventCover({ event }: { event: SchoolEventCard }) {
  const capacityMatters = event.spotsLeft !== null && event.spotsLeft <= 8
  return (
    <article className="relative overflow-hidden rounded-2xl bg-[image:var(--cover-event)] text-surface-ink-foreground shadow-hero before:pointer-events-none before:absolute before:inset-0 before:bg-[image:var(--cover-texture)] before:bg-size-[7px_7px] before:opacity-45">
      <div className="relative grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:p-7">
        <div className="min-w-0">
          <p className="text-overline font-extrabold tracking-caps text-surface-ink-muted uppercase">
            Chadwick · {event.category}
          </p>
          <h2 className="mt-2 max-w-xl font-heading text-display-md font-extrabold tracking-heading text-balance">
            {event.title}
          </h2>
          {event.summary ? (
            <p className="mt-2 max-w-2xl text-control leading-relaxed font-medium text-surface-ink-muted">
              {event.summary}
            </p>
          ) : null}
          <dl className="mt-5 grid gap-3 text-caption font-semibold sm:grid-cols-2">
            <div>
              <dt className="text-fine tracking-caps text-surface-ink-muted uppercase">When</dt>
              <dd className="mt-1">
                <EventTime event={event} />
              </dd>
            </div>
            <div>
              <dt className="text-fine tracking-caps text-surface-ink-muted uppercase">Where</dt>
              <dd className="mt-1 flex items-center gap-1.5">
                <MapPin className="size-3.5" aria-hidden="true" />
                {event.locationName ?? 'Online'}
              </dd>
            </div>
          </dl>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-chip font-semibold text-surface-ink-muted">
            <span className="flex items-center gap-1.5">
              <UsersRound className="size-4" aria-hidden="true" />
              {event.goingCount} going
            </span>
            {event.circleGoingCount > 0 ? (
              <span>· {event.circleGoingCount} from your circle</span>
            ) : null}
            {capacityMatters ? <span>· {event.spotsLeft} spots left</span> : null}
          </div>
        </div>
        <DateTile event={event} variant="glass" />
      </div>
      {event.changeNote ? (
        <p className="relative border-t border-white/10 px-5 py-3 text-chip font-semibold text-surface-ink-muted sm:px-7">
          Updated · {event.changeNote}
        </p>
      ) : null}
      <div className="relative flex flex-wrap items-center gap-2 border-t border-white/10 px-5 py-4 sm:px-7">
        <RsvpControl event={event} tone="dark" />
        <Link
          href={`/school/events/${event.id}/calendar`}
          className="rounded-xl px-3 py-2.5 text-caption font-bold text-surface-ink-muted hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          Add to calendar
        </Link>
        <Link
          href={`/school/events/${event.id}`}
          className="ml-auto inline-flex items-center gap-1 rounded-xl px-3 py-2.5 text-caption font-extrabold text-primary-on-dark hover:bg-white/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          View details <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}

function UpcomingEvents({
  events,
  selectedId,
}: {
  events: SchoolEventCard[]
  selectedId: string | null
}) {
  const upcoming = events.filter((event) => event.id !== selectedId).slice(0, 5)
  return (
    <section className="overflow-hidden rounded-2xl bg-surface-card shadow-card ring-1 ring-border-subtle">
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-fine font-bold tracking-caps text-text-muted uppercase">Upcoming</p>
          <h2 className="mt-0.5 text-body font-extrabold text-text-primary">
            More on the calendar
          </h2>
        </div>
      </div>
      {upcoming.length > 0 ? (
        <div>
          {upcoming.map((event) => (
            <article
              key={event.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-stretch border-t border-divider-row transition-colors hover:bg-surface-subtle"
            >
              <Link
                href={`/school?event=${event.id}`}
                className="grid min-w-0 grid-cols-[auto_1fr] items-center gap-3 px-5 py-3 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring"
              >
                <DateTile event={event} compact />
                <span className="min-w-0">
                  <span className="block truncate text-control font-bold text-text-primary">
                    {event.title}
                  </span>
                  <span className="mt-1 block truncate text-chip font-medium text-text-muted">
                    {event.locationName ?? 'Online'} · {event.goingCount} going
                  </span>
                </span>
              </Link>
              <Link
                href={`/school/events/${event.id}`}
                aria-label={`View details for ${event.title}`}
                className="flex w-11 items-center justify-center text-icon-muted hover:text-action-weak-text focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p className="border-t border-divider-row px-5 py-6 text-caption text-text-muted">
          That is everything currently on the calendar.
        </p>
      )}
    </section>
  )
}

function AnnouncementPanel({ items }: { items: SchoolAnnouncementSummary[] }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-surface-card shadow-card ring-1 ring-border-subtle">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <Megaphone className="size-4 text-action-weak-text" aria-hidden="true" />
          <h2 className="text-body font-extrabold text-text-primary">From the school</h2>
        </div>
        <Link href="/school/announcements" className="text-chip font-bold text-action-weak-text">
          View all <span aria-hidden="true">→</span>
        </Link>
      </div>
      {items.length > 0 ? (
        items.map((item) => (
          <Link
            key={item.id}
            href={`/school/announcements/${item.id}`}
            className={cn(
              'block border-t border-divider-row px-5 py-4 transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring',
              item.pinned && 'bg-primary-tint/60 shadow-[inset_3px_0_0_var(--action-primary)]',
            )}
          >
            <span className="flex items-center gap-2 text-fine font-bold tracking-caps text-text-muted uppercase">
              {item.unread ? (
                <>
                  <span className="size-1.5 rounded-full bg-action-primary" aria-hidden="true" />
                  <span className="sr-only">Unread</span>
                </>
              ) : null}
              {item.pinned ? 'Pinned · ' : ''}
              {item.tag}
            </span>
            <span className="mt-1.5 block text-control font-extrabold text-text-primary">
              {item.title}
            </span>
            <span className="mt-1 line-clamp-2 block text-chip leading-relaxed text-text-secondary">
              {item.summary}
            </span>
          </Link>
        ))
      ) : (
        <p className="border-t border-divider-row px-5 py-6 text-caption text-text-muted">
          No announcements right now.
        </p>
      )}
    </section>
  )
}

function NewsletterPanel({ issue }: { issue: NewsletterSummary | null }) {
  if (!issue) return null
  return (
    <section className="rounded-2xl bg-surface-card p-5 shadow-card ring-1 ring-border-subtle">
      <p className="text-fine font-bold tracking-caps text-text-muted uppercase">Newsletter</p>
      <h2 className="mt-2 text-body font-extrabold text-text-primary">
        {newsletterDisplayTitle(issue.title)}
      </h2>
      {issue.summary ? (
        <p className="mt-2 text-caption leading-relaxed text-text-secondary">{issue.summary}</p>
      ) : null}
      <div className="mt-4 flex items-center justify-between gap-3">
        <Link
          href={`/school/newsletter/${issue.slug}`}
          className="text-caption font-bold text-action-weak-text"
        >
          Read this issue <span aria-hidden="true">→</span>
        </Link>
        <Link
          href="/school/newsletter"
          className="text-chip font-semibold text-text-muted hover:text-text-secondary"
        >
          Archive
        </Link>
      </div>
    </section>
  )
}

function DateTile({
  event,
  compact = false,
  variant = 'default',
}: {
  event: SchoolEventCard
  compact?: boolean
  variant?: 'default' | 'glass'
}) {
  const date = new Date(event.startsAt)
  const month = new Intl.DateTimeFormat('en-US', { timeZone: event.timeZone, month: 'short' })
    .format(date)
    .toUpperCase()
  const day = new Intl.DateTimeFormat('en-US', { timeZone: event.timeZone, day: 'numeric' }).format(
    date,
  )
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: event.timeZone, weekday: 'short' })
    .format(date)
    .toUpperCase()
  return (
    <span
      className={cn(
        'flex shrink-0 flex-col items-center justify-center rounded-xl text-surface-ink shadow-sm',
        variant === 'glass'
          ? 'bg-[var(--glass-tile)] text-white shadow-[var(--ring-glass),var(--shadow-raised)] backdrop-blur-sm'
          : 'bg-white ring-1 ring-black/5',
        compact ? 'h-12 w-12' : 'h-28 w-24',
      )}
    >
      <span className="sr-only">{formatEventDate(event.startsAt, event.timeZone)}</span>
      <span
        className={cn(
          'font-extrabold tracking-caps',
          variant === 'glass' ? 'text-[var(--cover-accent)]' : 'text-action-weak-text',
          compact ? 'text-micro' : 'text-overline',
        )}
      >
        {month}
      </span>
      <span
        className={cn(
          'font-heading font-black tracking-heading',
          compact ? 'text-section-title leading-5' : 'text-event-date leading-none',
        )}
      >
        {day}
      </span>
      {!compact ? (
        <span
          className={cn(
            'text-micro font-bold tracking-caps',
            variant === 'glass' ? 'text-white/75' : 'text-text-muted',
          )}
        >
          {weekday}
        </span>
      ) : null}
    </span>
  )
}

function EmptyPanel({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-2xl bg-surface-card px-6 py-12 text-center shadow-card ring-1 ring-border-subtle">
      <h2 className="text-body font-extrabold text-text-primary">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-caption leading-relaxed text-text-secondary">
        {body}
      </p>
    </section>
  )
}

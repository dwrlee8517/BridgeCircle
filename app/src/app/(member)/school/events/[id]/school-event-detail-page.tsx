import { ArrowLeft, CalendarPlus, ExternalLink, MapPin, UsersRound, Video } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { SchoolEventAttendees, SchoolEventDetail } from '@/lib/school/contracts'
import { formatEventTimeRange } from '@/lib/school/time'
import { EventTime } from '../../event-time'
import { RsvpControl } from '../../rsvp-control'

export function SchoolEventDetailPage({
  event,
  attendees,
  avatarUrls,
}: {
  event: SchoolEventDetail
  attendees: SchoolEventAttendees
  avatarUrls: Record<string, string>
}) {
  return (
    <div className="min-h-full bg-surface-canvas">
      <header className="border-b border-divider-row bg-surface-card px-4 py-3 sm:px-7">
        <div className="mx-auto flex max-w-[1060px] items-center gap-3">
          <Link
            href={`/school?event=${event.id}`}
            aria-label="Back to School"
            className="flex size-9 items-center justify-center rounded-full bg-surface-subtle text-text-secondary hover:bg-primary-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <span className="text-caption font-extrabold text-text-primary">{event.title}</span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1060px] px-4 py-5 sm:px-7 sm:py-7">
        <EventHero event={event} />

        {event.changeNote || event.cancellationNote || event.phase === 'past' ? (
          <p className="mt-3 rounded-xl bg-surface-card px-4 py-3 text-chip font-semibold text-text-secondary shadow-card ring-1 ring-border-subtle">
            {event.phase === 'cancelled'
              ? `Cancelled · ${event.cancellationNote ?? 'Everyone who responded was notified once.'}`
              : event.phase === 'past'
                ? `This one is wrapped. ${event.goingCount} members attended.`
                : `Updated · ${event.changeNote}`}
          </p>
        ) : null}

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
          <div className="min-w-0 space-y-4">
            {event.description ? (
              <ContentCard title="About">
                <div className="space-y-3 text-control leading-relaxed font-medium whitespace-pre-line text-text-secondary">
                  {event.description}
                </div>
                <div className="mt-4 flex items-center gap-2 border-t border-divider-row pt-3 text-chip">
                  <span className="text-text-muted">Hosted by</span>
                  {event.hostUserId ? (
                    <Link
                      href={`/profile/${event.hostUserId}`}
                      className="font-bold text-action-weak-text"
                    >
                      {event.hostName} <span aria-hidden="true">›</span>
                    </Link>
                  ) : (
                    <span className="font-bold text-text-primary">{event.hostName}</span>
                  )}
                </div>
              </ContentCard>
            ) : null}

            {event.schedule.length > 0 ? (
              <section className="overflow-hidden rounded-2xl bg-surface-card shadow-card ring-1 ring-border-subtle">
                <h2 className="px-5 py-4 text-body font-extrabold text-text-primary">Itinerary</h2>
                {event.schedule.map((item) => (
                  <div key={item.id} className="flex gap-4 border-t border-divider-row px-5 py-3">
                    <span className="w-24 shrink-0 text-caption font-extrabold text-action-weak-text">
                      {item.startsAt
                        ? formatEventTimeRange(item.startsAt, null, event.timeZone)
                        : `Step ${item.position + 1}`}
                    </span>
                    <span className="text-control font-semibold text-text-primary">
                      {item.label}
                    </span>
                  </div>
                ))}
              </section>
            ) : null}

            {event.facts.length > 0 ? (
              <section>
                <h2 className="mb-3 text-body font-extrabold text-text-primary">Good to know</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {event.facts.map((fact) => (
                    <article
                      key={fact.id}
                      className="rounded-2xl bg-surface-card p-4 shadow-card ring-1 ring-border-subtle"
                    >
                      <p className="text-fine font-bold tracking-caps text-text-muted uppercase">
                        {fact.label}
                      </p>
                      <p className="mt-1.5 text-control font-bold text-text-primary">
                        {fact.value}
                      </p>
                      {fact.linkLabel && fact.linkUrl ? (
                        <a
                          href={fact.linkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-chip font-bold text-action-weak-text"
                        >
                          {fact.linkLabel} <ExternalLink className="size-3" aria-hidden="true" />
                        </a>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="min-w-0 space-y-4" aria-label="Event attendance">
            <AttendeeCard attendees={attendees} avatarUrls={avatarUrls} />
          </aside>
        </div>
      </div>
    </div>
  )
}

function EventHero({ event }: { event: SchoolEventDetail }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-surface-ink text-surface-ink-foreground shadow-hero">
      <div className="grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:p-8">
        <div className="flex h-32 w-28 shrink-0 flex-col items-center justify-center rounded-2xl bg-white text-surface-ink shadow-sm">
          <span className="text-overline font-extrabold tracking-caps text-action-weak-text uppercase">
            {new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: event.timeZone }).format(
              new Date(event.startsAt),
            )}
          </span>
          <span className="font-heading text-event-date-md font-black leading-none tracking-heading">
            {new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: event.timeZone }).format(
              new Date(event.startsAt),
            )}
          </span>
          <span className="text-micro font-bold tracking-caps text-text-muted uppercase">
            {new Intl.DateTimeFormat('en-US', {
              weekday: 'short',
              timeZone: event.timeZone,
            }).format(new Date(event.startsAt))}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-overline font-extrabold tracking-caps text-surface-ink-muted uppercase">
            Event · {event.category}
          </p>
          <h1 className="mt-2 font-heading text-display-event font-black leading-tight tracking-heading text-balance">
            {event.title}
          </h1>
          {event.summary ? (
            <p className="mt-2 text-control leading-relaxed text-surface-ink-muted">
              {event.summary}
            </p>
          ) : null}
          <div className="mt-5 grid gap-3 text-caption font-semibold sm:grid-cols-3">
            <div>
              <p className="text-fine tracking-caps text-surface-ink-muted uppercase">When</p>
              <div className="mt-1">
                <EventTime event={event} />
              </div>
            </div>
            <div>
              <p className="text-fine tracking-caps text-surface-ink-muted uppercase">Where</p>
              <p className="mt-1 flex items-center gap-1.5">
                <MapPin className="size-3.5" aria-hidden="true" />
                {event.locationName ?? 'Online'}
              </p>
            </div>
            <div>
              <p className="text-fine tracking-caps text-surface-ink-muted uppercase">Format</p>
              <p className="mt-1">
                {event.format === 'in_person'
                  ? 'In person'
                  : event.format === 'online'
                    ? 'Online'
                    : 'Hybrid'}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-6 py-4 sm:px-8">
        <RsvpControl event={event} tone="dark" />
        {event.joinUrl ? (
          <a
            href={event.joinUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-action-primary-pressed px-4 py-2.5 text-caption font-extrabold text-action-on-primary hover:bg-[var(--blue-800)]"
          >
            <Video className="size-4" aria-hidden="true" /> Join now
          </a>
        ) : null}
        <Link
          href={`/school/events/${event.id}/calendar`}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-caption font-bold text-surface-ink-muted hover:bg-white/8 hover:text-white"
        >
          <CalendarPlus className="size-4" aria-hidden="true" /> Add to calendar
        </Link>
        <span className="ml-auto text-chip font-semibold text-surface-ink-muted">
          <UsersRound className="mr-1 inline size-4" aria-hidden="true" /> {event.goingCount} going
        </span>
      </div>
    </section>
  )
}

function ContentCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-surface-card p-5 shadow-card ring-1 ring-border-subtle">
      <h2 className="text-body font-extrabold text-text-primary">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  )
}

function AttendeeCard({
  attendees,
  avatarUrls,
}: {
  attendees: SchoolEventAttendees
  avatarUrls: Record<string, string>
}) {
  return (
    <section className="overflow-hidden rounded-2xl bg-surface-card shadow-card ring-1 ring-border-subtle">
      <div className="px-5 py-4">
        <h2 className="text-body font-extrabold text-text-primary">Who&apos;s going</h2>
        <p className="mt-0.5 text-chip font-semibold text-text-muted">
          {attendees.totalCount} going · your circle first
        </p>
      </div>
      {attendees.items.map((person) => {
        const name = person.preferredName ?? person.displayName
        const avatarUrl = person.avatarPath ? avatarUrls[person.avatarPath] : null
        return (
          <Link
            key={person.membershipId}
            href={`/profile/${person.userId}`}
            className="flex items-center gap-3 border-t border-divider-row px-5 py-3 hover:bg-surface-subtle"
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                width={36}
                height={36}
                className="size-9 rounded-full object-cover ring-1 ring-border"
              />
            ) : (
              <span className="flex size-9 items-center justify-center rounded-full bg-[var(--avatar-1-bg)] text-chip font-extrabold text-[var(--avatar-1-fg)] ring-1 ring-border">
                {initials(name)}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-control font-bold text-text-primary">
                {name}
              </span>
              <span className="text-fine font-semibold text-text-muted">
                {person.graduationYear
                  ? `Class of ’${String(person.graduationYear).slice(-2)}`
                  : 'Member'}
                {person.inCircle ? ' · In your circle' : ''}
              </span>
            </span>
            <span className="text-chip font-bold text-text-muted">Profile ›</span>
          </Link>
        )
      })}
      {attendees.hiddenCount > 0 ? (
        <p className="border-t border-divider-row px-5 py-3 text-fine leading-relaxed text-text-muted">
          {attendees.hiddenCount} more members keep attendance private; they are counted, not
          listed.
        </p>
      ) : null}
    </section>
  )
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

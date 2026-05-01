import { format } from 'date-fns'
import { Calendar, ChevronRight, Clock, MapPin, Plus, Share2, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { type EventRow, listEvents } from '@/lib/events/listEvents'
import { displayOrgName } from '@/lib/utils'
import { RsvpQuickButton } from './rsvp-quick-button'

type SearchParams = { view?: string; selected?: string }

export type EventAttendee = {
  userId: string
  name: string | null
  avatarUrl: string | null
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await requireSession()
  const supabase = await createClient()
  const sp = await searchParams
  const view: 'upcoming' | 'past' = sp.view === 'past' ? 'past' : 'upcoming'

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('organization_id, organizations(name)')
    .eq('user_id', session.userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (!membership) return null

  const orgName = displayOrgName((membership.organizations as { name: string } | null)?.name)

  const [allEvents, { data: adminRole }] = await Promise.all([
    listEvents(supabase, membership.organization_id, session.userId, { includePast: true }),
    supabase
      .from('admin_role_assignments')
      .select('role')
      .eq('user_id', session.userId)
      .eq('organization_id', membership.organization_id)
      .in('role', ['super_admin', 'admin'])
      .limit(1)
      .maybeSingle(),
  ])
  const isAdmin = !!adminRole

  const now = Date.now()
  const upcoming = allEvents
    .filter((e) => new Date(e.startsAt).getTime() >= now)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
  const past = allEvents
    .filter((e) => new Date(e.startsAt).getTime() < now)
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())

  const events = view === 'upcoming' ? upcoming : past
  // Honor `?selected` if it points at an event in the current tab; otherwise
  // fall back to the first event so the right panel always has content.
  const selected = events.find((e) => e.id === sp.selected) ?? events[0] ?? null

  // Pull a small attendee preview for the right-panel avatar stack — RLS
  // already prevents leaking RSVPs from events the viewer can't see.
  const attendees: EventAttendee[] = selected
    ? await loadAttendeePreview(supabase, selected.id, 5)
    : []

  return (
    <div>
      <Hero orgName={orgName} totalUpcoming={upcoming.length} isAdmin={isAdmin} />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div className="flex gap-1 border-b">
            <TabLink href="/events" active={view === 'upcoming'} count={upcoming.length}>
              Upcoming
            </TabLink>
            <TabLink href="/events?view=past" active={view === 'past'} count={past.length}>
              Past
            </TabLink>
          </div>
        </div>

        {events.length === 0 ? (
          view === 'upcoming' ? (
            <EmptyState
              icon={Calendar}
              title="No upcoming events"
              description={
                isAdmin
                  ? 'Schedule a mixer, panel, or campus visit. Members will see it on their dashboard.'
                  : 'Check back soon — events show up here as they get scheduled.'
              }
              action={isAdmin ? { label: 'Create event', href: '/admin/events' } : undefined}
            />
          ) : (
            <EmptyState
              icon={Calendar}
              title="No past events"
              description="Once events have happened, they'll show up here for reference."
            />
          )
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <FilterChips />
              <div className="space-y-3">
                {events.map((e) => (
                  <EventListItem key={e.id} event={e} view={view} active={selected?.id === e.id} />
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
        )}
      </div>
    </div>
  )
}

/**
 * Up to `limit` going-RSVPs for the event, hydrated with name + avatar from
 * base_profiles. Used only for the right-panel attendee stack — never for
 * authorization or RSVP logic.
 */
async function loadAttendeePreview(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string,
  limit: number,
): Promise<EventAttendee[]> {
  const { data: rsvps } = await supabase
    .from('event_rsvps')
    .select('user_id, responded_at')
    .eq('event_id', eventId)
    .eq('status', 'going')
    .order('responded_at', { ascending: true })
    .limit(limit)
  if (!rsvps || rsvps.length === 0) return []

  const userIds = rsvps.map((r) => r.user_id)
  const { data: profiles } = await supabase
    .from('base_profiles')
    .select('user_id, name, avatar_url')
    .in('user_id', userIds)
  const profileById = new Map((profiles ?? []).map((p) => [p.user_id, p]))

  return rsvps.map((r) => {
    const p = profileById.get(r.user_id)
    return {
      userId: r.user_id,
      name: p?.name ?? null,
      avatarUrl: p?.avatar_url ?? null,
    }
  })
}

// =============================================================================
// Hero — light gradient, eyebrow + Fraunces title, prototype style.
// =============================================================================

function Hero({
  orgName,
  totalUpcoming,
  isAdmin,
}: {
  orgName: string
  totalUpcoming: number
  isAdmin: boolean
}) {
  return (
    <section className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl items-end justify-between gap-4 px-4 py-12 sm:px-8 sm:py-14">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Events · {totalUpcoming} upcoming
          </p>
          <h1
            className="bc-fraunces mt-2 text-4xl font-bold tracking-[-0.025em] text-foreground sm:text-[44px]"
            style={{ fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 25' }}
          >
            What's happening across the circle.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Gatherings for {orgName}.</p>
        </div>
        {isAdmin ? (
          <Button asChild size="lg" className="shrink-0">
            <Link href="/admin/events">
              <Plus className="size-4" />
              Create event
            </Link>
          </Button>
        ) : null}
      </div>
    </section>
  )
}

// =============================================================================
// Filter chips — prototype shows All / Reunion / Mixer / Panel / Mentorship.
// Only "All" routes (the schema doesn't carry an event type today). Other
// chips are disabled for now and tagged "coming soon" via title attribute.
// =============================================================================

function FilterChips() {
  const chips = ['All', 'Reunion', 'Mixer', 'Panel', 'Mentorship'] as const
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {chips.map((label, i) => {
        const active = i === 0
        return (
          <button
            key={label}
            type="button"
            disabled={!active}
            title={active ? undefined : 'Type filters coming soon'}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              active
                ? 'border-foreground bg-foreground text-background'
                : 'border-border bg-card text-foreground hover:border-foreground/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// =============================================================================
// List item — date tile + status pill + title + meta.
// =============================================================================

function EventListItem({
  event: e,
  view,
  active,
}: {
  event: EventRow
  view: 'upcoming' | 'past'
  active: boolean
}) {
  const start = new Date(e.startsAt)
  const params = new URLSearchParams()
  if (view === 'past') params.set('view', 'past')
  params.set('selected', e.id)
  // Anchor to #event-detail so the right panel scrolls into view on narrow
  // screens where the sticky column collapses below the list.
  const href = `/events?${params.toString()}#event-detail`
  return (
    <Link
      href={href}
      scroll={false}
      className={`block rounded-xl border p-5 transition-all ${
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
    </Link>
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

// =============================================================================
// Featured detail panel — sapphire gradient hero + meta rows + RSVP CTA.
// Reflects the currently-selected list item; the CTA routes to /events/[id]
// for the full event page (RSVP, description, etc.).
// =============================================================================

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

// =============================================================================
// Attendee stack — overlapping pastel circles + names line, prototype style.
// =============================================================================

const STACK_PALETTE = [
  { bg: '#dbe1ff', fg: '#00174b' }, // pale sapphire
  { bg: '#fef3c7', fg: '#78350f' }, // pale amber
  { bg: '#d1fae5', fg: '#064e3b' }, // pale emerald
  { bg: '#ffdad6', fg: '#7f1d1d' }, // pale rose
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

// =============================================================================
// Tab link — minimal pill / underline tab.
// =============================================================================

function TabLink({
  href,
  active,
  count,
  children,
}: {
  href: string
  active: boolean
  count: number
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`-mb-px border-b-2 px-3 py-1.5 text-sm transition-colors ${
        active
          ? 'border-foreground font-medium'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
      <span className="ml-1.5 text-xs text-muted-foreground">({count})</span>
    </Link>
  )
}

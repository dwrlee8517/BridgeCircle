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

type SearchParams = { view?: string }

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
  const featured = events[0] ?? null

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
                  <EventListItem key={e.id} event={e} active={featured?.id === e.id} />
                ))}
              </div>
            </div>
            <div>
              {featured ? (
                <div className="lg:sticky lg:top-24">
                  <FeaturedEventDetail event={featured} viewIsPast={view === 'past'} />
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  )
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

function EventListItem({ event: e, active }: { event: EventRow; active: boolean }) {
  const start = new Date(e.startsAt)
  return (
    <Link
      href={`/events/${e.id}`}
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
// Whole panel links into /events/[id] for the full event page.
// =============================================================================

function FeaturedEventDetail({ event: e, viewIsPast }: { event: EventRow; viewIsPast: boolean }) {
  const start = new Date(e.startsAt)
  const isFull = e.capacity !== null && e.goingCount >= e.capacity
  return (
    <Card className="overflow-hidden p-0">
      <Link href={`/events/${e.id}`} className="block">
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
      </Link>
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

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
          {e.waitlistCount > 0 ? (
            <Badge variant="outline" className="text-[11px]">
              {e.waitlistCount} on waitlist
            </Badge>
          ) : (
            <span />
          )}
        </div>

        <div className="flex gap-2">
          <Button asChild size="lg" className="flex-1">
            <Link href={`/events/${e.id}`}>
              {viewIsPast ? 'View event' : isFull ? 'Join waitlist' : 'View & RSVP'}
              <ChevronRight className="size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href={`/events/${e.id}`}>
              <Share2 className="size-4" />
              <span className="sr-only">Share</span>
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  )
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

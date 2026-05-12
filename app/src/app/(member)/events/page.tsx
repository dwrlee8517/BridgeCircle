import { Calendar, Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import type { EventAttendee } from '@/lib/events/attendeePreviewHelpers'
import { listAttendeePreviewsByEvent } from '@/lib/events/listAttendeePreviewsByEvent'
import { listEvents } from '@/lib/events/listEvents'
import { displayOrgName } from '@/lib/utils'
import { EventsMasterDetail } from './events-master-detail'

type SearchParams = { view?: string; selected?: string }

const ATTENDEE_PREVIEW_LIMIT = 5

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

  // eslint-disable-next-line react-hooks/purity -- server component, runs once per request
  const now = Date.now()
  const upcoming = allEvents
    .filter((e) => new Date(e.startsAt).getTime() >= now)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
  const past = allEvents
    .filter((e) => new Date(e.startsAt).getTime() < now)
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())

  const events = view === 'upcoming' ? upcoming : past

  // Pre-load top-N attendees for every event in the current tab so a click
  // on a card just swaps right-panel content client-side — no per-click
  // round trip. RLS still filters; this is one batched query for all events.
  const attendeesMap = await listAttendeePreviewsByEvent(
    supabase,
    events.map((e) => e.id),
    ATTENDEE_PREVIEW_LIMIT,
  )
  const attendeesByEvent: Record<string, EventAttendee[]> = {}
  for (const [id, list] of attendeesMap) attendeesByEvent[id] = list

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
          <EventsMasterDetail
            events={events}
            attendeesByEvent={attendeesByEvent}
            view={view}
            initialSelectedId={sp.selected ?? null}
          />
        )}
      </div>
    </div>
  )
}

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
            What&apos;s happening across the circle.
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

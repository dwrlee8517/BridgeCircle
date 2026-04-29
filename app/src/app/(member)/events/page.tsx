import { format } from 'date-fns'
import { Calendar, MapPin, Plus, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { RailSection, TwoColumn } from '@/components/ui/two-column'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { type EventRow, listEvents } from '@/lib/events/listEvents'
import { displayOrgName } from '@/lib/utils'
import { RsvpButtons } from './rsvp-buttons'

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

  // Fetch is RLS-respected: members only see published events. The Past tab
  // pulls includePast and then we filter locally so we don't have to write a
  // second listEvents API. (For 100 events this is cheap.)
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

  return (
    <TwoColumn aside={<EventsRail upcoming={upcoming} isAdmin={isAdmin} />}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Events</h1>
          <p className="text-sm text-muted-foreground">Gatherings for {orgName}.</p>
        </div>
        {isAdmin ? (
          <Button asChild size="lg">
            <Link href="/admin/events">
              <Plus className="size-4" />
              Create event
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="flex gap-1 border-b">
        <TabLink href="/events" active={view === 'upcoming'} count={upcoming.length}>
          Upcoming
        </TabLink>
        <TabLink href="/events?view=past" active={view === 'past'} count={past.length}>
          Past
        </TabLink>
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
        <div className="space-y-4">
          {events.map((e) => (
            <EventCard key={e.id} event={e} viewIsPast={view === 'past'} />
          ))}
        </div>
      )}
    </TwoColumn>
  )
}

// =============================================================================
// Right rail — "next 7 days" mini-list + admin tips
// =============================================================================

function EventsRail({ upcoming, isAdmin }: { upcoming: EventRow[]; isAdmin: boolean }) {
  const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000
  const next7 = upcoming
    .filter((e) => new Date(e.startsAt).getTime() <= sevenDaysFromNow)
    .slice(0, 5)

  return (
    <>
      <RailSection title="Next 7 days">
        {next7.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing this week.</p>
        ) : (
          <ul className="space-y-3">
            {next7.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/events/${e.id}`}
                  className="flex items-start gap-2.5 text-sm hover:text-primary"
                >
                  <div className="flex size-9 shrink-0 flex-col items-center justify-center rounded-md border bg-accent/40">
                    <span className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                      {format(new Date(e.startsAt), 'MMM')}
                    </span>
                    <span className="text-xs font-semibold leading-none">
                      {format(new Date(e.startsAt), 'd')}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium leading-tight">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(e.startsAt), 'EEE · h:mm a')}
                    </p>
                    {e.location ? (
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <MapPin className="size-3 shrink-0" />
                        {e.location}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </RailSection>

      {isAdmin ? (
        <RailSection title="Admin tips">
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              Set a capacity to enable the waitlist — newcomers join an automatic queue when the
              event fills up.
            </span>
          </p>
        </RailSection>
      ) : null}
    </>
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

function EventCard({ event: e, viewIsPast }: { event: EventRow; viewIsPast: boolean }) {
  const isFull = e.capacity !== null && e.goingCount >= e.capacity
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              <Link href={`/events/${e.id}`} className="hover:underline">
                {e.title}
              </Link>
            </CardTitle>
            <CardDescription>
              <span className="block">{format(new Date(e.startsAt), 'EEE, MMM d · h:mm a')}</span>
              {e.location ? (
                <span className="block text-muted-foreground">{e.location}</span>
              ) : null}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="secondary">
              {e.capacity !== null
                ? `${e.goingCount} / ${e.capacity} going`
                : `${e.goingCount} going`}
            </Badge>
            {e.waitlistCount > 0 ? (
              <Badge variant="outline" className="text-[10px]">
                {e.waitlistCount} on waitlist
              </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {e.description ? (
          <p className="line-clamp-2 text-sm whitespace-pre-line">{e.description}</p>
        ) : null}
        {!viewIsPast ? <RsvpButtons eventId={e.id} current={e.viewerRsvp} isFull={isFull} /> : null}
      </CardContent>
    </Card>
  )
}

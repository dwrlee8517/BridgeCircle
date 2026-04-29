import { format } from 'date-fns'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { type EventRow, listEvents } from '@/lib/events/listEvents'
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

  const orgName = (membership.organizations as { name: string } | null)?.name ?? 'your network'

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
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Events</h1>
          <p className="text-sm text-muted-foreground">Gatherings for {orgName}.</p>
        </div>
        {isAdmin ? (
          <Button asChild>
            <Link href="/admin/events">Create event</Link>
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
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {view === 'upcoming' ? (
              <>
                No upcoming events yet.
                {isAdmin ? (
                  <>
                    {' '}
                    <Link href="/admin/events" className="underline">
                      Create one
                    </Link>
                    .
                  </>
                ) : null}
              </>
            ) : (
              <>No past events.</>
            )}
          </CardContent>
        </Card>
      ) : (
        events.map((e) => <EventCard key={e.id} event={e} viewIsPast={view === 'past'} />)
      )}
    </div>
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

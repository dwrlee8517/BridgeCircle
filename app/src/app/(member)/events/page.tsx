import { format } from 'date-fns'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { listEvents } from '@/lib/events/listEvents'
import { RsvpButtons } from './rsvp-buttons'

export default async function EventsPage() {
  const session = await requireSession()
  const supabase = await createClient()

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('organization_id, organizations(name)')
    .eq('user_id', session.userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (!membership) return null

  const orgName = (membership.organizations as { name: string } | null)?.name ?? 'your network'

  const [events, { data: adminRole }] = await Promise.all([
    listEvents(supabase, membership.organization_id, session.userId),
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Events</h1>
          <p className="text-sm text-muted-foreground">Upcoming gatherings for {orgName}.</p>
        </div>
        {isAdmin ? (
          <Button asChild>
            <Link href="/admin/events">Create event</Link>
          </Button>
        ) : null}
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
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
          </CardContent>
        </Card>
      ) : (
        events.map((e) => (
          <Card key={e.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{e.title}</CardTitle>
                  <CardDescription>
                    <span className="block">
                      {format(new Date(e.startsAt), 'EEE, MMM d · h:mm a')}
                    </span>
                    {e.location ? (
                      <span className="block text-muted-foreground">{e.location}</span>
                    ) : null}
                  </CardDescription>
                </div>
                <Badge variant="secondary">{e.goingCount} going</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {e.description ? (
                <p className="text-sm whitespace-pre-line">{e.description}</p>
              ) : null}
              <RsvpButtons eventId={e.id} current={e.viewerRsvp} />
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

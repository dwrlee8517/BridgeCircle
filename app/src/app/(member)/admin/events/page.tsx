import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createClient } from '@/db/server'
import { requireAdmin } from '@/lib/auth/session'
import { listEvents } from '@/lib/events/listEvents'
import { EventForm } from './event-form'

export default async function AdminEventsPage() {
  const session = await requireAdmin()
  const supabase = await createClient()

  const { data: roles } = await supabase
    .from('admin_role_assignments')
    .select('organization_id, organizations(name)')
    .eq('user_id', session.userId)
    .in('role', ['super_admin', 'admin'])
    .limit(1)
  const adminOrg = roles?.[0]
  if (!adminOrg) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-muted-foreground">No admin organization.</p>
      </div>
    )
  }
  const orgName = (adminOrg.organizations as { name: string } | null)?.name ?? 'your organization'

  const events = await listEvents(supabase, adminOrg.organization_id, session.userId, {
    includePast: true,
  })

  const now = Date.now()
  const upcoming = events.filter((e) => new Date(e.startsAt).getTime() >= now)
  const past = events.filter((e) => new Date(e.startsAt).getTime() < now)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>New event</CardTitle>
          <CardDescription>
            Publishes immediately to {orgName}. Anyone in the org can RSVP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EventForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
          <CardDescription>
            {upcoming.length} upcoming · {past.length} past
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Going</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((e) => {
                  const isPast = new Date(e.startsAt).getTime() < now
                  return (
                    <TableRow key={e.id}>
                      <TableCell>
                        <div className="font-medium">{e.title}</div>
                        {isPast ? (
                          <Badge variant="outline" className="mt-0.5 text-[10px]">
                            past
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(e.startsAt), 'MMM d, h:mm a')}
                      </TableCell>
                      <TableCell className="text-sm">{e.location ?? '—'}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {e.goingCount}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { format } from 'date-fns'
import Link from 'next/link'
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

  // Admin sees everything in the org: past, future, AND canceled (events
  // with published_at = null). Member views never see drafts/canceled — RLS
  // and the default listEvents filter both block them.
  const events = await listEvents(supabase, adminOrg.organization_id, session.userId, {
    includePast: true,
    includeDrafts: true,
  })

  // eslint-disable-next-line react-hooks/purity -- server component, runs once per request
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
                  <TableHead className="text-right">Capacity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((e) => {
                  const isPast = new Date(e.startsAt).getTime() < now
                  const isCanceled = e.publishedAt === null
                  return (
                    <TableRow key={e.id}>
                      <TableCell>
                        <div className="font-medium">
                          <Link href={`/events/${e.id}`} className="hover:underline">
                            {e.title}
                          </Link>
                        </div>
                        <div className="flex gap-1 mt-0.5">
                          {isPast ? (
                            <Badge variant="outline" className="text-[10px]">
                              past
                            </Badge>
                          ) : null}
                          {isCanceled ? (
                            <Badge variant="destructive" className="text-[10px]">
                              canceled
                            </Badge>
                          ) : null}
                          {e.waitlistCount > 0 ? (
                            <Badge variant="secondary" className="text-[10px]">
                              {e.waitlistCount} waitlisted
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(e.startsAt), 'MMM d, h:mm a')}
                      </TableCell>
                      <TableCell className="text-sm">{e.location ?? '—'}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {e.goingCount}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {e.capacity ?? '∞'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/admin/events/${e.id}/edit`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Edit
                        </Link>
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

import { format } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createSchoolRepository } from '@/db/repositories/school'
import { displayOrgName } from '@/lib/utils'
import { loadSchoolAdminContext } from '../_lib/school-admin'
import { EventForm } from './event-form'

export default async function AdminEventsPage() {
  const { client, membership } = await loadSchoolAdminContext()
  const events = await createSchoolRepository(client).getAdminEvents(membership.membershipId)
  const orgName = displayOrgName(membership.organization.name)

  // eslint-disable-next-line react-hooks/purity -- server component, runs once per request
  const now = Date.now()
  const availableEvents = events ?? []
  const upcoming = availableEvents.filter((event) => new Date(event.startsAt).getTime() >= now)
  const past = availableEvents.filter((event) => new Date(event.startsAt).getTime() < now)

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
          {availableEvents.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No events yet"
              description="Use the form above to publish the first event for this organization."
              size="inline"
              className="border-none bg-transparent shadow-none"
            />
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
                {availableEvents.map((e) => {
                  const isPast = new Date(e.startsAt).getTime() < now
                  const isCanceled = e.status === 'cancelled'
                  return (
                    <TableRow key={e.id}>
                      <TableCell>
                        <div className="font-medium">
                          <Link href={`/school/events/${e.id}`} className="hover:underline">
                            {e.title}
                          </Link>
                        </div>
                        <div className="flex gap-1 mt-0.5">
                          {isPast ? (
                            <Badge variant="outline" className="text-xs">
                              past
                            </Badge>
                          ) : null}
                          {isCanceled ? (
                            <Badge variant="destructive" className="text-xs">
                              canceled
                            </Badge>
                          ) : null}
                          {e.waitlistCount > 0 ? (
                            <Badge variant="secondary" className="text-xs">
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

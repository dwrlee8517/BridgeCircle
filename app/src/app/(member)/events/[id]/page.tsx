import { format } from 'date-fns'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { getEvent } from '@/lib/events/getEvent'
import { listAttendees } from '@/lib/events/listAttendees'
import { RsvpButtons } from '../rsvp-buttons'

type Params = { id: string }

export default async function EventDetailPage({ params }: { params: Promise<Params> }) {
  const session = await requireSession()
  const { id } = await params
  const supabase = await createClient()

  const event = await getEvent(supabase, id, session.userId)
  if (!event) notFound() // RLS hides canceled events from members; admin-deletes 404 too

  // Two parallel reads: attendees (for the going list) + admin status (for
  // the Edit button). The latter is org-scoped via the event's organization.
  const [attendees, { data: adminRole }] = await Promise.all([
    listAttendees(supabase, event.id, event.organizationId),
    supabase
      .from('admin_role_assignments')
      .select('role')
      .eq('user_id', session.userId)
      .eq('organization_id', event.organizationId)
      .in('role', ['super_admin', 'admin'])
      .limit(1)
      .maybeSingle(),
  ])
  const isAdmin = !!adminRole

  const isFull =
    event.capacity !== null && event.goingCount >= event.capacity && event.viewerRsvp !== 'going'

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-4">
      <Link href="/events" className="text-sm text-muted-foreground hover:underline">
        ← All events
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{event.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {format(new Date(event.startsAt), 'EEEE, MMM d · h:mm a')}
                {event.endsAt ? ` – ${format(new Date(event.endsAt), 'h:mm a')}` : ''}
              </p>
              {event.location ? (
                <p className="text-sm text-muted-foreground">{event.location}</p>
              ) : null}
            </div>
            <div className="flex flex-col items-end gap-1">
              {event.isPast ? <Badge variant="outline">past</Badge> : null}
              <Badge variant="secondary">
                {event.capacity !== null
                  ? `${event.goingCount} / ${event.capacity} going`
                  : `${event.goingCount} going`}
              </Badge>
              {event.waitlistCount > 0 ? (
                <Badge variant="outline" className="text-[10px]">
                  {event.waitlistCount} on waitlist
                </Badge>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {event.description ? (
            <p className="text-sm whitespace-pre-line">{event.description}</p>
          ) : (
            <p className="text-sm italic text-muted-foreground">No description.</p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {!event.isPast ? (
              <RsvpButtons eventId={event.id} current={event.viewerRsvp} isFull={isFull} />
            ) : null}
            <Button variant="outline" size="sm" asChild>
              <a href={`/events/${event.id}/ical`} download>
                Add to calendar
              </a>
            </Button>
            {isAdmin ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/events/${event.id}/edit`}>Edit</Link>
              </Button>
            ) : null}
          </div>

          {event.viewerRsvp === 'waitlisted' ? (
            <p className="rounded-md border bg-muted/40 p-3 text-sm">
              You&apos;re on the waitlist. We&apos;ll email you if a spot opens.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Who&apos;s going ({attendees.going.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {attendees.going.length === 0 ? (
            <p className="text-sm text-muted-foreground">No RSVPs yet — be the first.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {attendees.going.slice(0, 50).map((a) => (
                <li key={a.userId} className="flex items-center gap-2">
                  <Link
                    href={`/profile/${a.userId}`}
                    className="flex items-center gap-2 hover:underline"
                  >
                    <Avatar className="size-7">
                      {a.avatarUrl ? <AvatarImage src={a.avatarUrl} alt={a.name ?? ''} /> : null}
                      <AvatarFallback className="text-xs">
                        {(a.name ?? '?').slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {a.name ?? <span className="italic text-muted-foreground">(no name)</span>}
                    </span>
                  </Link>
                  {a.graduationYear ? (
                    <span className="text-xs text-muted-foreground">
                      &apos;{a.graduationYear.toString().slice(2)}
                    </span>
                  ) : null}
                </li>
              ))}
              {attendees.going.length > 50 ? (
                <li className="text-sm text-muted-foreground">
                  + {attendees.going.length - 50} more
                </li>
              ) : null}
            </ul>
          )}
        </CardContent>
      </Card>

      {attendees.waitlist.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Waitlist ({attendees.waitlist.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2">
              {attendees.waitlist.map((a) => (
                <li key={a.userId} className="flex items-center gap-2">
                  <Link
                    href={`/profile/${a.userId}`}
                    className="flex items-center gap-2 hover:underline"
                  >
                    <Avatar className="size-7">
                      {a.avatarUrl ? <AvatarImage src={a.avatarUrl} alt={a.name ?? ''} /> : null}
                      <AvatarFallback className="text-xs">
                        {(a.name ?? '?').slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {a.name ?? <span className="italic text-muted-foreground">(no name)</span>}
                    </span>
                  </Link>
                  <Badge variant="outline" className="text-[10px]">
                    #{a.waitlistPosition}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

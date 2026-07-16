import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createSchoolRepository } from '@/db/repositories/school'
import { loadSchoolAdminContext } from '../../../_lib/school-admin'
import { EventForm } from '../../event-form'
import { editEventAction } from './actions'
import { CancelDeleteButtons } from './cancel-delete-buttons'

type Params = { id: string }

/**
 * Convert an ISO timestamp to the local-time string `<input type="datetime-local">`
 * expects: `YYYY-MM-DDTHH:mm`. We can't use toISOString (UTC) because the
 * input shows local time and would display "wrong" hours after timezone
 * conversion. The browser submits this back as local-naïve too.
 */
function isoToLocalDatetime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  )
}

export default async function EditEventPage({ params }: { params: Promise<Params> }) {
  const { id } = await params
  const { client, membership } = await loadSchoolAdminContext()
  const events = await createSchoolRepository(client).getAdminEvents(membership.membershipId)
  const event = events?.find((candidate) => candidate.id === id)
  if (!event) notFound()

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-4">
      <Link href="/admin/events" className="text-sm text-muted-foreground hover:underline">
        ← All events
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Edit event</CardTitle>
          <CardDescription>
            {event.isCanceled
              ? 'This event is cancelled. It remains available to members as a cancelled record.'
              : 'Changes apply immediately. Members who responded receive an in-app update.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EventForm
            action={editEventAction}
            preserveOnSuccess
            submitLabel="Save changes"
            hiddenFields={{ eventId: event.id }}
            defaults={{
              title: event.title,
              startsAtLocal: isoToLocalDatetime(event.startsAt),
              location: event.location ?? '',
              description: event.description ?? '',
              capacity: event.capacity?.toString() ?? '',
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
          <CardDescription>
            Cancel keeps a visible record and notifies members who responded. Delete is allowed only
            before anyone responds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CancelDeleteButtons
            eventId={event.id}
            goingCount={event.goingCount}
            waitlistCount={event.waitlistCount}
            isCanceled={event.status === 'cancelled'}
          />
        </CardContent>
      </Card>
    </div>
  )
}

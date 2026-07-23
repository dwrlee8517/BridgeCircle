import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createSchoolRepository } from '@/db/repositories/school'
import { isoToLocalDateTime } from '@/lib/school/admin-event-time'
import { loadSchoolAdminContext } from '../../../_lib/school-admin'
import { EventForm } from '../../event-form'
import { editEventAction } from './actions'
import { CancelDeleteButtons } from './cancel-delete-buttons'

type Params = { id: string }

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
            {event.status === 'cancelled'
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
              summary: event.summary ?? '',
              description: event.description ?? '',
              category: event.category,
              format: event.format,
              timeZone: event.timeZone,
              campus: event.campus,
              startsAtLocal: isoToLocalDateTime(event.startsAt, event.timeZone),
              endsAtLocal: event.endsAt ? isoToLocalDateTime(event.endsAt, event.timeZone) : '',
              locationName: event.location ?? '',
              locationAddress: event.locationAddress ?? '',
              mapsUrl: event.mapsUrl ?? '',
              joinUrl: event.joinUrl ?? '',
              joinWindowMinutes: event.joinWindowMinutes.toString(),
              hostName: event.hostName ?? 'Alumni Office',
              capacity: event.capacity?.toString() ?? '',
              allowWaitlist: event.allowWaitlist,
              changeNote: '',
              schedule: event.schedule.map((item) => ({
                startsAtLocal: item.startsAt
                  ? isoToLocalDateTime(item.startsAt, event.timeZone)
                  : '',
                label: item.label,
              })),
              facts: event.facts.map((fact) => ({
                label: fact.label,
                value: fact.value,
                linkLabel: fact.linkLabel ?? '',
                linkUrl: fact.linkUrl ?? '',
              })),
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

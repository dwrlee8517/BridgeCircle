import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/db/server'
import { requireAdmin } from '@/lib/auth/session'
import { getEvent } from '@/lib/events/getEvent'
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
  const session = await requireAdmin()
  const { id } = await params
  const supabase = await createClient()

  const event = await getEvent(supabase, id, session.userId)
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
              ? 'This event is canceled and hidden from members. You can still adjust details for the record.'
              : 'Changes apply immediately. We do not auto-email members on edits.'}
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
            Cancel sends emails and hides from members. Delete is permanent and silent — only for
            mistake events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CancelDeleteButtons
            eventId={event.id}
            goingCount={event.goingCount}
            waitlistCount={event.waitlistCount}
            isCanceled={event.isCanceled}
          />
        </CardContent>
      </Card>
    </div>
  )
}

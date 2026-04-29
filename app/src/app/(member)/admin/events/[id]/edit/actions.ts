'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/db/server'
import { requireAdmin } from '@/lib/auth/session'
import { cancelEvent } from '@/lib/events/cancelEvent'
import { deleteEvent } from '@/lib/events/deleteEvent'
import { editEvent } from '@/lib/events/editEvent'
import { parseEventCreateForm } from '@/lib/events/schemas'

// Identical shape to EventCreateFormState — kept as a re-export so the
// edit page's action plugs into the shared <EventForm /> without a type
// dance.
export type EditEventFormState = import('../../actions').EventCreateFormState

/**
 * Save edits to an existing event. The form-data shape matches the create
 * form so we can reuse parseEventCreateForm; we just thread the eventId
 * through a hidden field.
 */
export async function editEventAction(
  _prev: EditEventFormState,
  formData: FormData,
): Promise<EditEventFormState> {
  const session = await requireAdmin()

  const eventId = formData.get('eventId')
  if (typeof eventId !== 'string' || !eventId) {
    return { error: 'Missing event id.' }
  }

  const parsed = parseEventCreateForm(formData)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.')
      if (!fieldErrors[path]) fieldErrors[path] = issue.message
    }
    return { error: 'Please fix the highlighted fields.', fieldErrors }
  }

  const supabase = await createClient()
  const result = await editEvent(supabase, eventId, session.userId, parsed.data)

  if (!result.ok) {
    if (result.error === 'past_start') {
      return {
        error: 'Start time must be in the future when changing the date.',
        fieldErrors: { startsAt: 'In the past.' },
      }
    }
    if (result.error === 'event_not_found') return { error: 'Event not found.' }
    return { error: 'Could not save the event. Try again.' }
  }

  revalidatePath('/admin/events')
  revalidatePath('/events')
  revalidatePath(`/events/${eventId}`)
  return { ok: true }
}

const cancelSchema = z.object({
  // z.guid() rather than z.uuid() — see rsvpSchema for the seed-dev rationale.
  eventId: z.guid(),
  reason: z.string().trim().max(1000).optional(),
})

export type CancelEventFormState = { ok?: boolean; error?: string; emailsSent?: number }

export async function cancelEventAction(
  _prev: CancelEventFormState,
  formData: FormData,
): Promise<CancelEventFormState> {
  const session = await requireAdmin()
  const parsed = cancelSchema.safeParse({
    eventId: formData.get('eventId'),
    reason: formData.get('reason') ?? undefined,
  })
  if (!parsed.success) return { error: 'Invalid request.' }

  const result = await cancelEvent({
    eventId: parsed.data.eventId,
    actorUserId: session.userId,
    reason: parsed.data.reason ?? null,
  })

  if (!result.ok) {
    if (result.error === 'event_not_found') return { error: 'Event not found.' }
    if (result.error === 'already_canceled') {
      return { error: 'This event is already canceled.' }
    }
    return { error: 'Could not cancel. Try again.' }
  }

  revalidatePath('/admin/events')
  revalidatePath('/events')
  revalidatePath(`/events/${parsed.data.eventId}`)
  return { ok: true, emailsSent: result.emailsSent }
}

const deleteSchema = z.object({ eventId: z.guid() })

export async function deleteEventAction(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await requireAdmin()
  const parsed = deleteSchema.safeParse({ eventId: formData.get('eventId') })
  if (!parsed.success) return { error: 'Invalid request.' }

  const supabase = await createClient()
  const result = await deleteEvent(supabase, parsed.data.eventId, session.userId)

  if (!result.ok) {
    if (result.error === 'event_not_found') return { error: 'Event not found.' }
    return { error: 'Could not delete. Try again.' }
  }

  revalidatePath('/admin/events')
  revalidatePath('/events')
  redirect('/admin/events')
}

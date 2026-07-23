'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createSchoolRepository } from '@/db/repositories/school'
import { parseAdminEventForm } from '@/lib/school/admin-schemas'
import { cancelAdminEvent, deleteAdminEvent, updateAdminEvent } from '@/lib/school/operations'
import { loadSchoolAdminContext } from '../../../_lib/school-admin'

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
  const parsed = parseAdminEventForm(formData)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.')
      if (!fieldErrors[path]) fieldErrors[path] = issue.message
    }
    return { error: 'Please fix the highlighted fields.', fieldErrors }
  }

  if (!parsed.data.eventId) return { error: 'Missing event id.' }
  const { client, membership } = await loadSchoolAdminContext()
  const result = await updateAdminEvent(
    { membershipId: membership.membershipId, ...parsed.data, eventId: parsed.data.eventId },
    createSchoolRepository(client),
  )

  if (result !== 'updated') {
    if (result === 'past_start') {
      return {
        error: 'Start time must be in the future when changing the date.',
        fieldErrors: { startsAt: 'In the past.' },
      }
    }
    if (result === 'cancelled') return { error: 'Cancelled events cannot be edited.' }
    if (result === 'not_available') return { error: 'Event not found.' }
    return { error: 'Could not save the event. Try again.' }
  }

  revalidatePath('/admin/events')
  revalidatePath('/school')
  revalidatePath(`/school/events/${parsed.data.eventId}`)
  return { ok: true }
}

const cancelSchema = z.object({
  // z.guid() rather than z.uuid() — see rsvpSchema for the seed-dev rationale.
  eventId: z.guid(),
  reason: z.string().trim().max(1000).optional(),
})

export type CancelEventFormState = { ok?: boolean; error?: string }

export async function cancelEventAction(
  _prev: CancelEventFormState,
  formData: FormData,
): Promise<CancelEventFormState> {
  const parsed = cancelSchema.safeParse({
    eventId: formData.get('eventId'),
    reason: formData.get('reason') ?? undefined,
  })
  if (!parsed.success) return { error: 'Invalid request.' }

  const { client, membership } = await loadSchoolAdminContext()
  const result = await cancelAdminEvent(
    {
      membershipId: membership.membershipId,
      eventId: parsed.data.eventId,
      reason: parsed.data.reason ?? null,
    },
    createSchoolRepository(client),
  )

  if (result !== 'cancelled') {
    if (result === 'not_available') return { error: 'Event not found.' }
    if (result === 'already_cancelled') {
      return { error: 'This event is already canceled.' }
    }
    return { error: 'Could not cancel. Try again.' }
  }

  revalidatePath('/admin/events')
  revalidatePath('/school')
  revalidatePath(`/school/events/${parsed.data.eventId}`)
  return { ok: true }
}

const deleteSchema = z.object({ eventId: z.guid() })

export async function deleteEventAction(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = deleteSchema.safeParse({ eventId: formData.get('eventId') })
  if (!parsed.success) return { error: 'Invalid request.' }

  const { client, membership } = await loadSchoolAdminContext()
  const result = await deleteAdminEvent(
    { membershipId: membership.membershipId, eventId: parsed.data.eventId },
    createSchoolRepository(client),
  )

  if (result !== 'deleted') {
    if (result === 'not_available') return { error: 'Event not found.' }
    if (result === 'has_responses') {
      return { error: 'This event has responses. Cancel it to preserve the member record.' }
    }
    return { error: 'Could not delete. Try again.' }
  }

  revalidatePath('/admin/events')
  revalidatePath('/school')
  redirect('/admin/events')
}

'use server'

import { revalidatePath } from 'next/cache'
import { createSchoolRepository } from '@/db/repositories/school'
import { parseAdminEventForm } from '@/lib/school/admin-schemas'
import { createAdminEvent } from '@/lib/school/operations'
import { loadSchoolAdminContext } from '../_lib/school-admin'

export type EventCreateFormState = {
  ok?: boolean
  error?: string
  fieldErrors?: Record<string, string>
}

export async function createEventAction(
  _prev: EventCreateFormState,
  formData: FormData,
): Promise<EventCreateFormState> {
  const parsed = parseAdminEventForm(formData)

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.')
      if (!fieldErrors[path]) fieldErrors[path] = issue.message
    }
    return { error: 'Please fix the highlighted fields.', fieldErrors }
  }

  const { client, membership } = await loadSchoolAdminContext()
  const { eventId: _ignoredEventId, ...event } = parsed.data
  const result = await createAdminEvent(
    { membershipId: membership.membershipId, ...event },
    createSchoolRepository(client),
  )

  if (result !== 'created') {
    if (result === 'past_start') {
      return {
        error: 'Start time must be in the future.',
        fieldErrors: { startsAt: 'In the past.' },
      }
    }
    if (result === 'invalid_input') return { error: 'The event details are not valid.' }
    return { error: 'Could not create the event. Try again.' }
  }

  revalidatePath('/admin/events')
  revalidatePath('/school')
  return { ok: true }
}

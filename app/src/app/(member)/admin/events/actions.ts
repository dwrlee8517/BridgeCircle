'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/db/server'
import { requireAdmin } from '@/lib/auth/session'
import { createEvent } from '@/lib/events/createEvent'
import { parseEventCreateForm } from '@/lib/events/schemas'

export type EventCreateFormState = {
  ok?: boolean
  error?: string
  fieldErrors?: Record<string, string>
}

export async function createEventAction(
  _prev: EventCreateFormState,
  formData: FormData,
): Promise<EventCreateFormState> {
  const session = await requireAdmin()
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
  const { data: roles } = await supabase
    .from('admin_role_assignments')
    .select('organization_id')
    .eq('user_id', session.userId)
    .in('role', ['super_admin', 'admin'])
    .limit(1)
  const orgId = roles?.[0]?.organization_id
  if (!orgId) return { error: 'No admin role found.' }

  const result = await createEvent(supabase, orgId, session.userId, parsed.data)

  if (!result.ok) {
    if (result.error === 'past_start') {
      return {
        error: 'Start time must be in the future.',
        fieldErrors: { startsAt: 'In the past.' },
      }
    }
    return { error: 'Could not create the event. Try again.' }
  }

  revalidatePath('/admin/events')
  revalidatePath('/events')
  return { ok: true }
}

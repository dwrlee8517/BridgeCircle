'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/db/server'
import { getAppOrigin } from '@/lib/auth/app-url'
import { requireSession } from '@/lib/auth/session'
import { createMentorshipRequest } from '@/lib/mentorship/createRequest'
import { parseMentorshipRequestForm } from '@/lib/mentorship/schemas'

export type RequestFormState = {
  error?: string
  fieldErrors?: Record<string, string>
}

export async function submitRequest(
  _prev: RequestFormState,
  formData: FormData,
): Promise<RequestFormState> {
  const session = await requireSession()
  const parsed = parseMentorshipRequestForm(formData)

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.')
      if (!fieldErrors[path]) fieldErrors[path] = issue.message
    }
    return { error: 'Please fix the highlighted fields.', fieldErrors }
  }

  const supabase = await createClient()
  const origin = await getAppOrigin()
  const result = await createMentorshipRequest(supabase, origin, session.userId, parsed.data)

  if (!result.ok) {
    return { error: errorMessage(result.error) }
  }

  redirect('/inbox')
}

function errorMessage(err: string): string {
  switch (err) {
    case 'self_request':
      return "You can't request mentorship from yourself."
    case 'no_shared_org':
      return "You and this person aren't in the same organization."
    case 'mentor_closed':
      return 'This mentor is not currently accepting new requests.'
    case 'mentor_paused':
      return 'This mentor is paused while away.'
    case 'mentor_full':
      return 'This mentor is at their maximum number of pending requests right now.'
    case 'mentor_at_capacity':
      return 'This mentor is at their maximum number of active mentees right now.'
    case 'duplicate_pending':
      return 'You already have a pending request to this mentor.'
    default:
      return 'Could not send the request. Try again.'
  }
}

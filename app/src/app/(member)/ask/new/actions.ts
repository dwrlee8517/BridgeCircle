'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/db/server'
import { createAsk } from '@/lib/asks/createAsk'
import { parseAskForm } from '@/lib/asks/schemas'
import { getAppOrigin } from '@/lib/auth/app-url'
import { requireSession } from '@/lib/auth/session'

export type RequestFormState = {
  error?: string
  fieldErrors?: Record<string, string>
}

export async function submitRequest(
  _prev: RequestFormState,
  formData: FormData,
): Promise<RequestFormState> {
  const session = await requireSession()
  const parsed = parseAskForm(formData)

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
  const result = await createAsk(supabase, origin, session.userId, parsed.data)

  if (!result.ok) {
    return { error: errorMessage(result.error) }
  }

  redirect('/inbox')
}

function errorMessage(err: string): string {
  switch (err) {
    case 'self_request':
      return "You can't ask yourself."
    case 'no_shared_org':
      return "You and this person aren't in the same organization."
    case 'helper_closed':
      return 'This person is not currently accepting requests of this kind.'
    case 'helper_paused':
      return 'This person is paused while away.'
    case 'helper_full':
      return 'This person is at their maximum number of pending mentorship requests.'
    case 'helper_at_capacity':
      return 'This person is at their maximum number of active mentees right now.'
    case 'duplicate_pending':
      return 'You already have a pending request of this kind to this person.'
    default:
      return 'Could not send the request. Try again.'
  }
}

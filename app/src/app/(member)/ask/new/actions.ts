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

  // Land the asker on the just-sent ask's detail view, not the receiver's
  // inbox. Sending an ask is a sender-side action; /inbox is a receiver
  // surface and made the asker lose track of what they just did.
  redirect(`/ask/${result.askId}`)
}

function errorMessage(err: string): string {
  switch (err) {
    case 'self_request':
      return "You can't ask yourself."
    case 'no_shared_org':
      return "You and this person aren't in the same organization."
    case 'helper_closed':
      return 'This person is not taking asks of this kind right now.'
    case 'helper_paused':
      return 'This person is paused while away.'
    case 'helper_full':
      return 'This person has as many pending asks as they can hold right now.'
    case 'helper_at_capacity':
      return 'This person is at capacity for ongoing help right now.'
    case 'duplicate_pending':
      return 'You already have a pending ask of this kind to this person.'
    default:
      return 'Could not send your ask. Try again.'
  }
}

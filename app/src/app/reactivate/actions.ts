'use server'

import { redirect } from 'next/navigation'
import { selfReactivate } from '@/lib/account/self-reactivate'
import { requireSession } from '@/lib/auth/session'

export type ReactivateState = { ok?: boolean; error?: string }

export async function reactivateSelfAction(
  _prev: ReactivateState,
  _formData: FormData,
): Promise<ReactivateState> {
  const session = await requireSession()
  const result = await selfReactivate({ userId: session.userId })

  if (!result.ok) {
    if (result.error === 'nothing_to_reactivate') {
      return { error: 'Your account is already active.' }
    }
    return { error: 'Could not reactivate. Try again.' }
  }

  // Server actions can't redirect from inside their try/catch reliably; but a
  // bare redirect at the end works in Next 16 — Next throws the redirect signal
  // which the framework intercepts.
  redirect('/')
}

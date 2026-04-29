'use server'

import { redirect } from 'next/navigation'
import { cancelScheduledDeletion } from '@/lib/admin/cancelScheduledDeletion'
import { requireSession } from '@/lib/auth/session'

export type CancelSelfState = { ok?: boolean; error?: string }

export async function cancelSelfDeletionAction(
  _prev: CancelSelfState,
  _formData: FormData,
): Promise<CancelSelfState> {
  const session = await requireSession()
  const result = await cancelScheduledDeletion({
    userId: session.userId,
    actorUserId: session.userId,
    actorIsAdmin: false,
  })

  if (!result.ok) {
    if (result.error === 'forbidden_admin_initiated') {
      return {
        error:
          'This deletion was initiated by an admin. You can’t cancel it from here — please contact your admin.',
      }
    }
    if (result.error === 'no_active_schedule') {
      return { error: 'There is no pending deletion on your account.' }
    }
    return { error: 'Could not cancel. Try again.' }
  }

  redirect('/')
}

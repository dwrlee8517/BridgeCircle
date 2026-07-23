'use server'

import { redirect } from 'next/navigation'
import { createSettingsRepository } from '@/db/repositories/settings'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'

export type CancelSelfState = { ok?: boolean; error?: string }

export async function cancelSelfDeletionAction(
  _prev: CancelSelfState,
  _formData: FormData,
): Promise<CancelSelfState> {
  await requireSession()
  const result = await createSettingsRepository(await createClient()).cancelDeletion()

  if (result.result_code !== 'cancelled' && result.result_code !== 'active') {
    if (result.result_code === 'too_late')
      return { error: 'The deletion can no longer be canceled.' }
    return { error: 'Could not cancel. Try again.' }
  }

  redirect('/')
}

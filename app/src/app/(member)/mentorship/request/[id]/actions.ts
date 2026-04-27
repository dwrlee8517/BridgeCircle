'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/db/server'
import { getAppOrigin } from '@/lib/auth/app-url'
import { requireSession } from '@/lib/auth/session'
import { respondToRequest } from '@/lib/mentorship/respondToRequest'

export async function acceptAction(formData: FormData) {
  const requestId = formData.get('requestId')
  if (typeof requestId !== 'string') return
  const session = await requireSession()
  const supabase = await createClient()
  const origin = await getAppOrigin()
  const result = await respondToRequest(supabase, origin, session.userId, {
    requestId,
    decision: 'accepted',
  })
  if (result.ok && result.threadId) {
    revalidatePath('/inbox')
    redirect(`/mentorship/thread/${result.threadId}`)
  }
  // On error, fall through — caller refreshes and sees the latest state.
  revalidatePath(`/mentorship/request/${requestId}`)
}

export async function declineAction(formData: FormData) {
  const requestId = formData.get('requestId')
  if (typeof requestId !== 'string') return
  const session = await requireSession()
  const supabase = await createClient()
  const origin = await getAppOrigin()
  await respondToRequest(supabase, origin, session.userId, {
    requestId,
    decision: 'declined',
  })
  revalidatePath('/inbox')
  redirect('/inbox')
}

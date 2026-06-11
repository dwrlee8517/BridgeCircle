'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/db/admin'
import { createClient } from '@/db/server'
import { sendAskReminder } from '@/lib/asks/askLifecycle'
import { respondToAsk } from '@/lib/asks/respondToAsk'
import { getAppOrigin } from '@/lib/auth/app-url'
import { requireSession } from '@/lib/auth/session'

export async function acceptAction(formData: FormData) {
  const requestId = formData.get('requestId')
  if (typeof requestId !== 'string') return
  const session = await requireSession()
  const supabase = await createClient()
  const origin = await getAppOrigin()
  const result = await respondToAsk(supabase, origin, session.userId, {
    askId: requestId,
    decision: 'accepted',
  })
  if (result.ok && result.threadId) {
    revalidatePath('/inbox')
    redirect(`/ask/thread/${result.threadId}`)
  }
  // On error, fall through — caller refreshes and sees the latest state.
  revalidatePath(`/ask/${requestId}`)
}

export async function sendReminderAction(formData: FormData) {
  const requestId = formData.get('requestId')
  if (typeof requestId !== 'string') return
  const session = await requireSession()
  // Admin client on purpose: asks RLS gives askers no update surface, and
  // the lib validates ownership + the one-per-ask timing rule.
  const admin = createAdminClient()
  await sendAskReminder(admin, { askId: requestId, askerId: session.userId })
  revalidatePath(`/ask/${requestId}`)
}

export async function declineAction(formData: FormData) {
  const requestId = formData.get('requestId')
  if (typeof requestId !== 'string') return
  const session = await requireSession()
  const supabase = await createClient()
  const origin = await getAppOrigin()
  await respondToAsk(supabase, origin, session.userId, {
    askId: requestId,
    decision: 'declined',
  })
  revalidatePath('/inbox')
  redirect('/inbox')
}

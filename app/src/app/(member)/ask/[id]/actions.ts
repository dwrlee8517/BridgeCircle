'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/db/admin'
import { createClient } from '@/db/server'
import { sendAskReminder } from '@/lib/asks/askLifecycle'
import { isDeclineReason } from '@/lib/asks/declineReasons'
import { pauseHelper } from '@/lib/asks/preferences'
import { respondToAsk } from '@/lib/asks/respondToAsk'
import { getAppOrigin } from '@/lib/auth/app-url'
import { requireSession } from '@/lib/auth/session'

/** Second "at capacity" within this window triggers the pause offer. */
const PAUSE_OFFER_WINDOW_DAYS = 30
const PAUSE_OFFER_THRESHOLD = 2

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
  const origin = await getAppOrigin()
  // Admin client on purpose: asks RLS gives askers no update surface, and
  // the lib validates ownership + the one-per-ask timing rule.
  const admin = createAdminClient()
  await sendAskReminder(admin, { askId: requestId, askerId: session.userId, appOrigin: origin })
  revalidatePath(`/ask/${requestId}`)
}

export async function declineAction(formData: FormData) {
  const requestId = formData.get('requestId')
  if (typeof requestId !== 'string') return
  const rawReason = formData.get('reason')
  const declineReason = isDeclineReason(rawReason) ? rawReason : null

  const session = await requireSession()
  const supabase = await createClient()
  const origin = await getAppOrigin()
  const result = await respondToAsk(supabase, origin, session.userId, {
    askId: requestId,
    decision: 'declined',
    declineReason,
  })
  revalidatePath('/inbox')

  // A second "at capacity" inside the window earns the guilt-free pause
  // offer, rendered on the just-declined ask's page.
  if (result.ok && declineReason === 'at_capacity') {
    const windowStart = new Date(
      Date.now() - PAUSE_OFFER_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString()
    const { count } = await supabase
      .from('asks')
      .select('id', { count: 'exact', head: true })
      .eq('helper_id', session.userId)
      .eq('decline_reason', 'at_capacity')
      .gte('responded_at', windowStart)
    if ((count ?? 0) >= PAUSE_OFFER_THRESHOLD) {
      revalidatePath(`/ask/${requestId}`)
      redirect(`/ask/${requestId}?pause=offered`)
    }
  }

  redirect('/inbox')
}

export async function pauseHelperAction() {
  const session = await requireSession()
  const supabase = await createClient()
  await pauseHelper(supabase, session.userId)
  revalidatePath('/help')
  redirect('/inbox')
}

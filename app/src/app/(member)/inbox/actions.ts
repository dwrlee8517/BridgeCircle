'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/db/server'
import { respondToAsk } from '@/lib/asks/respondToAsk'
import { sendMessage as sendAskMessage } from '@/lib/asks/sendMessage'
import { getAppOrigin } from '@/lib/auth/app-url'
import { requireSession } from '@/lib/auth/session'
import { sendMessage as sendDmMessage } from '@/lib/dm/sendMessage'

export type UnifiedSendMessageState =
  | { ok: true; messageId: string; createdAt: string }
  | { ok: false; error: string }
  | null

export async function unifiedSendMessageAction(
  _prev: UnifiedSendMessageState,
  formData: FormData,
): Promise<UnifiedSendMessageState> {
  try {
    const session = await requireSession()
    const threadId = formData.get('threadId') as string
    const threadType = formData.get('threadType') as 'direct' | 'ask'
    const body = formData.get('body') as string

    if (!threadId || !threadType || !body?.trim()) {
      return { ok: false, error: 'Missing parameters or message is empty.' }
    }

    const supabase = await createClient()

    if (threadType === 'direct') {
      const res = await sendDmMessage({ db: supabase }, session.userId, {
        threadId,
        body: body.trim(),
      })
      if (!res.ok) {
        const errorMsg =
          res.error === 'not_friends'
            ? "You're no longer friends with this user."
            : res.error === 'thread_not_found'
              ? 'That conversation no longer exists.'
              : res.error === 'not_participant'
                ? "This conversation isn't yours."
                : 'Could not send message.'
        return { ok: false, error: errorMsg }
      }
      revalidatePath('/inbox')
      return { ok: true, messageId: res.messageId, createdAt: res.createdAt }
    } else {
      const res = await sendAskMessage(supabase, session.userId, {
        threadId,
        body: body.trim(),
      })
      if (!res.ok) {
        const errorMsg =
          res.error === 'thread_archived'
            ? 'This thread has been archived.'
            : res.error === 'not_participant'
              ? 'You are not in this thread.'
              : 'Could not send. Try again.'
        return { ok: false, error: errorMsg }
      }
      revalidatePath('/inbox')
      return { ok: true, messageId: res.messageId, createdAt: new Date().toISOString() }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'An unexpected error occurred.'
    return { ok: false, error: msg }
  }
}

export async function acceptAskFromInboxAction(formData: FormData) {
  const requestId = formData.get('requestId')
  const body = (formData.get('body') as string | null)?.trim() ?? ''
  if (typeof requestId !== 'string') return

  const session = await requireSession()
  const supabase = await createClient()
  const origin = await getAppOrigin()
  const result = await respondToAsk(supabase, origin, session.userId, {
    askId: requestId,
    decision: 'accepted',
  })

  if (result.ok && result.threadId) {
    if (body) {
      await sendAskMessage(supabase, session.userId, {
        threadId: result.threadId,
        body,
      })
    }
    revalidatePath('/inbox')
    redirect(`/ask/thread/${result.threadId}`)
  }

  revalidatePath('/inbox')
}

export async function declineAskFromInboxAction(formData: FormData) {
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

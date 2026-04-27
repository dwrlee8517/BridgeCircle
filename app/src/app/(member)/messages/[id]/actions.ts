'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/db/admin'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { getOrCreateThread } from '@/lib/dm/getOrCreateThread'
import { sendMessageSchema, startThreadSchema } from '@/lib/dm/schemas'
import { sendMessage } from '@/lib/dm/sendMessage'

export type SendMessageState =
  | { ok: true; messageId: string; createdAt: string }
  | { ok: false; message: string }
  | null

/**
 * Send a message into an existing thread. Returns the inserted message id +
 * timestamp so the client composer can append optimistically while waiting
 * for the realtime broadcast to arrive (which it will dedupe by id).
 */
export async function sendMessageAction(
  _prev: SendMessageState,
  formData: FormData,
): Promise<SendMessageState> {
  const session = await requireSession()
  const parsed = sendMessageSchema.safeParse({
    threadId: formData.get('threadId'),
    body: formData.get('body'),
  })
  if (!parsed.success) {
    return { ok: false, message: 'Message is empty or too long.' }
  }

  const supabase = await createClient()
  const result = await sendMessage({ db: supabase }, session.userId, parsed.data)

  if (!result.ok) {
    const message =
      result.error === 'not_friends'
        ? "You're no longer friends with this user."
        : result.error === 'thread_not_found'
          ? 'That conversation no longer exists.'
          : result.error === 'not_participant'
            ? "This conversation isn't yours."
            : 'Could not send message.'
    return { ok: false, message }
  }

  // Refresh /messages so the inbox preview updates. The thread page itself
  // gets the new message via Realtime, no revalidate needed there.
  revalidatePath('/messages')
  return { ok: true, messageId: result.messageId, createdAt: result.createdAt }
}

/**
 * Resolve (or lazily create) a DM thread with a target user, then redirect
 * to /messages/<threadId>. Invoked by the "Message" button on a friend's
 * profile.
 */
export async function startThreadAction(formData: FormData): Promise<void> {
  const session = await requireSession()
  const parsed = startThreadSchema.safeParse({ receiverId: formData.get('receiverId') })
  if (!parsed.success) {
    redirect('/friends?error=invalid')
  }

  const supabase = await createClient()
  const admin = createAdminClient()

  const result = await getOrCreateThread(
    { db: supabase, admin },
    session.userId,
    parsed.data.receiverId,
  )
  if (!result.ok) {
    if (result.error === 'not_friends') {
      redirect(`/profile/${parsed.data.receiverId}?error=not_friends`)
    }
    redirect('/messages')
  }

  redirect(`/messages/${result.threadId}`)
}

'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/db/admin'
import { createClient } from '@/db/server'
import { getAppOrigin } from '@/lib/auth/app-url'
import { requireSession } from '@/lib/auth/session'
import { respondToFriendRequest } from '@/lib/friendship/respondToFriendRequest'
import { respondToFriendRequestSchema, sendFriendRequestSchema } from '@/lib/friendship/schemas'
import { sendFriendRequest } from '@/lib/friendship/sendFriendRequest'
import { sendFriendRequestAcceptedEmail, sendFriendRequestEmail } from '@/notify/resend'

export type FriendActionState = { ok: boolean; message: string }

export async function sendFriendRequestAction(
  _previous: FriendActionState | null,
  formData: FormData,
): Promise<FriendActionState> {
  const session = await requireSession()
  const parsed = sendFriendRequestSchema.safeParse({
    receiverId: formData.get('receiverId'),
    message: formData.get('message') ?? undefined,
  })
  if (!parsed.success) return { ok: false, message: 'Invalid request' }

  const supabase = await createClient()
  const origin = await getAppOrigin()
  const result = await sendFriendRequest(
    {
      db: supabase,
      notify: async ({ receiverId, senderName }) => {
        const { data: receiverAuth } = await createAdminClient().auth.admin.getUserById(receiverId)
        const email = receiverAuth?.user?.email
        if (!email) return
        await sendFriendRequestEmail({
          to: email,
          senderName: senderName ?? 'A fellow alumnus',
          reviewUrl: `${origin}/profile/${session.userId}`,
          message: parsed.data.message,
        })
      },
    },
    session.userId,
    parsed.data,
  )

  if (!result.ok) {
    const message =
      result.error === 'already_friends'
        ? "You're already friends."
        : result.error === 'request_exists'
          ? 'A connection request is already pending between you.'
          : result.error === 'self_request'
            ? "You can't connect with yourself."
            : result.error === 'cross_org'
              ? 'You can only connect with members of your circle.'
              : 'Could not send the connection request.'
    return { ok: false, message }
  }

  revalidatePath(`/profile/${parsed.data.receiverId}`)
  revalidatePath('/notifications')
  return { ok: true, message: 'Connection request sent.' }
}

export async function respondToFriendRequestAction(
  _previous: FriendActionState | null,
  formData: FormData,
): Promise<FriendActionState> {
  const session = await requireSession()
  const parsed = respondToFriendRequestSchema.safeParse({
    requestId: formData.get('requestId'),
    response: formData.get('response'),
  })
  if (!parsed.success) return { ok: false, message: 'Invalid response' }

  const supabase = await createClient()
  const admin = createAdminClient()
  const origin = await getAppOrigin()
  const result = await respondToFriendRequest(
    {
      db: supabase,
      admin,
      notify: async ({ receiverId, accepterName }) => {
        const { data: receiverAuth } = await admin.auth.admin.getUserById(receiverId)
        const email = receiverAuth?.user?.email
        if (!email) return
        await sendFriendRequestAcceptedEmail({
          to: email,
          accepterName: accepterName ?? 'Your contact',
          profileUrl: `${origin}/profile/${session.userId}`,
        })
      },
    },
    session.userId,
    parsed.data,
  )

  if (!result.ok) {
    const message =
      result.error === 'not_found'
        ? 'That request no longer exists.'
        : result.error === 'not_pending'
          ? 'That request was already answered.'
          : result.error === 'not_receiver'
            ? "That request isn't yours to answer."
            : 'Could not record your response.'
    return { ok: false, message }
  }

  revalidatePath('/people')
  revalidatePath('/notifications')
  return {
    ok: true,
    message: result.outcome === 'accepted' ? "You're now connected." : 'Request declined.',
  }
}

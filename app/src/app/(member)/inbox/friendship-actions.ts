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

/**
 * Send a friend request — invoked from the profile page button. The
 * receiverId is required; an optional message is supported but the v1
 * UI doesn't expose it.
 *
 * After Friends folded into People, the email's "review" link points
 * recipients at /inbox where pending requests now live.
 */
export async function sendFriendRequestAction(
  _prev: FriendActionState | null,
  formData: FormData,
): Promise<FriendActionState> {
  const session = await requireSession()
  const parsed = sendFriendRequestSchema.safeParse({
    receiverId: formData.get('receiverId'),
    message: formData.get('message') ?? undefined,
  })
  if (!parsed.success) {
    return { ok: false, message: 'Invalid request' }
  }

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
          reviewUrl: `${origin}/inbox`,
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
          ? 'A friend request is already pending between you.'
          : result.error === 'self_request'
            ? "You can't friend yourself."
            : result.error === 'cross_org'
              ? 'You can only friend members of your organization.'
              : 'Could not send friend request.'
    return { ok: false, message }
  }

  revalidatePath('/inbox')
  revalidatePath(`/profile/${parsed.data.receiverId}`)
  return { ok: true, message: 'Friend request sent.' }
}

/**
 * Accept or decline an incoming friend request. Invoked from the
 * /inbox Friend requests section.
 */
export async function respondToFriendRequestAction(
  _prev: FriendActionState | null,
  formData: FormData,
): Promise<FriendActionState> {
  const session = await requireSession()
  const parsed = respondToFriendRequestSchema.safeParse({
    requestId: formData.get('requestId'),
    response: formData.get('response'),
  })
  if (!parsed.success) {
    return { ok: false, message: 'Invalid response' }
  }

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
          ? 'That request was already responded to.'
          : result.error === 'not_receiver'
            ? "That request isn't yours to respond to."
            : 'Could not record your response.'
    return { ok: false, message }
  }

  revalidatePath('/inbox')
  return {
    ok: true,
    message: result.outcome === 'accepted' ? "You're now friends." : 'Request declined.',
  }
}

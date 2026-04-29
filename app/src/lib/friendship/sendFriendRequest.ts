import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import { createNotification } from '@/lib/notifications/createNotification'
import type { SendFriendRequestInput } from './schemas'

export type SendFriendRequestDeps = {
  db: SupabaseClient<Database>
  notify?: (input: { receiverId: string; senderName: string | null }) => Promise<unknown>
}

export type SendFriendRequestResult =
  | { ok: true; requestId: string }
  | {
      ok: false
      error:
        | 'self_request'
        | 'cross_org'
        | 'already_friends'
        | 'request_exists'
        | 'receiver_not_found'
        | 'sender_no_membership'
    }

/**
 * Create a pending friend_requests row from senderId to receiverId.
 *
 * Validates:
 *   - senderId !== receiverId
 *   - both are active members of the same organization (cross-org friending
 *     is out of scope for phase 1; in week-3-4-plan friendship is intra-org)
 *   - no pending request in either direction
 *   - not already friends
 *
 * The DB CHECK constraint also blocks sender = receiver, but checking here
 * gives a clean error string instead of a Postgres error.
 *
 * Notify is fired-and-not-awaited-via-error: an email failure should not
 * fail the request. Caller can pass a notify wrapper or omit it.
 */
export async function sendFriendRequest(
  deps: SendFriendRequestDeps,
  senderId: string,
  input: SendFriendRequestInput,
): Promise<SendFriendRequestResult> {
  const { db } = deps
  const { receiverId, message } = input

  if (senderId === receiverId) return { ok: false, error: 'self_request' }

  // Confirm both are active members of the same org. We only check that
  // their membership org_ids overlap — multi-org isn't live yet but the
  // schema supports it.
  const [{ data: senderMemberships }, { data: receiverMemberships }] = await Promise.all([
    db
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', senderId)
      .eq('status', 'active'),
    db
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', receiverId)
      .eq('status', 'active'),
  ])

  const senderOrgs = new Set((senderMemberships ?? []).map((m) => m.organization_id))
  const receiverOrgs = new Set((receiverMemberships ?? []).map((m) => m.organization_id))

  if (senderOrgs.size === 0) return { ok: false, error: 'sender_no_membership' }
  if (receiverOrgs.size === 0) return { ok: false, error: 'receiver_not_found' }
  const sharesOrg = [...senderOrgs].some((o) => receiverOrgs.has(o))
  if (!sharesOrg) return { ok: false, error: 'cross_org' }

  // Block duplicate pending request in either direction.
  const { data: existingPending } = await db
    .from('friend_requests')
    .select('id')
    .eq('status', 'pending')
    .or(
      `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`,
    )
    .limit(1)
    .maybeSingle()
  if (existingPending) return { ok: false, error: 'request_exists' }

  // Block if already friends.
  const [a, b] = senderId < receiverId ? [senderId, receiverId] : [receiverId, senderId]
  const { data: friendship } = await db
    .from('friendships')
    .select('id')
    .eq('user_a_id', a)
    .eq('user_b_id', b)
    .maybeSingle()
  if (friendship) return { ok: false, error: 'already_friends' }

  const { data: inserted, error: insertErr } = await db
    .from('friend_requests')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      message,
      status: 'pending',
    })
    .select('id')
    .single()

  if (insertErr || !inserted) {
    // Treat unknown insert failures as request_exists on race conditions —
    // there's a future opportunity to add a unique partial index on
    // (sender, receiver) where status='pending' to make this strictly
    // enforced in DB. For now we accept the small race window.
    return { ok: false, error: 'request_exists' }
  }

  // Sender name lookup is shared by both the email notify and the in-app
  // notification, so do it once outside the if-block.
  const { data: senderProfile } = await db
    .from('base_profiles')
    .select('name')
    .eq('user_id', senderId)
    .maybeSingle()

  await createNotification({
    userId: receiverId,
    type: 'friend_request_received',
    organizationId: Array.from(senderOrgs).find((o) => receiverOrgs.has(o)) ?? null,
    targetType: 'friend_request',
    targetId: inserted.id,
    payload: { actor_id: senderId, actor_name: senderProfile?.name ?? null },
  })

  if (deps.notify) {
    try {
      await deps.notify({
        receiverId,
        senderName: senderProfile?.name ?? null,
      })
    } catch {
      // Email is best-effort; the request is already in the DB.
    }
  }

  return { ok: true, requestId: inserted.id }
}

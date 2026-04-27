import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import type { RespondToFriendRequestInput } from './schemas'

export type RespondDeps = {
  /**
   * RLS-bound client used to read the request and update its status. The
   * receiver-only update policy on friend_requests means this only succeeds
   * when called by the receiver.
   */
  db: SupabaseClient<Database>
  /**
   * Service-role client used to insert the friendships row on accept.
   * friendships has no INSERT policy by design — see 0001_init RLS
   * comment ("Inserts go through service_role on friend_request acceptance").
   */
  admin: SupabaseClient<Database>
  notify?: (input: {
    receiverId: string // the friendship-acceptance email recipient is the original sender
    accepterName: string | null
  }) => Promise<unknown>
}

export type RespondResult =
  | { ok: true; outcome: 'accepted'; friendshipId: string }
  | { ok: true; outcome: 'declined' }
  | { ok: false; error: 'not_found' | 'not_pending' | 'not_receiver' | 'insert_failed' }

/**
 * Accept or decline a pending friend_requests row.
 *
 * On accept: update the request status, then insert a friendships row using
 * the admin client (canonical-ordering enforced server-side; user_a_id <
 * user_b_id). The two writes aren't a single transaction; if the friendship
 * insert fails we leave the request as accepted and bubble the error — a
 * follow-up can add a "heal stale accepted requests" sweep if this ever
 * happens in practice.
 *
 * On decline: update the request status to 'declined'. We do NOT delete the
 * row — keeping it lets us decide later to honor "don't show me requests
 * from this user again" without schema changes. Senders can still re-send
 * after a decline; if abuse appears we'll add a cooldown.
 */
export async function respondToFriendRequest(
  deps: RespondDeps,
  viewerId: string,
  input: RespondToFriendRequestInput,
): Promise<RespondResult> {
  const { db, admin } = deps

  const { data: req, error: readErr } = await db
    .from('friend_requests')
    .select('id, sender_id, receiver_id, status')
    .eq('id', input.requestId)
    .maybeSingle()

  if (readErr) return { ok: false, error: 'not_found' }
  if (!req) return { ok: false, error: 'not_found' }
  if (req.receiver_id !== viewerId) return { ok: false, error: 'not_receiver' }
  if (req.status !== 'pending') return { ok: false, error: 'not_pending' }

  const newStatus = input.response === 'accept' ? 'accepted' : 'declined'

  const { error: updateErr } = await db
    .from('friend_requests')
    .update({ status: newStatus, responded_at: new Date().toISOString() })
    .eq('id', req.id)

  if (updateErr) return { ok: false, error: 'not_pending' }

  if (input.response === 'decline') return { ok: true, outcome: 'declined' }

  // Accept: insert the friendship using canonical ordering via admin client.
  const [a, b] =
    req.sender_id < req.receiver_id
      ? [req.sender_id, req.receiver_id]
      : [req.receiver_id, req.sender_id]

  const { data: existing } = await admin
    .from('friendships')
    .select('id')
    .eq('user_a_id', a)
    .eq('user_b_id', b)
    .maybeSingle()

  let friendshipId: string
  if (existing) {
    friendshipId = existing.id
  } else {
    const { data: inserted, error: insertErr } = await admin
      .from('friendships')
      .insert({ user_a_id: a, user_b_id: b })
      .select('id')
      .single()
    if (insertErr || !inserted) return { ok: false, error: 'insert_failed' }
    friendshipId = inserted.id
  }

  if (deps.notify) {
    const { data: accepterProfile } = await db
      .from('base_profiles')
      .select('name')
      .eq('user_id', viewerId)
      .maybeSingle()
    try {
      await deps.notify({
        receiverId: req.sender_id,
        accepterName: accepterProfile?.name ?? null,
      })
    } catch {
      // best-effort
    }
  }

  return { ok: true, outcome: 'accepted', friendshipId }
}

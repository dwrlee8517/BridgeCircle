import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

/**
 * The five mutually exclusive friendship states between viewer and target.
 * Used by the profile page to render the right button + by sendFriendRequest
 * to enforce the "no duplicate" rule.
 */
export type FriendshipState =
  | { kind: 'self' }
  | { kind: 'friends'; friendshipId: string }
  | { kind: 'pending_outgoing'; requestId: string }
  | { kind: 'pending_incoming'; requestId: string }
  | { kind: 'none' }

/**
 * Resolve the friendship state between viewer and target. RLS allows reads
 * of friend_requests where the viewer is sender or receiver, and friendships
 * where the viewer is user_a or user_b — so we can issue the queries with
 * the regular server client.
 *
 * Returns the canonical 5-way enum. We treat declined requests as 'none' so
 * users can re-send after a decline (UX call — no spam check yet at the
 * pilot scale; revisit if abuse appears).
 */
export async function getFriendshipState(
  supabase: SupabaseClient<Database>,
  viewerId: string,
  targetId: string,
): Promise<FriendshipState> {
  if (viewerId === targetId) return { kind: 'self' }

  // Canonical ordering for friendships: smaller uuid is user_a.
  const [a, b] = viewerId < targetId ? [viewerId, targetId] : [targetId, viewerId]

  const { data: friendship } = await supabase
    .from('friendships')
    .select('id')
    .eq('user_a_id', a)
    .eq('user_b_id', b)
    .maybeSingle()

  if (friendship) return { kind: 'friends', friendshipId: friendship.id }

  const { data: pending } = await supabase
    .from('friend_requests')
    .select('id, sender_id, receiver_id')
    .eq('status', 'pending')
    .or(
      `and(sender_id.eq.${viewerId},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${viewerId})`,
    )
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (pending) {
    if (pending.sender_id === viewerId) {
      return { kind: 'pending_outgoing', requestId: pending.id }
    }
    return { kind: 'pending_incoming', requestId: pending.id }
  }

  return { kind: 'none' }
}

import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

export type PendingRequest = {
  requestId: string
  otherUserId: string
  name: string | null
  headline: string | null
  currentEmployer: string | null
  currentTitle: string | null
  avatarUrl: string | null
  message: string | null
  createdAt: string
}

export type PendingRequestsResult = {
  incoming: PendingRequest[]
  outgoing: PendingRequest[]
}

/**
 * Pull pending friend requests where the viewer is on either side, joined
 * with the other party's base profile. RLS lets the viewer read both
 * directions.
 */
export async function listPendingFriendRequests(
  supabase: SupabaseClient<Database>,
  viewerId: string,
): Promise<PendingRequestsResult> {
  const { data: rows, error } = await supabase
    .from('friend_requests')
    .select('id, sender_id, receiver_id, message, created_at')
    .eq('status', 'pending')
    .or(`sender_id.eq.${viewerId},receiver_id.eq.${viewerId}`)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`listPendingFriendRequests: ${error.message}`)
  if (!rows || rows.length === 0) return { incoming: [], outgoing: [] }

  const otherIds = Array.from(
    new Set(rows.map((r) => (r.sender_id === viewerId ? r.receiver_id : r.sender_id))),
  )

  const { data: bases, error: baseErr } = await supabase
    .from('base_profiles')
    .select('user_id, name, headline, current_employer, current_title, avatar_url')
    .in('user_id', otherIds)

  if (baseErr) throw new Error(`listPendingFriendRequests profiles: ${baseErr.message}`)

  const baseByUser = new Map((bases ?? []).map((b) => [b.user_id, b]))

  const incoming: PendingRequest[] = []
  const outgoing: PendingRequest[] = []
  for (const row of rows) {
    const isIncoming = row.receiver_id === viewerId
    const otherId = isIncoming ? row.sender_id : row.receiver_id
    const base = baseByUser.get(otherId)
    const item: PendingRequest = {
      requestId: row.id,
      otherUserId: otherId,
      name: base?.name ?? null,
      headline: base?.headline ?? null,
      currentEmployer: base?.current_employer ?? null,
      currentTitle: base?.current_title ?? null,
      avatarUrl: base?.avatar_url ?? null,
      message: row.message,
      createdAt: row.created_at,
    }
    if (isIncoming) incoming.push(item)
    else outgoing.push(item)
  }

  return { incoming, outgoing }
}

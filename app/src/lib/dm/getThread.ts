import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

export type ThreadMessage = {
  id: string
  senderId: string
  body: string
  createdAt: string
  readAt: string | null
}

export type ThreadDetail = {
  threadId: string
  otherUserId: string
  otherName: string | null
  otherAvatarUrl: string | null
  otherHeadline: string | null
  isStillFriends: boolean
  messages: ThreadMessage[]
}

export type GetThreadResult =
  | { ok: true; thread: ThreadDetail }
  | { ok: false; error: 'not_found' | 'not_participant' }

/**
 * Fetch a single DM thread with its full message history. Caller must be a
 * participant — RLS enforces this on both the thread row read and the
 * messages select, but we also validate explicitly so we can return a
 * typed error rather than an empty result.
 *
 * `isStillFriends` lets the UI hide the composer if the friendship was
 * revoked but the thread is still being viewed (read-only state).
 */
export async function getDmThread(
  supabase: SupabaseClient<Database>,
  viewerId: string,
  threadId: string,
): Promise<GetThreadResult> {
  const { data: thread } = await supabase
    .from('direct_message_threads')
    .select('id, user_a_id, user_b_id')
    .eq('id', threadId)
    .maybeSingle()
  if (!thread) return { ok: false, error: 'not_found' }

  const isParticipant = thread.user_a_id === viewerId || thread.user_b_id === viewerId
  if (!isParticipant) return { ok: false, error: 'not_participant' }

  const otherId = thread.user_a_id === viewerId ? thread.user_b_id : thread.user_a_id

  const [a, b] =
    thread.user_a_id < thread.user_b_id
      ? [thread.user_a_id, thread.user_b_id]
      : [thread.user_b_id, thread.user_a_id]

  const [{ data: messages, error: mErr }, { data: base }, { data: friendship }] = await Promise.all(
    [
      supabase
        .from('messages')
        .select('id, sender_id, body, read_at, created_at')
        .eq('thread_id', threadId)
        .eq('thread_type', 'direct')
        .order('created_at', { ascending: true }),
      supabase
        .from('base_profiles')
        .select('user_id, name, headline, avatar_url')
        .eq('user_id', otherId)
        .maybeSingle(),
      supabase.from('friendships').select('id').eq('user_a_id', a).eq('user_b_id', b).maybeSingle(),
    ],
  )
  if (mErr) throw new Error(`getDmThread messages: ${mErr.message}`)

  return {
    ok: true,
    thread: {
      threadId: thread.id,
      otherUserId: otherId,
      otherName: base?.name ?? null,
      otherAvatarUrl: base?.avatar_url ?? null,
      otherHeadline: base?.headline ?? null,
      isStillFriends: !!friendship,
      messages: (messages ?? []).map((m) => ({
        id: m.id,
        senderId: m.sender_id,
        body: m.body,
        createdAt: m.created_at,
        readAt: m.read_at,
      })),
    },
  }
}

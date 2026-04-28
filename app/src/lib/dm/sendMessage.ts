import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import type { SendMessageInput } from './schemas'

export type SendMessageDeps = {
  db: SupabaseClient<Database>
}

export type SendMessageResult =
  | { ok: true; messageId: string; createdAt: string }
  | { ok: false; error: 'thread_not_found' | 'not_participant' | 'not_friends' | 'insert_failed' }

/**
 * Insert a direct message into an existing thread. Verifies:
 *   - thread exists
 *   - viewer is a participant of the thread (user_a or user_b)
 *   - viewer is still friends with the other party (friendship may have
 *     been revoked between thread creation and now — phase-1-spec gates
 *     DM on active friendship, not just historical thread existence)
 *
 * Inserting the row uses the RLS-bound client; the "participants send
 * direct messages" policy in 0003_rls covers this. Realtime broadcast
 * happens automatically once the row is committed (messages is in the
 * supabase_realtime publication).
 */
export async function sendMessage(
  deps: SendMessageDeps,
  viewerId: string,
  input: SendMessageInput,
): Promise<SendMessageResult> {
  const { db } = deps

  const { data: thread } = await db
    .from('direct_message_threads')
    .select('id, user_a_id, user_b_id')
    .eq('id', input.threadId)
    .maybeSingle()
  if (!thread) return { ok: false, error: 'thread_not_found' }

  const isParticipant = thread.user_a_id === viewerId || thread.user_b_id === viewerId
  if (!isParticipant) return { ok: false, error: 'not_participant' }

  // Re-verify friendship at send time. This guards against a window where
  // the thread exists but a later unfriend (post-launch feature) revoked
  // the gate.
  const [a, b] =
    thread.user_a_id < thread.user_b_id
      ? [thread.user_a_id, thread.user_b_id]
      : [thread.user_b_id, thread.user_a_id]
  const { data: friendship } = await db
    .from('friendships')
    .select('id')
    .eq('user_a_id', a)
    .eq('user_b_id', b)
    .maybeSingle()
  if (!friendship) return { ok: false, error: 'not_friends' }

  const { data: inserted, error: insertErr } = await db
    .from('messages')
    .insert({
      thread_id: input.threadId,
      thread_type: 'direct',
      sender_id: viewerId,
      body: input.body,
    })
    .select('id, created_at')
    .single()

  if (insertErr || !inserted) return { ok: false, error: 'insert_failed' }
  return { ok: true, messageId: inserted.id, createdAt: inserted.created_at }
}

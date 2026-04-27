import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import type { MessageInput } from './schemas'

export type SendMessageResult =
  | { ok: true; messageId: string }
  | {
      ok: false
      error: 'not_participant' | 'thread_not_found' | 'thread_archived' | 'db_error'
      detail?: string
    }

/**
 * Send a message into a mentorship_thread. RLS enforces that the sender is a
 * participant; we still check explicitly to give a clean error message
 * instead of a silent insert failure.
 */
export async function sendMessage(
  supabase: SupabaseClient<Database>,
  senderId: string,
  input: MessageInput,
): Promise<SendMessageResult> {
  const { data: thread } = await supabase
    .from('mentorship_threads')
    .select('id, mentor_id, mentee_id, status')
    .eq('id', input.threadId)
    .maybeSingle()

  if (!thread) return { ok: false, error: 'thread_not_found' }
  if (thread.status !== 'active') return { ok: false, error: 'thread_archived' }
  if (thread.mentor_id !== senderId && thread.mentee_id !== senderId) {
    return { ok: false, error: 'not_participant' }
  }

  const now = new Date().toISOString()
  const { data: created, error: insertErr } = await supabase
    .from('messages')
    .insert({
      thread_id: input.threadId,
      thread_type: 'mentorship',
      sender_id: senderId,
      body: input.body,
    })
    .select('id')
    .single()

  if (insertErr || !created) {
    return { ok: false, error: 'db_error', detail: insertErr?.message }
  }

  // Bump the thread's last_message_at for inbox sorting.
  await supabase
    .from('mentorship_threads')
    .update({ last_message_at: now })
    .eq('id', input.threadId)

  return { ok: true, messageId: created.id }
}

import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import { createNotification } from '@/lib/notifications/createNotification'
import type { MessageInput } from './schemas'

export type SendMessageResult =
  | { ok: true; messageId: string }
  | {
      ok: false
      error: 'not_participant' | 'thread_not_found' | 'thread_archived' | 'db_error'
      detail?: string
    }

/**
 * Send a message into an ask_thread. RLS enforces that the sender is a
 * participant; we still check explicitly to give a clean error message
 * instead of a silent insert failure.
 */
export async function sendMessage(
  supabase: SupabaseClient<Database>,
  senderId: string,
  input: MessageInput,
): Promise<SendMessageResult> {
  const { data: thread } = await supabase
    .from('ask_threads')
    .select('id, helper_id, asker_id, status')
    .eq('id', input.threadId)
    .maybeSingle()

  if (!thread) return { ok: false, error: 'thread_not_found' }
  if (thread.status !== 'active') return { ok: false, error: 'thread_archived' }
  if (thread.helper_id !== senderId && thread.asker_id !== senderId) {
    return { ok: false, error: 'not_participant' }
  }

  const now = new Date().toISOString()
  const { data: created, error: insertErr } = await supabase
    .from('messages')
    .insert({
      thread_id: input.threadId,
      thread_type: 'ask',
      sender_id: senderId,
      body: input.body,
    })
    .select('id')
    .single()

  if (insertErr || !created) {
    return { ok: false, error: 'db_error', detail: insertErr?.message }
  }

  // Bump the thread's last_message_at for inbox sorting.
  await supabase.from('ask_threads').update({ last_message_at: now }).eq('id', input.threadId)

  // Notify the other participant. Notification type stays as legacy
  // 'ask_message' until the /ask routing rename ships.
  const otherUserId = thread.helper_id === senderId ? thread.asker_id : thread.helper_id
  const { data: senderProfile } = await supabase
    .from('base_profiles')
    .select('name')
    .eq('user_id', senderId)
    .maybeSingle()
  await createNotification({
    userId: otherUserId,
    type: 'ask_message',
    organizationId: null,
    targetType: 'ask_thread',
    targetId: input.threadId,
    payload: { actor_id: senderId, actor_name: senderProfile?.name ?? null },
  })

  return { ok: true, messageId: created.id }
}

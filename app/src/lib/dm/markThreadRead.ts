import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

/**
 * Mark all unread messages from the *other* party in this thread as read.
 *
 * Idempotent: only updates rows where read_at IS NULL. Safe to call on
 * every thread page load. The "participants update direct messages"
 * RLS policy in 0003_rls allows the recipient to set read_at on
 * messages where the thread_id ↔ thread participant check passes.
 *
 * Returns the count of rows touched so the caller can decide whether to
 * trigger a fresh inbox revalidation.
 */
export async function markDmThreadRead(
  supabase: SupabaseClient<Database>,
  viewerId: string,
  threadId: string,
): Promise<{ ok: true; updated: number } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('thread_id', threadId)
    .eq('thread_type', 'direct')
    .neq('sender_id', viewerId)
    .is('read_at', null)
    .select('id')

  if (error) return { ok: false, error: error.message }
  return { ok: true, updated: data?.length ?? 0 }
}

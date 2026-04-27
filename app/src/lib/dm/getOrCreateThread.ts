import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

export type GetOrCreateThreadDeps = {
  /**
   * RLS-bound client for the friendship lookup (only friends can DM each other).
   */
  db: SupabaseClient<Database>
  /**
   * Service-role client for the threads insert. direct_message_threads has no
   * INSERT policy by design — see 0001_init RLS comment ("Inserts via
   * service_role, created lazily on first DM, after friendship verified").
   */
  admin: SupabaseClient<Database>
}

export type GetOrCreateThreadResult =
  | { ok: true; threadId: string; created: boolean }
  | { ok: false; error: 'not_friends' | 'self_thread' | 'insert_failed' }

/**
 * Resolve a direct message thread between two friends, creating it lazily
 * on first call. Canonical ordering (user_a_id < user_b_id) is enforced
 * server-side so the unique index does the dedup work.
 *
 * Friendship is required: phase-1-spec gates DM on mutual friendship. If
 * the friendship is later revoked, existing threads remain readable but
 * sendMessage will reject new writes (separate check).
 */
export async function getOrCreateThread(
  deps: GetOrCreateThreadDeps,
  viewerId: string,
  otherUserId: string,
): Promise<GetOrCreateThreadResult> {
  if (viewerId === otherUserId) return { ok: false, error: 'self_thread' }

  const [a, b] = viewerId < otherUserId ? [viewerId, otherUserId] : [otherUserId, viewerId]

  // Verify friendship exists (RLS allows the viewer to read their own friendships).
  const { data: friendship } = await deps.db
    .from('friendships')
    .select('id')
    .eq('user_a_id', a)
    .eq('user_b_id', b)
    .maybeSingle()
  if (!friendship) return { ok: false, error: 'not_friends' }

  // Try existing thread first.
  const { data: existing } = await deps.admin
    .from('direct_message_threads')
    .select('id')
    .eq('user_a_id', a)
    .eq('user_b_id', b)
    .maybeSingle()
  if (existing) return { ok: true, threadId: existing.id, created: false }

  // Create on first DM.
  const { data: inserted, error: insertErr } = await deps.admin
    .from('direct_message_threads')
    .insert({ user_a_id: a, user_b_id: b })
    .select('id')
    .single()
  if (insertErr || !inserted) return { ok: false, error: 'insert_failed' }
  return { ok: true, threadId: inserted.id, created: true }
}

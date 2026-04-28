import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

export type ThreadSummary = {
  threadId: string
  otherUserId: string
  otherName: string | null
  otherAvatarUrl: string | null
  otherHeadline: string | null
  lastMessageBody: string | null
  lastMessageAt: string | null
  lastMessageFromViewer: boolean
  unreadCount: number
}

/**
 * List the viewer's DM threads with metadata for the inbox-style /messages
 * page: other party, last message preview, unread count.
 *
 * Strategy: pull threads, then bulk-fetch all direct messages for those
 * threads in one query and group in JS. At sub-50 threads per user this is
 * fine; if per-user thread count grows past ~200 we'd push the last-message
 * + unread-count to a single SQL window query.
 */
export async function listDmThreads(
  supabase: SupabaseClient<Database>,
  viewerId: string,
): Promise<ThreadSummary[]> {
  const { data: threads, error: tErr } = await supabase
    .from('direct_message_threads')
    .select('id, user_a_id, user_b_id, created_at')
    .or(`user_a_id.eq.${viewerId},user_b_id.eq.${viewerId}`)
  if (tErr) throw new Error(`listDmThreads threads: ${tErr.message}`)
  if (!threads || threads.length === 0) return []

  const threadIds = threads.map((t) => t.id)
  const otherIds = Array.from(
    new Set(threads.map((t) => (t.user_a_id === viewerId ? t.user_b_id : t.user_a_id))),
  )

  const [{ data: messages, error: mErr }, { data: bases, error: bErr }] = await Promise.all([
    supabase
      .from('messages')
      .select('id, thread_id, sender_id, body, read_at, created_at')
      .eq('thread_type', 'direct')
      .in('thread_id', threadIds)
      .order('created_at', { ascending: false }),
    supabase
      .from('base_profiles')
      .select('user_id, name, headline, avatar_url')
      .in('user_id', otherIds),
  ])
  if (mErr) throw new Error(`listDmThreads messages: ${mErr.message}`)
  if (bErr) throw new Error(`listDmThreads profiles: ${bErr.message}`)

  const baseByUser = new Map((bases ?? []).map((b) => [b.user_id, b]))

  // Group messages per thread. They're already ordered DESC, so the first
  // entry per thread is the latest.
  const lastByThread = new Map<string, { body: string; createdAt: string; senderId: string }>()
  const unreadByThread = new Map<string, number>()
  for (const m of messages ?? []) {
    if (!lastByThread.has(m.thread_id)) {
      lastByThread.set(m.thread_id, {
        body: m.body,
        createdAt: m.created_at,
        senderId: m.sender_id,
      })
    }
    if (m.sender_id !== viewerId && !m.read_at) {
      unreadByThread.set(m.thread_id, (unreadByThread.get(m.thread_id) ?? 0) + 1)
    }
  }

  const summaries: ThreadSummary[] = threads.map((t) => {
    const otherId = t.user_a_id === viewerId ? t.user_b_id : t.user_a_id
    const base = baseByUser.get(otherId)
    const last = lastByThread.get(t.id)
    return {
      threadId: t.id,
      otherUserId: otherId,
      otherName: base?.name ?? null,
      otherAvatarUrl: base?.avatar_url ?? null,
      otherHeadline: base?.headline ?? null,
      lastMessageBody: last?.body ?? null,
      lastMessageAt: last?.createdAt ?? null,
      lastMessageFromViewer: last?.senderId === viewerId,
      unreadCount: unreadByThread.get(t.id) ?? 0,
    }
  })

  // Sort by last activity (descending). Empty threads (no messages yet)
  // sink to the bottom by created_at.
  summaries.sort((a, b) => {
    const aT = a.lastMessageAt ?? '0'
    const bT = b.lastMessageAt ?? '0'
    return bT.localeCompare(aT)
  })

  return summaries
}

import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

export type ThreadView = {
  id: string
  status: 'active' | 'archived'
  mentor: ThreadParticipant
  mentee: ThreadParticipant
  request: {
    id: string
    reason: string | null
    helpNeeded: string | null
    background: string | null
  } | null
  messages: ThreadMessage[]
}

export type ThreadParticipant = {
  userId: string
  name: string | null
  avatarUrl: string | null
}

export type ThreadMessage = {
  id: string
  senderId: string
  body: string
  createdAt: string
  readAt: string | null
}

export async function getThread(
  supabase: SupabaseClient<Database>,
  threadId: string,
): Promise<ThreadView | null> {
  const { data: thread } = await supabase
    .from('mentorship_threads')
    .select('id, status, mentor_id, mentee_id, request_id')
    .eq('id', threadId)
    .maybeSingle()
  if (!thread) return null

  const [{ data: mentorBase }, { data: menteeBase }, { data: req }, { data: msgs }] =
    await Promise.all([
      supabase
        .from('base_profiles')
        .select('user_id, name, avatar_url')
        .eq('user_id', thread.mentor_id)
        .maybeSingle(),
      supabase
        .from('base_profiles')
        .select('user_id, name, avatar_url')
        .eq('user_id', thread.mentee_id)
        .maybeSingle(),
      thread.request_id
        ? supabase
            .from('mentorship_requests')
            .select('id, reason, help_needed, background')
            .eq('id', thread.request_id)
            .maybeSingle()
        : Promise.resolve({ data: null as null }),
      supabase
        .from('messages')
        .select('id, sender_id, body, created_at, read_at')
        .eq('thread_id', threadId)
        .eq('thread_type', 'mentorship')
        .order('created_at', { ascending: true }),
    ])

  return {
    id: thread.id,
    status: thread.status as 'active' | 'archived',
    mentor: {
      userId: thread.mentor_id,
      name: mentorBase?.name ?? null,
      avatarUrl: mentorBase?.avatar_url ?? null,
    },
    mentee: {
      userId: thread.mentee_id,
      name: menteeBase?.name ?? null,
      avatarUrl: menteeBase?.avatar_url ?? null,
    },
    request: req
      ? {
          id: req.id,
          reason: req.reason,
          helpNeeded: req.help_needed,
          background: req.background,
        }
      : null,
    messages: (msgs ?? []).map((m) => ({
      id: m.id,
      senderId: m.sender_id,
      body: m.body,
      createdAt: m.created_at,
      readAt: m.read_at,
    })),
  }
}

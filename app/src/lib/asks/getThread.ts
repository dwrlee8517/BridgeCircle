import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import type { AskType } from './schemas'

export type ThreadView = {
  id: string
  status: 'active' | 'archived'
  helper: ThreadParticipant
  asker: ThreadParticipant
  ask: {
    id: string
    askType: AskType
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

export async function getAskThread(
  supabase: SupabaseClient<Database>,
  threadId: string,
): Promise<ThreadView | null> {
  const { data: thread } = await supabase
    .from('ask_threads')
    .select('id, status, helper_id, asker_id, ask_id')
    .eq('id', threadId)
    .maybeSingle()
  if (!thread) return null

  const [{ data: helperBase }, { data: askerBase }, { data: ask }, { data: msgs }] =
    await Promise.all([
      supabase
        .from('base_profiles')
        .select('user_id, name, avatar_url')
        .eq('user_id', thread.helper_id)
        .maybeSingle(),
      supabase
        .from('base_profiles')
        .select('user_id, name, avatar_url')
        .eq('user_id', thread.asker_id)
        .maybeSingle(),
      thread.ask_id
        ? supabase
            .from('asks')
            .select('id, ask_type, reason, help_needed, background')
            .eq('id', thread.ask_id)
            .maybeSingle()
        : Promise.resolve({ data: null as null }),
      supabase
        .from('messages')
        .select('id, sender_id, body, created_at, read_at')
        .eq('thread_id', threadId)
        .eq('thread_type', 'ask')
        .order('created_at', { ascending: true }),
    ])

  return {
    id: thread.id,
    status: thread.status as 'active' | 'archived',
    helper: {
      userId: thread.helper_id,
      name: helperBase?.name ?? null,
      avatarUrl: helperBase?.avatar_url ?? null,
    },
    asker: {
      userId: thread.asker_id,
      name: askerBase?.name ?? null,
      avatarUrl: askerBase?.avatar_url ?? null,
    },
    ask: ask
      ? {
          id: ask.id,
          askType: ask.ask_type as AskType,
          reason: ask.reason,
          helpNeeded: ask.help_needed,
          background: ask.background,
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

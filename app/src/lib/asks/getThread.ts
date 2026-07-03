import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

export type ThreadView = {
  id: string
  status: 'active' | 'archived'
  helper: ThreadParticipant
  asker: ThreadParticipant
  ask: {
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
  graduationYear: number | null
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

  const [
    { data: helperBase },
    { data: askerBase },
    { data: ask },
    { data: msgs },
    { data: memberships },
  ] = await Promise.all([
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
          .select('id, reason, help_needed, background')
          .eq('id', thread.ask_id)
          .maybeSingle()
      : Promise.resolve({ data: null as null }),
    supabase
      .from('messages')
      .select('id, sender_id, body, created_at, read_at')
      .eq('thread_id', threadId)
      .eq('thread_type', 'ask')
      .order('created_at', { ascending: true }),
    supabase
      .from('organization_memberships')
      .select('user_id, organization_profiles(graduation_year)')
      .in('user_id', [thread.helper_id, thread.asker_id])
      .eq('status', 'active'),
  ])

  const gradYearByUser = new Map<string, number | null>()
  for (const m of memberships ?? []) {
    const op = m.organization_profiles
    const year = Array.isArray(op)
      ? (op[0]?.graduation_year ?? null)
      : ((op as { graduation_year: number | null } | null)?.graduation_year ?? null)
    gradYearByUser.set(m.user_id, year)
  }

  return {
    id: thread.id,
    status: thread.status as 'active' | 'archived',
    helper: {
      userId: thread.helper_id,
      name: helperBase?.name ?? null,
      avatarUrl: helperBase?.avatar_url ?? null,
      graduationYear: gradYearByUser.get(thread.helper_id) ?? null,
    },
    asker: {
      userId: thread.asker_id,
      name: askerBase?.name ?? null,
      avatarUrl: askerBase?.avatar_url ?? null,
      graduationYear: gradYearByUser.get(thread.asker_id) ?? null,
    },
    ask: ask
      ? {
          id: ask.id,
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

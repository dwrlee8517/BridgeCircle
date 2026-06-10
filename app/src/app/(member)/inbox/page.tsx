import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { listDmThreads } from '@/lib/dm/listThreads'
import { listPendingFriendRequests } from '@/lib/friendship/listPendingRequests'
import { InboxContainer, type InboxItem } from './inbox-container'

export default async function InboxPage() {
  const session = await requireSession()
  const supabase = await createClient()

  // Inbox is the canonical request lifecycle surface. Asks
  // (incoming/outgoing/threads), friend requests (incoming/outgoing
  // pending), and direct messages all flow through here — friendship and
  // DMs folded in when /friends and /messages folded into /people and
  // /inbox respectively.
  const [{ data: currentUserProfile }, incoming, outgoing, threads, friendRequests, dmThreads] =
    await Promise.all([
      supabase
        .from('base_profiles')
        .select('name, avatar_url')
        .eq('user_id', session.userId)
        .maybeSingle(),
      supabase
        .from('asks')
        .select('id, asker_id, status, ask_type, reason, help_needed, created_at')
        .eq('helper_id', session.userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabase
        .from('asks')
        .select('id, helper_id, status, ask_type, reason, help_needed, created_at, responded_at')
        .eq('asker_id', session.userId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('ask_threads')
        .select('id, helper_id, asker_id, status, last_message_at, created_at, asks(ask_type)')
        .or(`helper_id.eq.${session.userId},asker_id.eq.${session.userId}`)
        .eq('status', 'active')
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false }),
      listPendingFriendRequests(supabase, session.userId),
      listDmThreads(supabase, session.userId),
    ])

  const allUserIds = new Set<string>()
  for (const r of incoming.data ?? []) allUserIds.add(r.asker_id)
  for (const r of outgoing.data ?? []) allUserIds.add(r.helper_id)
  for (const t of threads.data ?? []) {
    allUserIds.add(t.helper_id)
    allUserIds.add(t.asker_id)
  }
  for (const r of friendRequests.incoming) allUserIds.add(r.otherUserId)
  for (const r of friendRequests.outgoing) allUserIds.add(r.otherUserId)
  for (const t of dmThreads) allUserIds.add(t.otherUserId)

  const profileMap = new Map<string, { name: string | null; avatarUrl: string | null }>()
  const cohortMap = new Map<string, number>()
  if (allUserIds.size > 0) {
    const [{ data: profiles }, { data: memberships }] = await Promise.all([
      supabase
        .from('base_profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', [...allUserIds]),
      supabase
        .from('organization_memberships')
        .select('user_id, organization_profiles(graduation_year)')
        .in('user_id', [...allUserIds]),
    ])
    for (const p of profiles ?? []) {
      profileMap.set(p.user_id, { name: p.name, avatarUrl: p.avatar_url })
    }
    for (const m of memberships ?? []) {
      const profilesObj = m.organization_profiles
      const gradYear = Array.isArray(profilesObj)
        ? profilesObj[0]?.graduation_year
        : (profilesObj as { graduation_year: number } | null)?.graduation_year
      if (gradYear) {
        cohortMap.set(m.user_id, gradYear)
      }
    }
  }

  const unreadAskThreadIds = new Set<string>()
  const activeThreadIds = (threads.data ?? []).map((thread) => thread.id)
  if (activeThreadIds.length > 0) {
    const { data: unreadAskMessages } = await supabase
      .from('messages')
      .select('thread_id, sender_id')
      .eq('thread_type', 'ask')
      .in('thread_id', activeThreadIds)
      .is('read_at', null)

    for (const message of unreadAskMessages ?? []) {
      if (message.sender_id !== session.userId) {
        unreadAskThreadIds.add(message.thread_id)
      }
    }
  }

  // Construct InboxItem arrays
  const incomingAsks: InboxItem[] = (incoming.data ?? []).map((r) => {
    const p = profileMap.get(r.asker_id)
    return {
      id: r.id,
      type: 'incoming_ask',
      title: p?.name ?? 'Someone',
      avatarUrl: p?.avatarUrl ?? null,
      badge: r.ask_type === 'advice' ? 'ADVICE' : 'MENTOR',
      badgeTone: 'warn',
      subtitle: r.reason ?? r.help_needed ?? 'Awaiting response',
      date: r.created_at,
      unread: true,
      cohort: cohortMap.get(r.asker_id) ?? null,
      originalData: r,
    }
  })

  const outgoingAsks: InboxItem[] = (outgoing.data ?? []).map((r) => {
    const p = profileMap.get(r.helper_id)
    const statusText =
      r.status === 'pending' ? 'SENT' : r.status === 'accepted' ? 'ACTIVE' : 'DECLINED'
    const tone = r.status === 'pending' ? 'muted' : r.status === 'accepted' ? 'info' : 'alert'
    return {
      id: r.id,
      type: 'outgoing_ask',
      title: p?.name ?? 'Someone',
      avatarUrl: p?.avatarUrl ?? null,
      badge: statusText,
      badgeTone: tone as InboxItem['badgeTone'],
      subtitle: r.reason ?? r.help_needed ?? 'Waiting for help',
      date: r.created_at,
      cohort: cohortMap.get(r.helper_id) ?? null,
      originalData: r,
    }
  })

  const activeThreads: InboxItem[] = (threads.data ?? []).map((t) => {
    const otherId = t.helper_id === session.userId ? t.asker_id : t.helper_id
    const p = profileMap.get(otherId)
    return {
      id: t.id,
      type: 'active_thread',
      title: p?.name ?? 'Someone',
      avatarUrl: p?.avatarUrl ?? null,
      badge: 'ACTIVE',
      badgeTone: 'info',
      subtitle:
        t.helper_id === session.userId
          ? 'You are helping in this thread'
          : 'You are getting help in this thread',
      date: t.last_message_at ?? t.created_at,
      unread: unreadAskThreadIds.has(t.id),
      cohort: cohortMap.get(otherId) ?? null,
      originalData: { ...t, viewerUserId: session.userId },
    }
  })

  const incomingFriendRequests: InboxItem[] = friendRequests.incoming.map((r) => {
    return {
      id: r.requestId,
      type: 'friend_request_incoming',
      title: r.name ?? 'Someone',
      avatarUrl: r.avatarUrl,
      badge: 'Friend request',
      badgeTone: 'info',
      subtitle: r.message ?? 'Wants to connect',
      date: r.createdAt,
      unread: true,
      cohort: cohortMap.get(r.otherUserId) ?? null,
      originalData: r,
    }
  })

  const outgoingFriendRequests: InboxItem[] = friendRequests.outgoing.map((r) => {
    return {
      id: r.requestId,
      type: 'friend_request_outgoing',
      title: r.name ?? 'Someone',
      avatarUrl: r.avatarUrl,
      badge: 'SENT',
      badgeTone: 'muted',
      subtitle: 'Awaiting response',
      date: r.createdAt,
      cohort: cohortMap.get(r.otherUserId) ?? null,
      originalData: r,
    }
  })

  const directMessages: InboxItem[] = dmThreads.map((t) => {
    const unread = t.unreadCount > 0 && !t.lastMessageFromViewer
    const date = t.lastMessageAt ?? new Date().toISOString()
    return {
      id: t.threadId,
      type: 'dm_thread',
      title: t.otherName ?? 'Friend',
      avatarUrl: t.otherAvatarUrl,
      badge: 'DM',
      badgeTone: 'info',
      subtitle: t.lastMessageBody
        ? `${t.lastMessageFromViewer ? 'You: ' : ''}${t.lastMessageBody}`
        : 'No messages yet',
      date: date,
      unread: unread,
      cohort: cohortMap.get(t.otherUserId) ?? null,
      originalData: t,
    }
  })

  const items: InboxItem[] = [
    ...incomingAsks,
    ...outgoingAsks,
    ...activeThreads,
    ...incomingFriendRequests,
    ...outgoingFriendRequests,
    ...directMessages,
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const currentUser = {
    name: currentUserProfile?.name ?? null,
    avatarUrl: currentUserProfile?.avatar_url ?? null,
    userId: session.userId,
  }

  return (
    // density-cozy: list of inbox rows. See docs/experience/ui/design-system/tokens.md § Density modes.
    <div className="density-cozy min-h-[calc(100vh-72px)] w-full bg-background md:h-[calc(100vh-72px)] md:overflow-hidden">
      <InboxContainer items={items} currentUser={currentUser} />
    </div>
  )
}

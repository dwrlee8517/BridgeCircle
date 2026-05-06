import { format, formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'

export default async function InboxPage() {
  const session = await requireSession()
  const supabase = await createClient()

  // Three lists: incoming pending asks (where I'm the helper), outgoing
  // (where I'm the asker), and active threads (where I'm either side).
  const [incoming, outgoing, threads] = await Promise.all([
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
  ])

  const allUserIds = new Set<string>()
  for (const r of incoming.data ?? []) allUserIds.add(r.asker_id)
  for (const r of outgoing.data ?? []) allUserIds.add(r.helper_id)
  for (const t of threads.data ?? []) {
    allUserIds.add(t.helper_id)
    allUserIds.add(t.asker_id)
  }

  const profileMap = new Map<string, { name: string | null; avatarUrl: string | null }>()
  if (allUserIds.size > 0) {
    const { data: profiles } = await supabase
      .from('base_profiles')
      .select('user_id, name, avatar_url')
      .in('user_id', [...allUserIds])
    for (const p of profiles ?? []) {
      profileMap.set(p.user_id, { name: p.name, avatarUrl: p.avatar_url })
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <div className="mb-8 border-b pb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Mentorship
        </p>
        <h1
          className="bc-fraunces mt-2 text-4xl font-bold tracking-[-0.025em] text-foreground sm:text-[44px]"
          style={{ fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 25' }}
        >
          Mentorship Inbox
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Review new requests, active threads, and the mentors you have reached out to.
        </p>
      </div>

      <Section
        title="Incoming requests"
        description="People asking to be mentored by you."
        emptyText="No pending requests."
      >
        {(incoming.data ?? []).map((r) => {
          const p = profileMap.get(r.asker_id)
          // Advice asks leave reason null (it's a one-field form). Fall
          // back to the question itself so the summary line is never blank.
          const summary = r.reason ?? r.help_needed ?? ''
          const typeLabel = r.ask_type === 'advice' ? 'Advice' : 'Mentorship'
          return (
            <Link key={r.id} href={`/mentorship/request/${r.id}`}>
              <RequestCard
                name={p?.name ?? 'Someone'}
                avatarUrl={p?.avatarUrl ?? null}
                badge={
                  <div className="flex items-center gap-1.5">
                    <StatusBadge tone="info">{typeLabel}</StatusBadge>
                    <StatusBadge tone="warn">Awaiting your response</StatusBadge>
                  </div>
                }
                summary={summary}
                ago={r.created_at}
              />
            </Link>
          )
        })}
      </Section>

      <Section
        title="Active mentorships"
        description="Threads with mentors and mentees you've connected with."
        emptyText="No active threads yet."
      >
        {(threads.data ?? []).map((t) => {
          const otherId = t.helper_id === session.userId ? t.asker_id : t.helper_id
          const p = profileMap.get(otherId)
          const isHelper = t.helper_id === session.userId
          const askType = (t.asks as { ask_type: string } | null)?.ask_type ?? 'mentorship'
          const role =
            askType === 'mentorship'
              ? isHelper
                ? 'Mentee'
                : 'Mentor'
              : isHelper
                ? 'Asker'
                : 'Helper'
          const ts = t.last_message_at ?? t.created_at
          return (
            <Link key={t.id} href={`/mentorship/thread/${t.id}`}>
              <RequestCard
                name={p?.name ?? 'Someone'}
                avatarUrl={p?.avatarUrl ?? null}
                badge={<StatusBadge tone="info">{role}</StatusBadge>}
                summary="Open thread →"
                ago={ts}
              />
            </Link>
          )
        })}
      </Section>

      <Section
        title="Your outgoing requests"
        description="Requests you've sent to potential mentors."
        emptyText="You haven't sent any requests yet."
      >
        {(outgoing.data ?? []).map((r) => {
          const p = profileMap.get(r.helper_id)
          const typeLabel = r.ask_type === 'advice' ? 'Advice' : 'Mentorship'
          const statusBadge =
            r.status === 'pending' ? (
              <StatusBadge tone="warn">Pending</StatusBadge>
            ) : r.status === 'accepted' ? (
              <StatusBadge tone="open">Accepted</StatusBadge>
            ) : r.status === 'declined' ? (
              <StatusBadge tone="alert">Declined</StatusBadge>
            ) : (
              <StatusBadge tone="muted">{r.status}</StatusBadge>
            )
          const summary = r.reason ?? r.help_needed ?? ''
          return (
            <Link key={r.id} href={`/mentorship/request/${r.id}`}>
              <RequestCard
                name={p?.name ?? 'Someone'}
                avatarUrl={p?.avatarUrl ?? null}
                badge={
                  <div className="flex items-center gap-1.5">
                    <StatusBadge tone="info">{typeLabel}</StatusBadge>
                    {statusBadge}
                  </div>
                }
                summary={summary}
                ago={r.responded_at ?? r.created_at}
              />
            </Link>
          )
        })}
      </Section>
    </div>
  )
}

function Section({
  title,
  description,
  emptyText,
  children,
}: {
  title: string
  description: string
  emptyText: string
  children: React.ReactNode
}) {
  const arr = (Array.isArray(children) ? children : [children]).filter(Boolean)
  return (
    <Card className="mb-6 transition-all hover:border-primary/60 hover:shadow-[0_4px_20px_-4px_rgba(19,27,46,0.06)]">
      <CardHeader>
        <CardTitle
          className="bc-fraunces text-2xl font-bold tracking-[-0.02em]"
          style={{ fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 25' }}
        >
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {arr.length > 0 ? arr : <p className="text-sm text-muted-foreground">{emptyText}</p>}
      </CardContent>
    </Card>
  )
}

function RequestCard({
  name,
  avatarUrl,
  badge,
  summary,
  ago,
}: {
  name: string
  avatarUrl: string | null
  badge: React.ReactNode
  summary: string
  ago: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-[0_4px_20px_-4px_rgba(19,27,46,0.06)]">
      <Avatar className="size-10">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
        <AvatarFallback className="bg-accent font-semibold text-accent-foreground">
          {name.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{name}</span>
          {badge}
          <span
            className="text-xs text-muted-foreground ml-auto"
            title={format(new Date(ago), 'PPpp')}
          >
            {formatDistanceToNow(new Date(ago), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{summary}</p>
      </div>
    </div>
  )
}

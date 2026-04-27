import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'

export default async function InboxPage() {
  const session = await requireSession()
  const supabase = await createClient()

  // Three lists: incoming pending requests (where I'm the mentor), outgoing
  // pending (where I'm the mentee), and active threads (where I'm either side).
  const [incoming, outgoing, threads] = await Promise.all([
    supabase
      .from('mentorship_requests')
      .select('id, mentee_id, status, reason, help_needed, created_at')
      .eq('mentor_id', session.userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    supabase
      .from('mentorship_requests')
      .select('id, mentor_id, status, reason, help_needed, created_at, responded_at')
      .eq('mentee_id', session.userId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('mentorship_threads')
      .select('id, mentor_id, mentee_id, status, last_message_at, created_at')
      .or(`mentor_id.eq.${session.userId},mentee_id.eq.${session.userId}`)
      .eq('status', 'active')
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
  ])

  const allUserIds = new Set<string>()
  for (const r of incoming.data ?? []) allUserIds.add(r.mentee_id)
  for (const r of outgoing.data ?? []) allUserIds.add(r.mentor_id)
  for (const t of threads.data ?? []) {
    allUserIds.add(t.mentor_id)
    allUserIds.add(t.mentee_id)
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
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Inbox</h1>

      <Section
        title="Incoming requests"
        description="People asking to be mentored by you."
        emptyText="No pending requests."
      >
        {(incoming.data ?? []).map((r) => {
          const p = profileMap.get(r.mentee_id)
          return (
            <Link key={r.id} href={`/mentorship/request/${r.id}`}>
              <RequestCard
                name={p?.name ?? 'Someone'}
                avatarUrl={p?.avatarUrl ?? null}
                badge={<Badge>Awaiting your response</Badge>}
                summary={r.reason ?? ''}
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
          const otherId = t.mentor_id === session.userId ? t.mentee_id : t.mentor_id
          const p = profileMap.get(otherId)
          const role = t.mentor_id === session.userId ? 'Mentee' : 'Mentor'
          const ts = t.last_message_at ?? t.created_at
          return (
            <Link key={t.id} href={`/mentorship/thread/${t.id}`}>
              <RequestCard
                name={p?.name ?? 'Someone'}
                avatarUrl={p?.avatarUrl ?? null}
                badge={<Badge variant="secondary">{role}</Badge>}
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
          const p = profileMap.get(r.mentor_id)
          const badge =
            r.status === 'pending'
              ? <Badge variant="secondary">Pending</Badge>
              : r.status === 'accepted'
                ? <Badge>Accepted</Badge>
                : r.status === 'declined'
                  ? <Badge variant="outline">Declined</Badge>
                  : <Badge variant="outline">{r.status}</Badge>
          return (
            <Link key={r.id} href={`/mentorship/request/${r.id}`}>
              <RequestCard
                name={p?.name ?? 'Someone'}
                avatarUrl={p?.avatarUrl ?? null}
                badge={badge}
                summary={r.reason ?? ''}
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
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
    <div className="flex items-start gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50">
      <Avatar className="size-10">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
        <AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{name}</span>
          {badge}
          <span className="text-xs text-muted-foreground ml-auto" title={format(new Date(ago), 'PPpp')}>
            {formatDistanceToNow(new Date(ago), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{summary}</p>
      </div>
    </div>
  )
}

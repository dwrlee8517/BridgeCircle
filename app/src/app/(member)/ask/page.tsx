import { format, formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'

/**
 * The Ask landing page — sender perspective. Shows what the viewer has
 * asked for (advice + mentorship), grouped lightly by status, with a
 * primary CTA to start a new ask.
 *
 * The receiver perspective lives at /inbox and stays separate for now.
 * Step #7 of the IA reorg unifies inbox + outgoing into a single surface;
 * this page intentionally stops short of that — it's a focused
 * "what have I asked, and what came back" view that makes the verb a
 * top-nav concept without tearing up inbox at the same time.
 *
 * The "Find someone to ask" CTA routes to /discover because the asker
 * first needs to pick a helper — the composer is reached from a
 * profile, not directly. The button copy names the next step honestly
 * ("find someone") rather than promising a composer ("start a new
 * ask") that the click doesn't actually open.
 */
export default async function AskPage() {
  const session = await requireSession()
  const supabase = await createClient()

  const { data: outgoing } = await supabase
    .from('asks')
    .select('id, helper_id, status, ask_type, reason, help_needed, created_at, responded_at')
    .eq('asker_id', session.userId)
    .order('created_at', { ascending: false })
    .limit(50)

  const helperIds = (outgoing ?? []).map((r) => r.helper_id)
  const profileMap = new Map<string, { name: string | null; avatarUrl: string | null }>()
  if (helperIds.length > 0) {
    const { data: profiles } = await supabase
      .from('base_profiles')
      .select('user_id, name, avatar_url')
      .in('user_id', helperIds)
    for (const p of profiles ?? []) {
      profileMap.set(p.user_id, { name: p.name, avatarUrl: p.avatar_url })
    }
  }

  const all = outgoing ?? []
  const open = all.filter((r) => r.status === 'pending' || r.status === 'accepted')
  const closed = all.filter((r) => r.status === 'declined' || r.status === 'expired')

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3 border-b pb-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Ask
          </p>
          <h1
            className="bc-fraunces mt-2 text-4xl font-bold tracking-[-0.025em] text-foreground sm:text-[44px]"
            style={{ fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 25' }}
          >
            Your asks
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            People you&apos;ve reached out to for advice or mentorship.
          </p>
        </div>
        <Button asChild>
          <Link href="/discover">Find someone to ask</Link>
        </Button>
      </div>

      {all.length === 0 ? (
        <EmptyState
          title="You haven't asked anyone yet"
          description="Find a fellow alumnus you'd like to learn from. Quick advice or ongoing mentorship — both are first-class."
          action={{ label: 'Find someone to ask', href: '/discover' }}
        />
      ) : (
        <>
          <Section
            title="Open"
            description="Pending or accepted — still going."
            emptyText="Nothing open right now."
          >
            {open.map((r) => (
              <AskRow key={r.id} row={r} profile={profileMap.get(r.helper_id)} />
            ))}
          </Section>
          {closed.length > 0 ? (
            <Section title="Closed" description="Past asks — declined or expired.">
              {closed.map((r) => (
                <AskRow key={r.id} row={r} profile={profileMap.get(r.helper_id)} />
              ))}
            </Section>
          ) : null}
        </>
      )}
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
  emptyText?: string
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
        {arr.length > 0 ? (
          arr
        ) : (
          <p className="text-sm text-muted-foreground">{emptyText ?? 'Nothing here.'}</p>
        )}
      </CardContent>
    </Card>
  )
}

type AskRowData = {
  id: string
  status: string
  ask_type: string
  reason: string | null
  help_needed: string | null
  created_at: string
  responded_at: string | null
}

function AskRow({
  row,
  profile,
}: {
  row: AskRowData
  profile: { name: string | null; avatarUrl: string | null } | undefined
}) {
  const typeLabel = row.ask_type === 'advice' ? 'Advice' : 'Mentorship'
  const statusBadge =
    row.status === 'pending' ? (
      <StatusBadge tone="warn">Pending</StatusBadge>
    ) : row.status === 'accepted' ? (
      <StatusBadge tone="open">Accepted</StatusBadge>
    ) : row.status === 'declined' ? (
      <StatusBadge tone="alert">Declined</StatusBadge>
    ) : (
      <StatusBadge tone="muted">{row.status}</StatusBadge>
    )
  const summary = row.reason ?? row.help_needed ?? ''
  const ts = row.responded_at ?? row.created_at
  const name = profile?.name ?? 'Someone'
  return (
    <Link href={`/ask/${row.id}`}>
      <div className="flex items-start gap-3 rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-[0_4px_20px_-4px_rgba(19,27,46,0.06)]">
        <Avatar className="size-10">
          {profile?.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt={name} /> : null}
          <AvatarFallback className="bg-accent font-semibold text-accent-foreground">
            {name.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{name}</span>
            <StatusBadge tone="info">{typeLabel}</StatusBadge>
            {statusBadge}
            <span
              className="ml-auto text-xs text-muted-foreground"
              title={format(new Date(ts), 'PPpp')}
            >
              {formatDistanceToNow(new Date(ts), { addSuffix: true })}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{summary}</p>
        </div>
      </div>
    </Link>
  )
}

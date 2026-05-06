import { formatDistanceToNow } from 'date-fns'
import { UserPlus, Users } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { RailSection, TwoColumn } from '@/components/ui/two-column'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { listClassmates } from '@/lib/friendship/listClassmates'
import { listFriends } from '@/lib/friendship/listFriends'
import { listPendingFriendRequests } from '@/lib/friendship/listPendingRequests'
import { RequestActions } from './request-actions'

export default async function FriendsPage() {
  const session = await requireSession()
  const supabase = await createClient()

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('id, organization_id, organization_profiles(graduation_year)')
    .eq('user_id', session.userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  const orgId = membership?.organization_id ?? null
  const myYear =
    (membership?.organization_profiles as { graduation_year: number | null } | null)
      ?.graduation_year ?? null

  const [friends, { incoming, outgoing }, classmates] = await Promise.all([
    listFriends(supabase, session.userId),
    listPendingFriendRequests(supabase, session.userId),
    orgId && myYear !== null
      ? listClassmates(supabase, session.userId, orgId, myYear, 5)
      : Promise.resolve([]),
  ])

  const isCompletelyEmpty = friends.length === 0 && incoming.length === 0 && outgoing.length === 0

  return (
    <TwoColumn
      aside={
        <FriendsRail
          incoming={incoming.length}
          outgoing={outgoing}
          classmates={classmates}
          myYear={myYear}
        />
      }
    >
      <div>
        <h1 className="text-2xl font-semibold">Friends</h1>
        <p className="text-sm text-muted-foreground">
          Connect with classmates. Friends can message each other directly.
        </p>
      </div>

      {incoming.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Friend requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {incoming.map((r) => (
              <div key={r.requestId} className="flex items-start gap-3 rounded-lg border p-3">
                <Link href={`/profile/${r.otherUserId}`} className="shrink-0">
                  <Avatar className="size-10">
                    {r.avatarUrl ? <AvatarImage src={r.avatarUrl} alt={r.name ?? ''} /> : null}
                    <AvatarFallback>{(r.name ?? '?').slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/profile/${r.otherUserId}`}
                      className="font-medium hover:underline"
                    >
                      {r.name ?? 'Someone'}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  {r.headline ? (
                    <p className="text-sm text-muted-foreground">{r.headline}</p>
                  ) : null}
                  <p className="text-sm">
                    {[r.currentTitle, r.currentEmployer].filter(Boolean).join(' · ')}
                  </p>
                  {r.message ? (
                    <p className="text-sm italic text-muted-foreground border-l-2 pl-2">
                      &ldquo;{r.message}&rdquo;
                    </p>
                  ) : null}
                  <div className="pt-2">
                    <RequestActions requestId={r.requestId} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {isCompletelyEmpty ? (
        <EmptyState
          icon={Users}
          title="No friends yet"
          description="Browse the directory and send a friend request from anyone's profile. Once accepted, you can message each other directly."
          action={{ label: 'Browse the directory', href: '/search' }}
        />
      ) : friends.length === 0 ? null : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Your friends
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {friends.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {friends.map((f) => (
              <Link
                key={f.friendshipId}
                href={`/profile/${f.userId}`}
                className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40"
              >
                <Avatar className="size-10 shrink-0">
                  {f.avatarUrl ? <AvatarImage src={f.avatarUrl} alt={f.name ?? ''} /> : null}
                  <AvatarFallback>{(f.name ?? '?').slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{f.name ?? 'Friend'}</span>
                    {f.graduationYear ? (
                      <span className="text-sm text-muted-foreground">
                        &apos;{`${f.graduationYear}`.slice(-2)}
                      </span>
                    ) : null}
                  </div>
                  {f.headline ? (
                    <p className="text-sm text-muted-foreground">{f.headline}</p>
                  ) : null}
                  <p className="text-sm">
                    {[f.currentTitle, f.currentEmployer].filter(Boolean).join(' · ')}
                  </p>
                  {f.city ? <p className="text-xs text-muted-foreground">{f.city}</p> : null}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </TwoColumn>
  )
}

// =============================================================================
// Right rail: outgoing-pending compact list + classmates suggestions
// =============================================================================

type OutgoingRow = Awaited<ReturnType<typeof listPendingFriendRequests>>['outgoing'][number]
type Classmate = Awaited<ReturnType<typeof listClassmates>>[number]

function FriendsRail({
  incoming,
  outgoing,
  classmates,
  myYear,
}: {
  incoming: number
  outgoing: OutgoingRow[]
  classmates: Classmate[]
  myYear: number | null
}) {
  return (
    <>
      <RailSection title="At a glance">
        <div className="space-y-1.5 text-sm">
          <RailStat label="Incoming requests" value={incoming} highlight={incoming > 0} />
          <RailStat label="Sent, awaiting reply" value={outgoing.length} />
        </div>
      </RailSection>

      {outgoing.length > 0 ? (
        <RailSection title="Sent">
          <ul className="space-y-3">
            {outgoing.slice(0, 5).map((r) => (
              <li key={r.requestId}>
                <Link
                  href={`/profile/${r.otherUserId}`}
                  className="flex items-center gap-2.5 text-sm hover:text-primary"
                >
                  <Avatar className="size-7 shrink-0">
                    {r.avatarUrl ? <AvatarImage src={r.avatarUrl} alt={r.name ?? ''} /> : null}
                    <AvatarFallback className="text-xs">
                      {(r.name ?? '?').slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate">{r.name ?? 'Someone'}</span>
                  <StatusBadge tone="warn" className="text-[10px]">
                    Pending
                  </StatusBadge>
                </Link>
              </li>
            ))}
          </ul>
        </RailSection>
      ) : null}

      {classmates.length > 0 && myYear !== null ? (
        <RailSection title={`From the class of '${`${myYear}`.slice(-2)}`}>
          <ul className="space-y-3">
            {classmates.map((c) => (
              <li key={c.userId}>
                <Link
                  href={`/profile/${c.userId}`}
                  className="flex items-center gap-2.5 text-sm hover:text-primary"
                >
                  <Avatar className="size-7 shrink-0">
                    {c.avatarUrl ? <AvatarImage src={c.avatarUrl} alt={c.name ?? ''} /> : null}
                    <AvatarFallback className="text-xs">
                      {(c.name ?? '?').slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium leading-tight">{c.name ?? '—'}</p>
                    {c.currentTitle || c.currentEmployer ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {[c.currentTitle, c.currentEmployer].filter(Boolean).join(' · ')}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/search"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <UserPlus className="size-3" />
            Find more classmates
          </Link>
        </RailSection>
      ) : null}
    </>
  )
}

function RailStat({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`tabular-nums font-semibold ${highlight ? 'text-primary' : 'text-foreground'}`}
      >
        {value}
      </span>
    </div>
  )
}

import { formatDistanceToNow } from 'date-fns'
import { Users } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { listFriends } from '@/lib/friendship/listFriends'
import { listPendingFriendRequests } from '@/lib/friendship/listPendingRequests'
import { RequestActions } from './request-actions'

export default async function FriendsPage() {
  const session = await requireSession()
  const supabase = await createClient()

  const [friends, { incoming, outgoing }] = await Promise.all([
    listFriends(supabase, session.userId),
    listPendingFriendRequests(supabase, session.userId),
  ])

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
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
            <CardDescription>
              {incoming.length} {incoming.length === 1 ? 'person wants' : 'people want'} to connect.
            </CardDescription>
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

      {outgoing.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sent</CardTitle>
            <CardDescription>
              Waiting on {outgoing.length} response{outgoing.length === 1 ? '' : 's'}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {outgoing.map((r) => (
              <div key={r.requestId} className="flex items-center gap-3 text-sm">
                <Avatar className="size-8">
                  {r.avatarUrl ? <AvatarImage src={r.avatarUrl} alt={r.name ?? ''} /> : null}
                  <AvatarFallback>{(r.name ?? '?').slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Link href={`/profile/${r.otherUserId}`} className="font-medium hover:underline">
                  {r.name ?? 'Someone'}
                </Link>
                <span className="text-xs text-muted-foreground">
                  sent {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                </span>
                <StatusBadge tone="warn" className="ml-auto">
                  Pending
                </StatusBadge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {friends.length === 0 && incoming.length === 0 && outgoing.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No friends yet"
          description="Browse the directory and send a friend request from anyone's profile. Once accepted, you can message each other directly."
          action={{ label: 'Browse the directory', href: '/search' }}
        />
      ) : friends.length === 0 ? null : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your friends</CardTitle>
            <CardDescription>
              {`${friends.length} ${friends.length === 1 ? 'friend' : 'friends'}.`}
            </CardDescription>
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
                        '{`${f.graduationYear}`.slice(-2)}
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
    </div>
  )
}

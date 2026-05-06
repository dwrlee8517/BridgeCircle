import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { getDmThread } from '@/lib/dm/getThread'
import { markDmThreadRead } from '@/lib/dm/markThreadRead'
import { LiveThread } from './live-thread'

type Params = { id: string }

export default async function MessageThreadPage({ params }: { params: Promise<Params> }) {
  const session = await requireSession()
  const { id } = await params
  const supabase = await createClient()

  const result = await getDmThread(supabase, session.userId, id)
  if (!result.ok) notFound()

  // Mark messages as read on every load. Idempotent — only updates rows
  // that were actually unread. Doesn't block the render; we don't await
  // a revalidate since the realtime subscription handles fresh data.
  await markDmThreadRead(supabase, session.userId, id)

  const { thread } = result

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
      <Link
        href="/inbox"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ChevronLeft className="size-4" />
        Back to inbox
      </Link>

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0 pb-3">
          <Link href={`/profile/${thread.otherUserId}`} className="shrink-0">
            <Avatar className="size-12">
              {thread.otherAvatarUrl ? (
                <AvatarImage src={thread.otherAvatarUrl} alt={thread.otherName ?? ''} />
              ) : null}
              <AvatarFallback>{(thread.otherName ?? '?').slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={`/profile/${thread.otherUserId}`} className="font-semibold hover:underline">
              {thread.otherName ?? 'Friend'}
            </Link>
            {thread.otherHeadline ? (
              <p className="text-xs text-muted-foreground truncate">{thread.otherHeadline}</p>
            ) : null}
          </div>
          {!thread.isStillFriends ? (
            <span className="text-xs text-muted-foreground italic">Read-only</span>
          ) : null}
        </CardHeader>
        <CardContent>
          <LiveThread
            threadId={thread.threadId}
            viewerId={session.userId}
            initialMessages={thread.messages}
            composerEnabled={thread.isStillFriends}
          />
        </CardContent>
      </Card>
    </div>
  )
}

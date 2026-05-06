import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { listDmThreads } from '@/lib/dm/listThreads'

export default async function MessagesPage() {
  const session = await requireSession()
  const supabase = await createClient()

  const threads = await listDmThreads(supabase, session.userId)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Messages</h1>
        <p className="text-sm text-muted-foreground">
          Direct messages with friends. Open a thread to read or reply.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {threads.length === 0
              ? 'No conversations yet'
              : `${threads.length} ${threads.length === 1 ? 'conversation' : 'conversations'}`}
          </CardTitle>
          {threads.length === 0 ? (
            <CardDescription>
              Add someone as a friend from their profile, then send them a message.
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-2">
          {threads.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              <Link href="/discover" className="text-primary hover:underline">
                Discover alumni
              </Link>{' '}
              and add someone as a friend to start a thread.
            </p>
          ) : (
            threads.map((t) => (
              <Link
                key={t.threadId}
                href={`/messages/${t.threadId}`}
                className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40"
              >
                <Avatar className="size-10 shrink-0">
                  {t.otherAvatarUrl ? (
                    <AvatarImage src={t.otherAvatarUrl} alt={t.otherName ?? ''} />
                  ) : null}
                  <AvatarFallback>{(t.otherName ?? '?').slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${t.unreadCount > 0 ? 'text-foreground' : ''}`}>
                      {t.otherName ?? 'Friend'}
                    </span>
                    {t.unreadCount > 0 ? (
                      <Badge variant="default" className="px-1.5 text-xs">
                        {t.unreadCount}
                      </Badge>
                    ) : null}
                    {t.lastMessageAt ? (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(t.lastMessageAt), { addSuffix: true })}
                      </span>
                    ) : null}
                  </div>
                  {t.lastMessageBody ? (
                    <p
                      className={`text-sm truncate ${
                        t.unreadCount > 0 && !t.lastMessageFromViewer
                          ? 'text-foreground font-medium'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {t.lastMessageFromViewer ? 'You: ' : ''}
                      {t.lastMessageBody}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No messages yet</p>
                  )}
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

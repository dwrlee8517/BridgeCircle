import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { getThread, type ThreadParticipant, type ThreadMessage } from '@/lib/mentorship/getThread'
import { MessageForm } from './message-form'

type Params = { id: string }

export default async function ThreadPage({ params }: { params: Promise<Params> }) {
  const session = await requireSession()
  const { id } = await params
  const supabase = await createClient()
  const thread = await getThread(supabase, id)

  if (!thread) notFound()

  const isParticipant =
    thread.mentor.userId === session.userId || thread.mentee.userId === session.userId
  if (!isParticipant) notFound()

  const other = thread.mentor.userId === session.userId ? thread.mentee : thread.mentor
  const myRole = thread.mentor.userId === session.userId ? 'Mentor' : 'Mentee'

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
      <Link href="/inbox" className="text-sm text-muted-foreground hover:underline">
        ← Inbox
      </Link>

      <Card>
        <CardHeader className="flex-row items-start gap-4 space-y-0">
          <Avatar className="size-12">
            {other.avatarUrl ? <AvatarImage src={other.avatarUrl} alt={other.name ?? ''} /> : null}
            <AvatarFallback>{(other.name ?? '?').slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg">{other.name ?? 'Thread'}</CardTitle>
            <CardDescription>
              You're the {myRole} in this mentorship.{' '}
              <Link href={`/profile/${other.userId}`} className="underline">
                View profile
              </Link>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {thread.request ? (
            <div className="space-y-2 rounded-md border bg-muted/40 p-3 mb-4">
              <p className="text-xs font-medium uppercase text-muted-foreground tracking-wide">
                Original request
              </p>
              {thread.request.reason ? (
                <p className="text-sm whitespace-pre-line">
                  <span className="text-muted-foreground">Why: </span>
                  {thread.request.reason}
                </p>
              ) : null}
              {thread.request.helpNeeded ? (
                <p className="text-sm whitespace-pre-line">
                  <span className="text-muted-foreground">Help: </span>
                  {thread.request.helpNeeded}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-3">
            {thread.messages.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No messages yet. Say hello.
              </p>
            ) : (
              thread.messages.map((m) => (
                <MessageRow
                  key={m.id}
                  message={m}
                  self={m.senderId === session.userId}
                  sender={m.senderId === thread.mentor.userId ? thread.mentor : thread.mentee}
                />
              ))
            )}
          </div>

          <div className="border-t mt-5 pt-4">
            <MessageForm threadId={thread.id} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MessageRow({
  message,
  self,
  sender,
}: {
  message: ThreadMessage
  self: boolean
  sender: ThreadParticipant
}) {
  return (
    <div className={`flex gap-2 ${self ? 'flex-row-reverse' : ''}`}>
      <Avatar className="size-8 shrink-0">
        {sender.avatarUrl ? <AvatarImage src={sender.avatarUrl} alt={sender.name ?? ''} /> : null}
        <AvatarFallback>{(sender.name ?? '?').slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className={`max-w-[80%] ${self ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`rounded-lg px-3 py-2 text-sm whitespace-pre-line ${
            self ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}
        >
          {message.body}
        </div>
        <span
          className="text-xs text-muted-foreground mt-1"
          title={format(new Date(message.createdAt), 'PPpp')}
        >
          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
        </span>
      </div>
    </div>
  )
}

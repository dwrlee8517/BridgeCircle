import { format, formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/db/server'
import { getAskThread, type ThreadMessage, type ThreadParticipant } from '@/lib/asks/getThread'
import { requireSession } from '@/lib/auth/session'
import { MentorshipGoalTracker } from './goal-tracker'
import { MessageForm } from './message-form'

type Params = { id: string }

export default async function ThreadPage({ params }: { params: Promise<Params> }) {
  const session = await requireSession()
  const { id } = await params
  const supabase = await createClient()
  const thread = await getAskThread(supabase, id)

  if (!thread) notFound()

  const isParticipant =
    thread.helper.userId === session.userId || thread.asker.userId === session.userId
  if (!isParticipant) notFound()

  const other = thread.helper.userId === session.userId ? thread.asker : thread.helper
  const isHelper = thread.helper.userId === session.userId
  // Inbox owns active ask threads for both askers and helpers.
  const backHref = '/inbox'
  const backLabel = 'Inbox'
  // Role label adapts to ask type: mentor/mentee for ongoing mentorship,
  // helper/asker for one-off advice. Both still flow through the same
  // thread shape; only the label changes.
  const myRole =
    thread.ask?.askType === 'mentorship'
      ? isHelper
        ? 'Mentor'
        : 'Mentee'
      : isHelper
        ? 'Helper'
        : 'Asker'
  const conversationKind = thread.ask?.askType === 'mentorship' ? 'mentorship' : 'conversation'
  const isMentorship = thread.ask?.askType === 'mentorship' && thread.status === 'active'

  return (
    <div
      className={`density-cozy mx-auto space-y-4 px-4 py-8 sm:px-8 ${
        isMentorship ? 'max-w-6xl' : 'max-w-3xl'
      }`}
    >
      <Link
        href={backHref}
        className="font-mono text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
      >
        ← {backLabel}
      </Link>

      <div
        className={`grid grid-cols-1 items-start gap-6 ${
          isMentorship ? 'lg:grid-cols-[minmax(0,1fr)_320px]' : ''
        }`}
      >
        <Card className="h-full border-border bg-card shadow-card">
          <CardHeader className="flex-row items-start gap-4 space-y-0 border-b border-border pb-5">
            <Avatar className="size-12 rounded-md after:rounded-md">
              {other.avatarUrl ? (
                <AvatarImage src={other.avatarUrl} alt={other.name ?? ''} className="rounded-md" />
              ) : null}
              <AvatarFallback className="rounded-md">
                {(other.name ?? '?').slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg">{other.name ?? 'Thread'}</CardTitle>
              <CardDescription>
                You&apos;re the {myRole} in this {conversationKind}.{' '}
                <Link href={`/profile/${other.userId}`} className="underline">
                  View profile
                </Link>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            {thread.ask ? (
              <div className="bc-pull-quote mb-5 space-y-3 rounded-r-md bg-primary-tint/55 py-3 pr-4">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em] text-primary">
                  Original ask
                </p>
                {thread.ask.reason ? (
                  <p className="whitespace-pre-line text-sm leading-6 text-foreground">
                    <span className="font-semibold text-muted-foreground">Why: </span>
                    {thread.ask.reason}
                  </p>
                ) : null}
                {thread.ask.helpNeeded ? (
                  <p className="whitespace-pre-line text-base leading-7 text-foreground">
                    <span className="font-semibold text-muted-foreground">Help: </span>
                    {thread.ask.helpNeeded}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-3">
              {thread.messages.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No messages yet. Say hello.</p>
              ) : (
                thread.messages.map((m) => (
                  <MessageRow
                    key={m.id}
                    message={m}
                    self={m.senderId === session.userId}
                    sender={m.senderId === thread.helper.userId ? thread.helper : thread.asker}
                  />
                ))
              )}
            </div>

            <div className="mt-5 border-t border-border pt-4">
              <MessageForm threadId={thread.id} />
            </div>
          </CardContent>
        </Card>

        {isMentorship ? (
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card lg:sticky lg:top-24">
            <MentorshipGoalTracker threadId={thread.id} />
          </div>
        ) : null}
      </div>
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
      <Avatar className="size-8 shrink-0 rounded-md after:rounded-md">
        {sender.avatarUrl ? (
          <AvatarImage src={sender.avatarUrl} alt={sender.name ?? ''} className="rounded-md" />
        ) : null}
        <AvatarFallback className="rounded-md">
          {(sender.name ?? '?').slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className={`max-w-[72%] ${self ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`rounded-md px-3.5 py-2 text-sm leading-relaxed whitespace-pre-line ${
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

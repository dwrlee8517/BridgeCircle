import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { acceptAction, declineAction } from './actions'

type Params = { id: string }

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<Params>
}) {
  const session = await requireSession()
  const { id } = await params
  const supabase = await createClient()

  const { data: req } = await supabase
    .from('mentorship_requests')
    .select(
      'id, mentor_id, mentee_id, status, reason, help_needed, background, created_at, responded_at',
    )
    .eq('id', id)
    .maybeSingle()

  if (!req) notFound()

  const isMentor = req.mentor_id === session.userId
  const isMentee = req.mentee_id === session.userId
  if (!isMentor && !isMentee) notFound()

  const otherUserId = isMentor ? req.mentee_id : req.mentor_id

  const { data: otherProfile } = await supabase
    .from('base_profiles')
    .select('user_id, name, headline, avatar_url')
    .eq('user_id', otherUserId)
    .maybeSingle()

  // If accepted and this is the mentor or mentee, show a link to the thread.
  let threadId: string | null = null
  if (req.status === 'accepted') {
    const { data: thread } = await supabase
      .from('mentorship_threads')
      .select('id')
      .eq('request_id', req.id)
      .maybeSingle()
    threadId = thread?.id ?? null
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
      <Link href="/inbox" className="text-sm text-muted-foreground hover:underline">
        ← Inbox
      </Link>

      <Card>
        <CardHeader className="flex-row items-start gap-4 space-y-0">
          <Avatar className="size-12">
            {otherProfile?.avatar_url ? (
              <AvatarImage src={otherProfile.avatar_url} alt={otherProfile.name ?? ''} />
            ) : null}
            <AvatarFallback>{(otherProfile?.name ?? '?').slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <CardTitle className="text-lg">
              {isMentor ? `Request from ${otherProfile?.name}` : `Your request to ${otherProfile?.name}`}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={req.status as Status} />
              <span className="text-xs text-muted-foreground">
                Sent {format(new Date(req.created_at), 'PP')}
                {req.responded_at
                  ? ` · responded ${format(new Date(req.responded_at), 'PP')}`
                  : ''}
              </span>
            </div>
            {otherProfile?.headline ? (
              <p className="text-sm text-muted-foreground">{otherProfile.headline}</p>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Why">{req.reason ?? '—'}</Field>
          <Field label="What help looks like">{req.help_needed ?? '—'}</Field>
          {req.background ? <Field label="Background">{req.background}</Field> : null}

          <div className="flex gap-2 pt-2">
            {isMentor && req.status === 'pending' ? (
              <>
                <form action={acceptAction}>
                  <input type="hidden" name="requestId" value={req.id} />
                  <Button type="submit">Accept</Button>
                </form>
                <form action={declineAction}>
                  <input type="hidden" name="requestId" value={req.id} />
                  <Button type="submit" variant="outline">
                    Decline
                  </Button>
                </form>
              </>
            ) : null}

            {req.status === 'accepted' && threadId ? (
              <Button asChild>
                <Link href={`/mentorship/thread/${threadId}`}>Open thread</Link>
              </Button>
            ) : null}

            {isMentee ? (
              <Button asChild variant="outline">
                <Link href={`/profile/${otherUserId}`}>View their profile</Link>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

type Status = 'pending' | 'accepted' | 'declined' | 'expired'

function StatusBadge({ status }: { status: Status }) {
  const variant = {
    pending: 'secondary',
    accepted: 'default',
    declined: 'outline',
    expired: 'outline',
  } as const
  return <Badge variant={variant[status]}>{status}</Badge>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <h3 className="text-xs font-medium uppercase text-muted-foreground tracking-wide">
        {label}
      </h3>
      <p className="text-sm whitespace-pre-line">{children}</p>
    </div>
  )
}

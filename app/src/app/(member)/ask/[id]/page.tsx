import { format } from 'date-fns'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { acceptAction, declineAction } from './actions'

type Params = { id: string }

export default async function RequestDetailPage({ params }: { params: Promise<Params> }) {
  const session = await requireSession()
  const { id } = await params
  const supabase = await createClient()

  const { data: req } = await supabase
    .from('asks')
    .select(
      'id, helper_id, asker_id, status, ask_type, reason, help_needed, background, created_at, responded_at',
    )
    .eq('id', id)
    .maybeSingle()

  if (!req) notFound()

  const isHelper = req.helper_id === session.userId
  const isAsker = req.asker_id === session.userId
  if (!isHelper && !isAsker) notFound()

  const otherUserId = isHelper ? req.asker_id : req.helper_id

  // Inbox owns request state for both askers and helpers.
  const backHref = '/inbox'
  const backLabel = 'Inbox'

  const { data: otherProfile } = await supabase
    .from('base_profiles')
    .select('user_id, name, headline, avatar_url')
    .eq('user_id', otherUserId)
    .maybeSingle()

  // If accepted, show a link to the thread the response created.
  let threadId: string | null = null
  if (req.status === 'accepted') {
    const { data: thread } = await supabase
      .from('ask_threads')
      .select('id')
      .eq('ask_id', req.id)
      .maybeSingle()
    threadId = thread?.id ?? null
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
      <Link href={backHref} className="text-sm text-muted-foreground hover:underline">
        ← {backLabel}
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
              {isHelper
                ? `Request from ${otherProfile?.name}`
                : `Your request to ${otherProfile?.name}`}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{req.ask_type === 'advice' ? 'Advice' : 'Mentorship'}</Badge>
              <StatusBadge status={req.status as Status} />
              <span className="text-xs text-muted-foreground">
                Sent {format(new Date(req.created_at), 'PP')}
                {req.responded_at ? ` · responded ${format(new Date(req.responded_at), 'PP')}` : ''}
              </span>
            </div>
            {otherProfile?.headline ? (
              <p className="text-sm text-muted-foreground">{otherProfile.headline}</p>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Field shape varies by ask type:
                advice     → only the question (help_needed) is filled.
                mentorship → reason ("why this person") is optional,
                             help_needed is the primary ask, background
                             is optional context. We hide null fields
                             instead of rendering a stray "—" line. */}
          {req.ask_type === 'advice' ? (
            <Field label="Their question">{req.help_needed ?? '—'}</Field>
          ) : (
            <>
              {req.reason ? <Field label="Why you specifically">{req.reason}</Field> : null}
              <Field label="What they're hoping to explore">{req.help_needed ?? '—'}</Field>
              {req.background ? <Field label="Anything else">{req.background}</Field> : null}
            </>
          )}

          <div className="flex gap-2 pt-2">
            {isHelper && req.status === 'pending' ? (
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
                <Link href={`/ask/thread/${threadId}`}>Open thread</Link>
              </Button>
            ) : null}

            {isAsker ? (
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
      <h3 className="text-xs font-medium uppercase text-muted-foreground tracking-wide">{label}</h3>
      <p className="text-sm whitespace-pre-line">{children}</p>
    </div>
  )
}

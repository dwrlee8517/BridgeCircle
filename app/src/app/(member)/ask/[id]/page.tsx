import { format } from 'date-fns'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type LifecycleStatus, LifecycleStatusBadge } from '@/components/ui/status-badge'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { acceptAction, declineAction } from './actions'
import {
  AskAlternativeSection,
  AskAlternativeSkeleton,
  AskerClosedBadge,
  AskerTimeline,
  ClosedAskCopy,
} from './lifecycle-ui'

type Params = { id: string }

export default async function RequestDetailPage({ params }: { params: Promise<Params> }) {
  const session = await requireSession()
  const { id } = await params
  const supabase = await createClient()

  const { data: req } = await supabase
    .from('asks')
    .select(
      'id, helper_id, asker_id, organization_id, status, ask_type, reason, help_needed, background, created_at, responded_at, reminder_sent_at',
    )
    .eq('id', id)
    .maybeSingle()

  if (!req) notFound()

  const isHelper = req.helper_id === session.userId
  const isAsker = req.asker_id === session.userId
  if (!isHelper && !isAsker) notFound()

  const otherUserId = isHelper ? req.asker_id : req.helper_id
  const askerClosed = isAsker && (req.status === 'declined' || req.status === 'expired')

  // Inbox owns request state for both askers and helpers.
  const backHref = '/inbox'
  const backLabel = 'Inbox'

  const { data: otherProfile } = await supabase
    .from('base_profiles')
    .select('user_id, name, headline, avatar_url')
    .eq('user_id', otherUserId)
    .maybeSingle()

  // For the asker, "other" is the helper — the lifecycle copy speaks of them
  // by first name. Skip honorifics so "Dr. Jessica Wong" reads as Jessica,
  // not "Still waiting on Dr.".
  const helperNameParts = (otherProfile?.name ?? '')
    .split(/\s+/)
    .filter((part) => !/^(dr|prof|mr|ms|mrs)\.?$/i.test(part))
  const helperFirstName = helperNameParts[0] || 'They'

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
    <div className="density-cozy mx-auto max-w-3xl space-y-4 px-4 py-8 sm:px-8">
      <Link
        href={backHref}
        className="font-mono text-xs font-semibold uppercase tracking-label text-muted-foreground transition-colors hover:text-foreground"
      >
        ← {backLabel}
      </Link>

      <Card className="border-border bg-card shadow-card">
        <CardHeader className="flex-row items-start gap-4 space-y-0 border-b border-border pb-5">
          <Avatar className="size-12 rounded-md after:rounded-md">
            {otherProfile?.avatar_url ? (
              <AvatarImage
                src={otherProfile.avatar_url}
                alt={otherProfile.name ?? ''}
                className="rounded-md"
              />
            ) : null}
            <AvatarFallback className="rounded-md">
              {(otherProfile?.name ?? '?').slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <CardTitle className="text-lg">
              {isHelper
                ? `Request from ${otherProfile?.name}`
                : `Your request to ${otherProfile?.name}`}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{req.ask_type === 'advice' ? 'Advice' : 'Mentorship'}</Badge>
              {askerClosed ? (
                <AskerClosedBadge status={req.status as 'declined' | 'expired'} />
              ) : (
                <LifecycleStatusBadge status={req.status as RequestLifecycleStatus} />
              )}
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
        <CardContent className="space-y-5 pt-5">
          {/* Field shape varies by ask type:
                advice     → only the question (help_needed) is filled.
                mentorship → reason ("why this person") is optional,
                             help_needed is the primary ask, background
                             is optional context. We hide null fields
                             instead of rendering a stray "—" line. */}
          {req.ask_type === 'advice' ? (
            <AskQuote label={isAsker ? 'Your question' : 'Their question'}>
              {req.help_needed ?? '—'}
            </AskQuote>
          ) : (
            <>
              {req.reason ? (
                <Field label={isAsker ? 'Why this person' : 'Why you specifically'}>
                  {req.reason}
                </Field>
              ) : null}
              <AskQuote
                label={isAsker ? "What you're hoping to explore" : "What they're hoping to explore"}
              >
                {req.help_needed ?? '—'}
              </AskQuote>
              {req.background ? <Field label="Anything else">{req.background}</Field> : null}
            </>
          )}

          {isHelper && req.status === 'pending' ? (
            <div className="rounded-md border border-border bg-surface-panel/55 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">What happens next:</span> accepting
              opens a conversation thread so you can reply; declining closes the request.
            </div>
          ) : null}

          {isAsker && req.status === 'pending' ? (
            <AskerTimeline
              askId={req.id}
              helperFirstName={helperFirstName}
              createdAt={req.created_at}
              reminderSentAt={req.reminder_sent_at}
              helpNeeded={req.help_needed ?? ''}
            />
          ) : null}

          {askerClosed ? (
            <>
              <ClosedAskCopy
                status={req.status as 'declined' | 'expired'}
                helperFirstName={helperFirstName}
              />
              <Suspense fallback={<AskAlternativeSkeleton />}>
                <AskAlternativeSection
                  organizationId={req.organization_id}
                  askerId={req.asker_id}
                  query={req.help_needed ?? req.reason ?? ''}
                  excludeUserId={req.helper_id}
                />
              </Suspense>
            </>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            {isHelper && req.status === 'pending' ? (
              <>
                <form action={acceptAction}>
                  <input type="hidden" name="requestId" value={req.id} />
                  <Button type="submit" variant="offer">
                    Accept & reply
                  </Button>
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

type RequestLifecycleStatus = Extract<
  LifecycleStatus,
  'pending' | 'accepted' | 'declined' | 'expired'
>

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <h3 className="font-mono text-xs font-semibold uppercase tracking-label text-muted-foreground">
        {label}
      </h3>
      <p className="whitespace-pre-line text-sm leading-6 text-foreground">{children}</p>
    </div>
  )
}

function AskQuote({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bc-pull-quote space-y-2 rounded-r-md bg-primary-tint/55 py-3 pr-4">
      <h3 className="font-mono text-xs font-semibold uppercase tracking-label text-primary">
        {label}
      </h3>
      <p className="whitespace-pre-line text-base leading-7 text-foreground">{children}</p>
    </div>
  )
}

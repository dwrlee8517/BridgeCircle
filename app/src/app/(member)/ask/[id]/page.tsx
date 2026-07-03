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
import type { DeclineReason } from '@/lib/asks/declineReasons'
import { requireSession } from '@/lib/auth/session'
import { acceptAction } from './actions'
import { DeclineChooser } from './decline-chooser'
import {
  AskAlternativeSection,
  AskAlternativeSkeleton,
  AskerClosedBadge,
  AskerTimeline,
  ClosedAskCopy,
  PauseOfferCard,
} from './lifecycle-ui'

type Params = { id: string }
type SearchParams = { pause?: string }

export default async function RequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<SearchParams>
}) {
  const session = await requireSession()
  const { id } = await params
  const { pause } = await searchParams
  const supabase = await createClient()

  const { data: req } = await supabase
    .from('asks')
    .select(
      'id, helper_id, asker_id, organization_id, status, ask_type, reason, help_needed, background, created_at, responded_at, reminder_sent_at, decline_reason, commitment, screening_answer',
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

  // Lifecycle copy speaks of people by first name; skip honorifics so
  // "Dr. Jessica Wong" reads as Jessica, not "Still waiting on Dr.".
  const otherFirstName = firstNameOf(otherProfile?.name) || 'They'
  // Asker view: "other" is the helper. Helper view: "other" is the asker.
  const helperFirstName = otherFirstName
  const askerFirstName = otherFirstName

  // The decline chooser previews what the asker will read, which names the
  // helper — the viewer themself in that branch.
  let viewerFirstName = 'They'
  if (isHelper && req.status === 'pending') {
    const { data: viewerProfile } = await supabase
      .from('base_profiles')
      .select('name')
      .eq('user_id', session.userId)
      .maybeSingle()
    viewerFirstName = firstNameOf(viewerProfile?.name) || 'They'
  }

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
              {isHelper ? `Ask from ${otherProfile?.name}` : `Your ask to ${otherProfile?.name}`}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {req.ask_type === 'advice' ? 'Quick question' : 'Ongoing help'}
              </Badge>
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
                declineReason={(req.decline_reason as DeclineReason | null) ?? null}
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

          {isHelper && req.status === 'declined' && pause === 'offered' ? (
            <PauseOfferCard askerFirstName={askerFirstName} />
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
                <DeclineChooser
                  askId={req.id}
                  helperFirstName={viewerFirstName}
                  askerFirstName={askerFirstName}
                />
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

function firstNameOf(name: string | null | undefined): string | null {
  const parts = (name ?? '').split(/\s+/).filter((part) => !/^(dr|prof|mr|ms|mrs)\.?$/i.test(part))
  return parts[0] || null
}

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

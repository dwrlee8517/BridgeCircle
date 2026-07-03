import { format } from 'date-fns'
import { ArrowRight, Check, Lock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PersonAvatar, RationaleBlock } from '@/components/ui/person-card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { createClient } from '@/db/server'
import { askLifecycleView, findAskAlternative } from '@/lib/asks/askLifecycle'
import { type DeclineReason, declineCopyForAsker } from '@/lib/asks/declineReasons'
import { explicitPauseHorizon } from '@/lib/asks/preferences'
import { askComposeHref, classYearShort, cn, displayName, isOpenToHelp } from '@/lib/utils'
import { pauseHelperAction, sendReminderAction } from './actions'

/**
 * Asker-side post-send loop (the "close the loop" mocks, 2026-06-11):
 * the what-happens-next timeline + gentle reminder while an ask is
 * pending, and the dignity copy + next-best alternative once it closes.
 * Everything here renders only for the asker.
 */

function shortDate(date: Date) {
  return format(date, 'EEE, MMM d')
}

export function AskerTimeline({
  askId,
  helperFirstName,
  createdAt,
  reminderSentAt,
  helpNeeded,
}: {
  askId: string
  helperFirstName: string
  createdAt: string
  reminderSentAt: string | null
  helpNeeded: string
}) {
  const view = askLifecycleView({ status: 'pending', createdAt, reminderSentAt })

  return (
    <div className="rounded-md border border-border bg-surface-panel/40 p-4">
      <p className="bc-card-label">What happens next</p>
      <div className="mt-3">
        <TimelineStep state="done" title="Sent" detail={shortDate(new Date(createdAt))} />
        <TimelineStep
          state="current"
          title={`${helperFirstName} sees it`}
          detail="Most helpers reply within a few days."
        />
        <TimelineStep
          state="future"
          title="They reply — or pass"
          detail="Either way you'll hear from us. No reading silence."
        />
        <TimelineStep
          state="future"
          last
          title={`Still quiet by ${shortDate(view.expiryDate)}?`}
          detail="It closes on its own and we'll suggest someone else — no awkward limbo."
        />
      </div>

      <div className="mt-3 border-border border-t border-dashed pt-3">
        {view.availability === 'sent' && reminderSentAt ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Check aria-hidden className="size-3.5 shrink-0 text-accent-sage" />
            Gentle reminder sent {shortDate(new Date(reminderSentAt))} — one per ask.
          </p>
        ) : view.availability === 'available' ? (
          <div>
            <p className="font-heading text-sm font-semibold text-foreground">
              Still waiting on {helperFirstName}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              You haven&rsquo;t heard back yet. Want to send a gentle reminder, or wait a few days?
            </p>
            <form action={sendReminderAction} className="mt-3">
              <input type="hidden" name="requestId" value={askId} />
              <Button type="submit" size="sm" className="rounded-md">
                Send a gentle reminder
              </Button>
            </form>
            <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
              One reminder per ask. On {helperFirstName}&rsquo;s side it simply resurfaces your note
              — it never reads as a complaint.
            </p>
            {helpNeeded ? (
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Or{' '}
                <Link
                  href={`/ask?nl=${encodeURIComponent(helpNeeded)}`}
                  className="font-semibold text-link hover:text-link-hover"
                >
                  ask someone else
                </Link>{' '}
                — your note carries over, nothing to rewrite.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock aria-hidden className="size-3 shrink-0" />A gentle reminder unlocks{' '}
            {shortDate(view.unlockDate)} if you haven&rsquo;t heard back.
          </p>
        )}
      </div>
    </div>
  )
}

function TimelineStep({
  state,
  title,
  detail,
  last = false,
}: {
  state: 'done' | 'current' | 'future'
  title: string
  detail: string
  last?: boolean
}) {
  return (
    <div className="flex gap-3">
      <div className="flex w-4 flex-none flex-col items-center">
        {state === 'done' ? (
          <span className="flex size-4 items-center justify-center rounded-full bg-success-tint">
            <Check aria-hidden className="size-2.5 text-accent-sage" />
          </span>
        ) : state === 'current' ? (
          <span className="flex size-4 items-center justify-center rounded-full border-2 border-primary bg-card">
            <span className="size-1 rounded-full bg-primary" />
          </span>
        ) : (
          <span className="size-4 rounded-full border border-border bg-card" />
        )}
        {!last ? <span aria-hidden className="my-0.5 w-px flex-1 bg-border" /> : null}
      </div>
      <div className={cn('min-w-0', !last && 'pb-3.5')}>
        <p
          className={cn(
            'text-sm font-semibold leading-tight',
            state === 'future' ? 'text-muted-foreground' : 'text-foreground',
          )}
        >
          {title}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{detail}</p>
      </div>
    </div>
  )
}

/** Asker-facing status language — "declined" never faces the asker
 * (voice guidelines § decline copy); the helper keeps the shared badge. */
export function AskerClosedBadge({ status }: { status: 'declined' | 'expired' }) {
  if (status === 'declined') {
    return (
      <StatusBadge tone="alert" size="sm" dot>
        Not this time
      </StatusBadge>
    )
  }
  return (
    <StatusBadge tone="muted" size="sm">
      Closed quietly
    </StatusBadge>
  )
}

export function ClosedAskCopy({
  status,
  helperFirstName,
  declineReason = null,
}: {
  status: 'declined' | 'expired'
  helperFirstName: string
  declineReason?: DeclineReason | null
}) {
  return (
    <p className="text-sm leading-relaxed text-foreground">
      {status === 'declined'
        ? declineCopyForAsker(declineReason, helperFirstName)
        : 'This one closed quietly after two weeks without a reply. Capacity comes and goes — this usually isn’t about your ask.'}
    </p>
  )
}

/**
 * The guilt-free pause offer, shown to a helper right after their second
 * "at capacity" decline in a month. Boundaries without penalty: the date
 * is visible, nobody is told, and "keep them coming" is a fine answer.
 */
export function PauseOfferCard({ askerFirstName }: { askerFirstName: string }) {
  const horizon = explicitPauseHorizon()
  const horizonLabel = format(horizon, 'EEE, MMM d')

  return (
    <div className="rounded-md border border-border bg-surface-panel/40 p-4">
      <p className="flex items-center gap-1.5 text-xs font-medium text-accent-sage">
        <Check aria-hidden className="size-3.5 shrink-0" />
        Done — {askerFirstName} knows, kindly.
      </p>
      <div className="mt-3 border-border border-t pt-3">
        <p className="font-heading text-sm font-semibold text-foreground">Breathing room?</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          That&rsquo;s your second &ldquo;at capacity&rdquo; this month. Want to pause new asks
          until <span className="font-mono font-semibold text-foreground">{horizonLabel}</span>?
          Your profile stays in the circle — new asks just wait until you&rsquo;re back. Unpause
          anytime.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <form action={pauseHelperAction}>
            <Button type="submit" variant="outline" size="sm" className="rounded-md">
              Pause until {format(horizon, 'MMM d')}
            </Button>
          </form>
          <Button asChild variant="ghost" size="sm" className="rounded-md text-muted-foreground">
            <Link href="/inbox">Keep them coming</Link>
          </Button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Pausing is a normal part of being a helper here — nobody is told, and your past
          conversations aren&rsquo;t affected.
        </p>
      </div>
    </div>
  )
}

/**
 * Next-best fit for a closed ask. Async on purpose — it runs the live
 * matcher (two model calls), so the page shell renders immediately and
 * this block streams in behind a skeleton. Rendering nothing on a weak
 * pool is the honest outcome.
 */
export async function AskAlternativeSection({
  organizationId,
  askerId,
  query,
  excludeUserId,
}: {
  organizationId: string
  askerId: string
  query: string
  excludeUserId: string
}) {
  const supabase = await createClient()

  // Anyone the asker already has an ask with is off the table, whatever
  // its state — re-suggesting them would be noise at best.
  const { data: priorAsks } = await supabase
    .from('asks')
    .select('helper_id')
    .eq('asker_id', askerId)
  const exclude = new Set((priorAsks ?? []).map((row) => row.helper_id))
  exclude.add(excludeUserId)

  const hit = await findAskAlternative(supabase, {
    organizationId,
    askerId,
    query,
    excludeUserIds: exclude,
  })
  if (!hit) return null

  const display = displayName(hit.name, hit.preferredName ?? null)
  const firstName = display.split(/\s+/)[0] || display
  if (!isOpenToHelp(hit)) return null
  const role = [hit.currentTitle, hit.currentEmployer].filter(Boolean).join(' at ')

  return (
    <div className="border-border border-t pt-4">
      <p className="bc-card-label">Also a strong fit for this</p>
      <div className="mt-2.5 rounded-md border border-border bg-card p-3.5">
        <div className="flex items-center gap-2.5">
          <PersonAvatar
            userId={hit.userId}
            name={display}
            avatarUrl={hit.avatarUrl}
            shape="square"
            className="size-10 text-sm"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate">
              <Link
                href={`/profile/${hit.userId}`}
                className="font-heading text-sm font-semibold text-foreground hover:text-primary"
              >
                {display}
              </Link>
              {classYearShort(hit.graduationYear) ? (
                <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                  {classYearShort(hit.graduationYear)}
                </span>
              ) : null}
              <StatusBadge tone="open" size="sm" dot className="ml-2">
                Open to help
              </StatusBadge>
            </p>
            {role || hit.city ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {[role || null, hit.city].filter(Boolean).join(' · ')}
              </p>
            ) : null}
          </div>
        </div>
        <RationaleBlock
          label={`Why ${firstName} might fit`}
          labelClassName="text-primary"
          bodyClassName="text-sm leading-relaxed text-foreground"
          className="mt-2.5 rounded-md border border-primary/15 bg-primary/[0.04] p-2.5"
        >
          {hit.rationale ?? 'They are part of your trusted school circle.'}
        </RationaleBlock>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Your note carries over — nothing to rewrite.
          </p>
          <Button asChild size="sm" className="rounded-md">
            <Link href={askComposeHref(hit.userId, query)}>
              Ask {firstName}
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Mirrors AskAlternativeSection's geometry while the matcher runs. */
export function AskAlternativeSkeleton() {
  return (
    <div className="border-border border-t pt-4">
      <Skeleton className="h-3 w-36" />
      <div className="mt-2.5 rounded-md border border-border bg-card p-3.5">
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-10 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
        <div className="mt-2.5 rounded-md border border-primary/15 bg-primary/[0.04] p-2.5">
          <Skeleton className="h-3 w-28 bg-primary/20" />
          <Skeleton className="mt-2 h-3.5 w-11/12" />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>
    </div>
  )
}

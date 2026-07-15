'use client'

import { format, formatDistanceToNowStrict } from 'date-fns'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { HelpAskSummary } from '@/lib/help/contracts'
import { cn } from '@/lib/utils'
import { useMemberShellHeader } from '../../member-shell-header-context'
import { askStatusLabel, closingSoonDays, isCurrentAsk } from './ask-presentation'
import { useHelpRealtimeRefresh } from './use-help-realtime-refresh'

export function AskHistoryView({
  asks,
  activeAskCount,
  activeAskLimit,
  organizationName,
  olderHref,
  paged,
}: {
  asks: HelpAskSummary[]
  activeAskCount: number
  activeAskLimit: number
  organizationName: string
  olderHref: string | null
  paged: boolean
}) {
  useMemberShellHeader({
    title: 'Your asks',
    meta: `${activeAskCount} of ${activeAskLimit} open`,
    backHref: '/help',
    backLabel: 'Back to Help',
    hideNotifications: true,
  })
  useHelpRealtimeRefresh()

  const current = asks.filter(isCurrentAsk)
  const history = asks.filter((ask) => !isCurrentAsk(ask))

  return (
    <div className="min-h-full bg-[image:var(--wash-page)]">
      <div className="mx-auto w-full max-w-[732px] px-4 py-7 sm:px-6.5 sm:pb-10">
        <AskSection
          title="Open"
          helper="slots return when an ask ends"
          asks={current}
          organizationName={organizationName}
          current
          emptyTitle="No current asks"
          emptyBody="When you ask a person or the circle, its status will stay easy to find here."
        />

        <div className="mt-7">
          <AskSection
            title="History"
            helper="reachable, never nagging"
            asks={history}
            organizationName={organizationName}
            emptyTitle="Nothing has ended yet"
            emptyBody="Resolved, retracted, and quietly closed asks will remain reachable here."
          />
        </div>

        {olderHref || paged ? (
          <nav
            aria-label="Ask history pages"
            className="mt-5 flex items-center justify-center gap-2"
          >
            {paged ? (
              <Link
                href="/help/asks"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-card px-4 text-xs font-bold text-[var(--text-secondary)] shadow-[var(--ring-outline)] hover:bg-[var(--surface-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                Back to newest
              </Link>
            ) : null}
            {olderHref ? (
              <Link
                href={olderHref}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-card px-4 text-xs font-bold text-[var(--text-secondary)] shadow-[var(--ring-outline)] hover:bg-[var(--surface-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                View older asks
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>
    </div>
  )
}

function AskSection({
  title,
  helper,
  asks,
  organizationName,
  current = false,
  emptyTitle,
  emptyBody,
}: {
  title: string
  helper: string
  asks: HelpAskSummary[]
  organizationName: string
  current?: boolean
  emptyTitle: string
  emptyBody: string
}) {
  return (
    <section aria-labelledby={`${title.toLowerCase()}-asks-title`}>
      <div className="mb-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h1
          id={`${title.toLowerCase()}-asks-title`}
          className="text-body-lg font-extrabold tracking-tight text-[var(--text-primary)]"
        >
          {title}
        </h1>
        <p className="text-xs font-semibold text-[var(--text-faint)]">{helper}</p>
      </div>
      {asks.length > 0 ? (
        <div className="overflow-hidden rounded-[18px] bg-[image:var(--surface-card-elevated)] shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]">
          {asks.map((ask) => (
            <AskRow key={ask.id} ask={ask} organizationName={organizationName} current={current} />
          ))}
        </div>
      ) : (
        <div className="rounded-[18px] bg-[image:var(--surface-card-elevated)] px-5 py-7 text-center shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]">
          <p className="text-sm font-bold text-[var(--text-primary)]">{emptyTitle}</p>
          <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed font-medium text-[var(--text-faint)]">
            {emptyBody}
          </p>
        </div>
      )}
    </section>
  )
}

function AskRow({
  ask,
  organizationName,
  current,
}: {
  ask: HelpAskSummary
  organizationName: string
  current: boolean
}) {
  const closingDays = closingSoonDays(ask)
  return (
    <Link
      href={`/help/asks/${ask.id}`}
      className="group flex min-h-[70px] items-center gap-3 border-t border-[var(--divider-row)] px-4 py-3 text-inherit first:border-t-0 hover:bg-[var(--row-hover)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring sm:px-5"
    >
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          <strong
            className={cn(
              'min-w-0 text-body-sm leading-snug text-[var(--text-primary)] sm:truncate',
              current ? 'font-bold' : 'font-semibold text-[var(--text-secondary)]',
            )}
          >
            {ask.question}
          </strong>
          <AskStatusPill ask={ask} closingDays={closingDays} />
        </span>
        <span className="mt-1 block text-xs leading-relaxed font-medium text-[var(--text-faint)]">
          {askMeta(ask, organizationName, current)}
        </span>
      </span>
      <ChevronRight
        aria-hidden
        className="size-4 shrink-0 text-[var(--grey-400)] transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
      />
    </Link>
  )
}

function AskStatusPill({ ask, closingDays }: { ask: HelpAskSummary; closingDays: number | null }) {
  const positive = ask.status === 'accepted' || ask.status === 'resolved'
  const blue = ask.status === 'open' && ask.offerCount > 0
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2 py-0.5 text-kicker font-bold',
        closingDays !== null && 'bg-[var(--closing-soon-tint)] text-[var(--closing-soon-text)]',
        closingDays === null && positive && 'bg-[var(--give-tint)] text-[var(--action-give-text)]',
        closingDays === null && blue && 'bg-[var(--blue-50)] text-[var(--blue-600)]',
        closingDays === null &&
          !positive &&
          !blue &&
          'bg-[var(--surface-subtle)] text-[var(--text-secondary)]',
      )}
    >
      {closingDays === null
        ? askStatusLabel(ask.status, ask.offerCount)
        : `Closes in ${closingDays}d`}
    </span>
  )
}

function askMeta(ask: HelpAskSummary, organizationName: string, current: boolean) {
  if (!current) {
    const month = format(new Date(ask.endedAt ?? ask.createdAt), 'MMMM')
    if (ask.status === 'resolved') return `Resolved · ${month}`
    if (ask.status === 'retracted') return `You retracted this · ${month}`
    return `Closed after 14 days · ${month}`
  }

  const sent = formatDistanceToNowStrict(new Date(ask.createdAt), { addSuffix: true })
  if (ask.kind === 'direct') {
    return `To ${ask.recipient?.displayName ?? 'a member'} · sent ${sent}`
  }
  const reach =
    ask.offerCount > 0
      ? `${ask.offerCount} ${ask.offerCount === 1 ? 'offer' : 'offers'}`
      : `Asked the ${organizationName} circle`
  return `${reach} · sent ${sent}`
}

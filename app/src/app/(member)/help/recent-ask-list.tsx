import { formatDistanceToNowStrict } from 'date-fns'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/status-badge'
import type { HelpAskStatus, HelpAskSummary } from '@/lib/help/contracts'

export function RecentAskList({
  asks,
  activeAskCount,
  activeAskLimit,
}: {
  asks: HelpAskSummary[]
  activeAskCount: number
  activeAskLimit: number
}) {
  return (
    <section aria-labelledby="your-asks-title">
      <div className="mb-2.5 flex items-center gap-2">
        <h2 id="your-asks-title" className="text-body-lg font-bold text-[var(--text-primary)]">
          Your asks
        </h2>
        <span className="text-xs font-semibold text-[var(--text-faint)]">
          {activeAskCount} of {activeAskLimit} open
        </span>
        <Link
          href="/help/asks"
          className="ml-auto rounded-md px-2 py-1 text-xs font-bold text-[var(--action-primary)] hover:bg-[var(--action-weak)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          See all <span aria-hidden>→</span>
        </Link>
      </div>

      {asks.length > 0 ? (
        <div className="overflow-hidden rounded-[var(--radius-large)] bg-card shadow-[var(--ring-card),var(--shadow-card)]">
          {asks.map((ask) => (
            <Link
              key={ask.id}
              href={`/help/asks/${ask.id}`}
              className="group flex min-h-16 items-center gap-3 border-t border-[var(--divider-row)] px-4 py-3 text-inherit first:border-t-0 hover:bg-[var(--row-hover)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring sm:px-5"
            >
              <span className="min-w-0 flex-1">
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="min-w-0 truncate text-body-sm font-bold text-[var(--text-primary)] sm:text-sm">
                    {ask.question}
                  </span>
                  <AskStatus status={ask.status} expiresAt={ask.expiresAt} />
                </span>
                <span className="mt-1 block text-xs font-medium text-[var(--text-faint)]">
                  {ask.kind === 'direct'
                    ? ask.recipient
                      ? `To ${ask.recipient.displayName}`
                      : 'Direct ask'
                    : ask.offerCount > 0
                      ? `${ask.offerCount} ${ask.offerCount === 1 ? 'offer' : 'offers'}`
                      : 'Asked the circle'}{' '}
                  · sent {formatDistanceToNowStrict(new Date(ask.createdAt), { addSuffix: true })}
                </span>
              </span>
              <ChevronRight
                aria-hidden
                className="size-4 shrink-0 text-[var(--grey-400)] transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-[var(--radius-large)] bg-card px-5 py-8 text-center shadow-[var(--ring-card),var(--shadow-card)]">
          <p className="text-sm font-bold text-[var(--text-primary)]">No asks yet</p>
          <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed font-medium text-[var(--text-faint)]">
            Start with the question above. You choose a person or the circle before anything is
            sent.
          </p>
        </div>
      )}
    </section>
  )
}

function AskStatus({ status, expiresAt }: { status: HelpAskStatus; expiresAt: string }) {
  const closingDays = daysUntil(expiresAt)
  if ((status === 'waiting' || status === 'open') && closingDays >= 0 && closingDays <= 3) {
    return (
      <StatusBadge
        size="sm"
        tone="muted"
        className="bg-[var(--closing-soon-tint)] text-[var(--closing-soon-text)]"
      >
        Closes in {closingDays}d
      </StatusBadge>
    )
  }

  const label: Record<HelpAskStatus, string> = {
    waiting: 'Waiting',
    open: 'Open',
    accepted: 'Accepted',
    declined: 'Declined',
    retracted: 'Retracted',
    resolved: 'Resolved',
    closed: 'Closed',
  }
  const positive = status === 'accepted' || status === 'resolved'
  const active = status === 'open'
  return (
    <StatusBadge size="sm" tone={positive ? 'open' : active ? 'info' : 'muted'}>
      {label[status]}
    </StatusBadge>
  )
}

function daysUntil(timestamp: string) {
  return Math.max(0, Math.ceil((Date.parse(timestamp) - Date.now()) / 86_400_000))
}

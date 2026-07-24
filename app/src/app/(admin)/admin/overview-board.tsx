import {
  CalendarDays,
  ChevronRight,
  CircleCheck,
  Flag,
  HandHeart,
  HelpCircle,
  type LucideIcon,
  MailPlus,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { QuietNote } from '@/components/ui/quiet-note'
import type { AdminOverview, AdminOverviewResult } from '@/lib/admin/contracts'
import { type AttentionKey, daysWaiting, isAllClear, openAttention } from '@/lib/admin/overview'
import { cn } from '@/lib/utils'

type AttentionRow = {
  icon: LucideIcon
  label: string
  /** Where the queue gets resolved. quietAsks has none — asks stay private. */
  href: string | null
}

const ATTENTION_ROWS: Record<AttentionKey, AttentionRow> = {
  reports: { icon: Flag, label: 'Reports waiting for review', href: '/admin/reports' },
  approvals: { icon: UserCheck, label: 'Membership requests waiting', href: '/admin/approvals' },
  staleInvites: {
    icon: MailPlus,
    label: 'Invites with no reply for two weeks',
    href: '/admin/invite',
  },
  quietAsks: { icon: HelpCircle, label: 'Asks waiting three days or more', href: null },
  quietNewMembers: {
    icon: UserPlus,
    label: 'New members who haven’t said what they do',
    href: '/admin/members',
  },
}

const cardClass =
  'rounded-[var(--radius-large)] bg-card shadow-[var(--ring-card),var(--shadow-card)]'

export function OverviewBoard({
  result,
  organizationName,
}: {
  result: AdminOverviewResult
  organizationName: string
}) {
  if (!result.ok) {
    return (
      <p
        className={cn(
          cardClass,
          'px-5 py-8 text-center text-sm font-medium text-[var(--text-muted)]',
        )}
      >
        The overview couldn’t load. Refresh to try again.
      </p>
    )
  }
  const { overview } = result

  return (
    <div className="space-y-4">
      <AttentionCard overview={overview} />
      <PulseCard overview={overview} organizationName={organizationName} />
    </div>
  )
}

function AttentionCard({ overview }: { overview: AdminOverview }) {
  const open = openAttention(overview)
  const now = new Date()

  return (
    <section aria-labelledby="overview-attention" className={cn(cardClass, 'px-5 py-4')}>
      <h2 id="overview-attention" className="text-sm font-bold text-[var(--text-primary)]">
        Waiting on you
      </h2>
      {isAllClear(overview) ? (
        <div className="flex items-center gap-3 py-5">
          <CircleCheck aria-hidden className="size-5 shrink-0 text-[var(--positive-text)]" />
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Nothing is waiting on you.
            </p>
            <p className="mt-0.5 text-xs font-medium text-[var(--text-muted)]">
              Requests, reports, and invites are all handled.
            </p>
          </div>
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-border-subtle">
          {open.map((key) => (
            <AttentionRowItem
              key={key}
              row={ATTENTION_ROWS[key]}
              count={overview.attention[key].count}
              waitedDays={
                key === 'quietNewMembers'
                  ? null
                  : daysWaiting(overview.attention[key].oldestAt ?? null, now)
              }
            />
          ))}
        </ul>
      )}
      {overview.attention.quietAsks.count > 0 ? (
        <QuietNote className="mt-2">
          Asks are counted, never read — what members ask stays between them.
        </QuietNote>
      ) : null}
    </section>
  )
}

function AttentionRowItem({
  row,
  count,
  waitedDays,
}: {
  row: AttentionRow
  count: number
  waitedDays: number | null
}) {
  const Icon = row.icon
  const body = (
    <>
      <Icon aria-hidden className="size-4 shrink-0 text-[var(--icon-muted)]" strokeWidth={1.9} />
      <span className="min-w-0 flex-1 text-sm font-semibold text-[var(--text-primary)]">
        {row.label}
      </span>
      {waitedDays !== null && waitedDays >= 1 ? (
        <span className="hidden text-xs font-medium text-[var(--text-muted)] sm:inline">
          oldest waited {waitedDays === 1 ? 'a day' : `${waitedDays} days`}
        </span>
      ) : null}
      <span className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--closing-soon-tint)] px-1.5 text-fine font-bold text-[var(--closing-soon-text)] tabular-nums">
        {count > 99 ? '99+' : count}
      </span>
    </>
  )

  if (!row.href) {
    return <li className="flex min-h-11 items-center gap-3 py-1.5">{body}</li>
  }
  return (
    <li>
      <Link
        href={row.href}
        className="bc-motion-control -mx-2 flex min-h-11 items-center gap-3 rounded-[var(--radius-box)] px-2 py-1.5 hover:bg-[var(--hover-tint)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring"
      >
        {body}
        <ChevronRight aria-hidden className="size-4 shrink-0 text-[var(--icon-muted)]" />
      </Link>
    </li>
  )
}

function PulseCard({
  overview,
  organizationName,
}: {
  overview: AdminOverview
  organizationName: string
}) {
  const { pulse } = overview

  return (
    <section aria-labelledby="overview-pulse" className={cn(cardClass, 'px-5 py-4')}>
      <h2 id="overview-pulse" className="text-sm font-bold text-[var(--text-primary)]">
        How {organizationName} is doing
      </h2>
      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <PulseStat icon={Users} label="Active members" value={pulse.activeMembers} />
        <PulseStat icon={HandHeart} label="Open to help" value={pulse.openToHelp} />
        <PulseStat
          icon={HelpCircle}
          label="Asks · 30 days"
          value={pulse.asksLast30}
          hint={
            pulse.asksLast30 > 0 ? `${pulse.heardBackLast30} heard back` : 'none yet this month'
          }
        />
        <PulseStat icon={UserPlus} label="New members · 30 days" value={pulse.newMembersLast30} />
      </dl>
      <div className="mt-3 border-t border-border-subtle pt-3">
        {pulse.nextEvent ? (
          <Link
            href="/admin/events"
            className="bc-motion-control -mx-2 flex min-h-11 items-center gap-3 rounded-[var(--radius-box)] px-2 py-1.5 hover:bg-[var(--hover-tint)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring"
          >
            <CalendarDays
              aria-hidden
              className="size-4 shrink-0 text-[var(--icon-muted)]"
              strokeWidth={1.9}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">
                {pulse.nextEvent.title}
              </span>
              <span className="block text-xs font-medium text-[var(--text-muted)]">
                {formatEventStart(pulse.nextEvent.startsAt)} ·{' '}
                {pulse.nextEvent.goingCount === 1
                  ? '1 person going'
                  : `${pulse.nextEvent.goingCount} people going`}
              </span>
            </span>
            <ChevronRight aria-hidden className="size-4 shrink-0 text-[var(--icon-muted)]" />
          </Link>
        ) : (
          <p className="flex min-h-11 items-center gap-3 text-sm font-medium text-[var(--text-muted)]">
            <CalendarDays aria-hidden className="size-4 shrink-0" strokeWidth={1.9} />
            No upcoming events on the calendar.
          </p>
        )}
      </div>
    </section>
  )
}

function PulseStat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon
  label: string
  value: number
  hint?: string
}) {
  return (
    <div className="rounded-[var(--radius-box)] bg-[var(--surface-canvas)] px-3 py-2.5">
      <dt className="flex items-center gap-1.5 text-fine font-bold tracking-label text-[var(--text-faint)] uppercase">
        <Icon aria-hidden className="size-3.5" strokeWidth={1.9} />
        {label}
      </dt>
      <dd className="mt-1 text-display-md font-bold text-[var(--text-primary)] tabular-nums">
        {value}
        {hint ? (
          <span className="mt-0.5 block text-xs leading-snug font-medium text-[var(--text-muted)] normal-case tabular-nums">
            {hint}
          </span>
        ) : null}
      </dd>
    </div>
  )
}

function formatEventStart(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

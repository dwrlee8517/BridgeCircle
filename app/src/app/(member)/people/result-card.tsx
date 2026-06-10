'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusBadge, type StatusBadgeProps } from '@/components/ui/status-badge'
import { avatarColorClasses, cn, displayName } from '@/lib/utils'

export type ResultCardProps = {
  userId: string
  name: string | null
  preferredName: string | null
  headline: string | null
  currentEmployer: string | null
  currentTitle: string | null
  city: string | null
  university: string | null
  major: string | null
  graduationYear: number | null
  avatarUrl: string | null
  isOpenAsMentor: boolean
  isOpenAsAdviceHelper: boolean
  mentorPaused: boolean
  mentoringTopics: string[] | null
  isFriend: boolean
  rationale: string | null
  rerankScore: number | null
  topCareerEntry: { employer: string; title: string; dates: string } | null
  density?: 'comfortable' | 'compact'
  maxActiveMentees?: number
  maxPendingRequests?: number
  activeMenteeCount?: number
  pendingRequestCount?: number
}

export function ResultCard(props: ResultCardProps) {
  const display = displayName(props.name, props.preferredName)
  const firstName = getActionName(display)
  const initials = display
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const yearShort = props.graduationYear ? `'${`${props.graduationYear}`.slice(-2)}` : null
  const avatarColorClass = avatarColorClasses(props.userId)
  const activeCount = props.activeMenteeCount ?? 0
  const maxActive = props.maxActiveMentees ?? 5
  const remaining = Math.max(0, maxActive - activeCount)
  const status = getStatus(props)
  const isOpen = props.isOpenAsAdviceHelper || props.isOpenAsMentor
  const askType = props.isOpenAsAdviceHelper ? 'advice' : 'mentorship'
  // System rationale renders as plain text; only the member's own headline
  // earns the pull-quote treatment.
  const systemRationale = props.rationale
  const humanHeadline = !props.rationale ? props.headline : null
  const topics = props.mentoringTopics?.slice(0, 3) ?? []

  return (
    <Card
      data-interactive="true"
      className="group relative overflow-hidden rounded-md border-border bg-card px-3.5 py-3.5 shadow-card transition-[border-color,box-shadow,transform] duration-base ease-emphasized hover:-translate-y-px hover:border-foreground/25 hover:shadow-card-hover md:px-[22px] md:py-[18px]"
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-x-5">
        <Link href={`/profile/${props.userId}`} className="row-start-1 shrink-0">
          <PersonAvatar
            avatarUrl={props.avatarUrl}
            initials={initials}
            avatarColorClass={avatarColorClass}
          />
        </Link>

        <Link href={`/profile/${props.userId}`} className="min-w-0">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <h3 className="font-heading text-base font-semibold text-foreground md:text-lg">
                {display}
              </h3>
              {yearShort ? (
                <span className="font-mono text-xs font-medium text-muted-foreground">
                  {yearShort}
                </span>
              ) : null}
              {props.rerankScore !== null ? <MatchBadge score={props.rerankScore} /> : null}
              {props.isFriend ? (
                <StatusBadge tone="info" dot size="sm">
                  Friend
                </StatusBadge>
              ) : null}
            </div>

            <p className="mt-1 text-[13px] font-medium leading-snug text-foreground">
              {[props.currentTitle, props.currentEmployer].filter(Boolean).join(' · ') ||
                'No role listed'}
              <span className="ml-0 block text-xs font-normal text-muted-foreground sm:ml-2 sm:inline">
                {[props.city, props.university, yearShort ? `Class ${yearShort}` : null]
                  .filter(Boolean)
                  .join(' · ') || 'No location listed'}
              </span>
            </p>

            {systemRationale ? (
              <p className="mt-3 max-w-[720px] text-[13px] leading-relaxed text-muted-foreground">
                {systemRationale}
              </p>
            ) : humanHeadline ? (
              <p className="bc-pull-quote mt-3 max-w-[720px] py-0 pl-3 text-[13px] italic leading-relaxed text-foreground">
                &ldquo;{humanHeadline}&rdquo;
              </p>
            ) : null}

            {topics.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {topics.map((topic) => (
                  <span
                    key={topic}
                    className="inline-flex items-center rounded-full border border-border bg-surface-panel px-2.5 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </Link>

        <div className="col-span-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3 md:col-span-1 md:col-start-3 md:row-start-1 md:min-w-[170px] md:flex-col md:items-end md:justify-center md:border-t-0 md:pt-0">
          <StatusBadge tone={status.tone} dot={status.dot} size="sm">
            {status.label}
          </StatusBadge>

          {props.isOpenAsMentor ? (
            <p className="text-xs text-muted-foreground md:text-right">
              {remaining > 0
                ? `Can take ${remaining} more ${remaining === 1 ? 'conversation' : 'conversations'}`
                : 'At capacity right now'}
            </p>
          ) : null}

          <div className="flex gap-1.5">
            <Button asChild variant="outline" size="sm" className="h-8 rounded-md px-3 text-xs">
              <Link href={`/profile/${props.userId}`}>View</Link>
            </Button>
            {isOpen ? (
              <Button asChild variant="default" size="sm" className="h-8 rounded-md px-3 text-xs">
                <Link href={`/ask/new?to=${props.userId}&type=${askType}`}>Ask {firstName}</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  )
}

function PersonAvatar({
  avatarUrl,
  initials,
  avatarColorClass,
}: {
  avatarUrl: string | null
  initials: string
  avatarColorClass: string
}) {
  return (
    <div
      className={cn(
        'relative size-[52px] shrink-0 overflow-hidden rounded-full shadow-card md:size-[72px]',
        avatarUrl ? '' : avatarColorClass,
      )}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt=""
          fill
          sizes="(min-width: 768px) 72px, 52px"
          unoptimized
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <span className="font-heading flex size-full items-center justify-center text-sm font-semibold md:text-lg">
          {initials}
        </span>
      )}
    </div>
  )
}

function MatchBadge({ score }: { score: number }) {
  // Same bands + wording as the Ask results cards (help-network-ui) so fit
  // language reads identically across surfaces. Raw percentages stay internal.
  const tier = score >= 85 ? 'strong' : score >= 65 ? 'good' : 'possible'
  const label = tier === 'strong' ? 'Strong fit' : tier === 'good' ? 'Good fit' : 'Worth exploring'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold',
        tier === 'strong' && 'border-success-tint bg-success-tint text-state-success-foreground',
        tier === 'good' && 'border-primary/20 bg-primary-tint text-primary',
        tier === 'possible' && 'border-border bg-surface-subtle text-muted-foreground',
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          tier === 'strong' && 'bg-state-success',
          tier === 'good' && 'bg-primary',
          tier === 'possible' && 'bg-muted-foreground',
        )}
        aria-hidden
      />
      {label}
    </span>
  )
}

function getStatus(props: ResultCardProps): {
  label: string
  tone: NonNullable<StatusBadgeProps['tone']>
  dot: boolean
} {
  if (props.isOpenAsMentor) return { label: 'Open as mentor', tone: 'open', dot: false }
  if (props.isOpenAsAdviceHelper) return { label: 'Open for advice', tone: 'open', dot: true }
  if (props.mentorPaused) return { label: 'Paused', tone: 'warn', dot: true }
  return { label: 'Not open now', tone: 'muted', dot: false }
}

function getActionName(display: string) {
  const parts = display.split(/\s+/).filter(Boolean)
  const [first, second] = parts
  if (first && second && /^(dr|mr|ms|mrs|prof)\.?$/i.test(first)) return second
  return first ?? 'them'
}

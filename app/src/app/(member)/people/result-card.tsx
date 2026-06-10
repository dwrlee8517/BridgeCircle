'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  MatchBandBadge,
  PersonAvatar,
  RationaleBlock,
  TopicChips,
} from '@/components/ui/person-card'
import { StatusBadge, type StatusBadgeProps } from '@/components/ui/status-badge'
import { askComposeHref, classYearShort, displayName, preferredAskType } from '@/lib/utils'

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
  const yearShort = classYearShort(props.graduationYear)
  const activeCount = props.activeMenteeCount ?? 0
  const maxActive = props.maxActiveMentees ?? 5
  const remaining = Math.max(0, maxActive - activeCount)
  const status = getStatus(props)
  const askType = preferredAskType(props)
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
            userId={props.userId}
            name={display}
            avatarUrl={props.avatarUrl}
            className="size-[52px] text-sm shadow-card md:size-[72px] md:text-lg"
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
              {props.rerankScore !== null ? <MatchBandBadge score={props.rerankScore} /> : null}
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
              <RationaleBlock className="mt-3 max-w-[720px]" bodyClassName="text-[13px]">
                {systemRationale}
              </RationaleBlock>
            ) : humanHeadline ? (
              <RationaleBlock
                label={null}
                human
                className="mt-3 max-w-[720px]"
                bodyClassName="text-[13px] text-foreground"
              >
                {humanHeadline}
              </RationaleBlock>
            ) : null}

            <TopicChips topics={topics} className="mt-3" />
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
            {askType ? (
              <Button asChild variant="default" size="sm" className="h-8 rounded-md px-3 text-xs">
                <Link href={askComposeHref(props.userId, askType)}>Ask {firstName}</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
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

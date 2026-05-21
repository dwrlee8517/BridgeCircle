'use client'

import { ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CapacityIndicatorGauge } from '@/components/ui/capacity-gauge'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn, displayName } from '@/lib/utils'
import { useDensity } from './people-search-surface'

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

/**
 * V3+ profile card — dense layout with editorial bio pull-quote.
 * Charcoal photo placeholder w/ initials, Fraunces name, sapphire-rule italic
 * bio (the headline), year + mentor pills, and a collapsible rationale panel
 * for NL search results.
 */
export function ResultCard(props: ResultCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const hasRationale = props.rationale !== null
  const { density: contextDensity } = useDensity()
  const density = props.density ?? contextDensity ?? 'comfortable'
  const display = displayName(props.name, props.preferredName)

  const initials = display
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const yearShort = props.graduationYear ? `'${`${props.graduationYear}`.slice(-2)}` : null
  const roleLine = [props.currentTitle, props.currentEmployer].filter(Boolean)
  const metaParts: string[] = []
  if (props.city) metaParts.push(props.city)
  if (props.university) {
    if (props.major) {
      metaParts.push(`${props.university} (${props.major})`)
    } else {
      metaParts.push(props.university)
    }
  } else if (props.major) {
    metaParts.push(props.major)
  }
  const metaLine = metaParts.join(' · ')

  const activeCount = props.activeMenteeCount ?? 0
  const maxActive = props.maxActiveMentees ?? 5
  const pendingCount = props.pendingRequestCount ?? 0
  const activeRatio = maxActive > 0 ? activeCount / maxActive : 0

  const getCapacityColorClass = (ratio: number) => {
    if (ratio <= 0.5) return 'bg-emerald-500'
    if (ratio <= 0.85) return 'bg-orange-500'
    return 'bg-destructive'
  }
  const capacityColorClass = getCapacityColorClass(activeRatio)

  if (density === 'compact') {
    return (
      <Card className="group p-3 transition-all hover:border-primary/60 hover:shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0 w-full">
          {/* Left section: Avatar & Name/Cohort */}
          <Link
            href={`/profile/${props.userId}`}
            className="flex items-center gap-3 min-w-0 sm:w-[240px] shrink-0"
          >
            {/* Photo placeholder (smaller, 36px) */}
            <div className="relative size-9 shrink-0 overflow-hidden rounded-md bg-[linear-gradient(135deg,#1e293b_0%,#3f465c_100%)]">
              {props.avatarUrl ? (
                <Image
                  src={props.avatarUrl}
                  alt=""
                  fill
                  sizes="36px"
                  unoptimized
                  className="absolute inset-0 size-full object-cover"
                />
              ) : (
                <>
                  <div
                    aria-hidden
                    className="absolute inset-0 opacity-50"
                    style={{
                      backgroundImage:
                        'radial-gradient(rgba(255,255,255,.12) 1px, transparent 1px)',
                      backgroundSize: '6px 6px',
                    }}
                  />
                  <span className="bc-fraunces relative flex size-full items-center justify-center text-xs font-bold text-white">
                    {initials}
                  </span>
                </>
              )}
              {props.isOpenAsMentor ? (
                <span
                  aria-hidden
                  className={cn(
                    'absolute right-0.5 bottom-0.5 size-2 rounded-full ring-1 ring-white',
                    capacityColorClass,
                  )}
                />
              ) : null}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="bc-fraunces truncate text-sm font-semibold text-foreground">
                  {display}
                </h3>
                {yearShort ? (
                  <span className="text-[10px] font-mono text-muted-foreground">{yearShort}</span>
                ) : null}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {props.isFriend ? (
                  <span className="inline-flex items-center rounded-full px-1.5 py-0.2 text-[9px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                    Friend
                  </span>
                ) : null}
                {props.isOpenAsMentor ? (
                  <div className="relative group inline-block cursor-help">
                    <span className="inline-flex items-center rounded-full px-1.5 py-0.2 text-[9px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                      <span
                        className={cn('inline-block size-1 rounded-full mr-1', capacityColorClass)}
                      />
                      Mentor
                    </span>
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-zinc-950 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 text-[10px] font-mono rounded border border-zinc-800 px-2 py-1 shadow-md whitespace-nowrap z-50">
                      Capacity: {activeCount}/{maxActive} active ({pendingCount} pending)
                    </div>
                  </div>
                ) : props.isOpenAsAdviceHelper ? (
                  <span className="inline-flex items-center rounded-full px-1.5 py-0.2 text-[9px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                    Advice
                  </span>
                ) : null}
              </div>
            </div>
          </Link>

          {/* Center: Role & Company */}
          <Link href={`/profile/${props.userId}`} className="min-w-0 flex-1">
            {roleLine.length > 0 ? (
              <p className="truncate text-xs font-medium text-foreground">
                {props.currentTitle ? <span>{props.currentTitle}</span> : null}
                {props.currentTitle && props.currentEmployer ? <span> at </span> : null}
                {props.currentEmployer ? (
                  <span className="font-semibold">{props.currentEmployer}</span>
                ) : null}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground italic">No employment listed</p>
            )}
            {props.city && <p className="text-[10px] text-muted-foreground mt-0.5">{props.city}</p>}
          </Link>

          {/* Tags (Up to 1 or 2 small tags) */}
          <div className="hidden md:flex items-center gap-1 w-[160px] shrink-0 overflow-hidden">
            {props.mentoringTopics && props.mentoringTopics.length > 0
              ? props.mentoringTopics.slice(0, 1).map((topic) => (
                  <Badge
                    key={topic}
                    variant="secondary"
                    className="bg-muted text-[10px] text-muted-foreground px-1.5 py-0.5 truncate max-w-full"
                  >
                    {topic}
                  </Badge>
                ))
              : null}
          </div>

          {/* Bandwidth column */}
          <div className="hidden lg:block w-[110px] shrink-0">
            {props.isOpenAsMentor ? (
              <CapacityIndicatorGauge
                activeCount={props.activeMenteeCount ?? 0}
                maxActive={props.maxActiveMentees ?? 5}
                pendingCount={props.pendingRequestCount ?? 0}
                maxPending={props.maxPendingRequests ?? 10}
                isCompact={true}
              />
            ) : (
              <span className="text-[10px] font-mono text-muted-foreground">—</span>
            )}
          </div>

          {/* Right section: Match Badge, Actions */}
          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
            {hasRationale && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="font-mono text-[10px] font-semibold text-primary hover:underline bg-primary/5 hover:bg-primary/10 rounded px-2 py-1 border border-primary/20 shrink-0"
                  >
                    {props.rerankScore !== null ? `${props.rerankScore}% MATCH` : 'MATCH DETAIL'}
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md border-border font-sans">
                  <DialogHeader className="border-b pb-3 border-border">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-primary">
                      Claude Re-Rank Match Analysis
                    </span>
                    <DialogTitle className="bc-fraunces text-xl font-bold mt-1">
                      Why {display} is a Match
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4 text-sm">
                    <p className="bc-pull-quote text-[14px] leading-relaxed text-foreground italic border-l-2 border-primary pl-3.5 py-1">
                      &ldquo;{props.rationale}&rdquo;
                    </p>
                    {props.topCareerEntry ? (
                      <p className="text-xs text-muted-foreground">
                        Most relevant role:{' '}
                        <span className="font-medium text-foreground">
                          {props.topCareerEntry.title}
                        </span>{' '}
                        at {props.topCareerEntry.employer}{' '}
                        <span className="text-muted-foreground">
                          ({props.topCareerEntry.dates})
                        </span>
                      </p>
                    ) : null}
                    {props.rerankScore !== null ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t">
                        <span>Match Relevance Score:</span>
                        <Badge variant="secondary" className="font-mono">
                          {props.rerankScore}% Match
                        </Badge>
                      </div>
                    ) : null}
                  </div>
                  <DialogFooter showCloseButton />
                </DialogContent>
              </Dialog>
            )}

            <div className="flex items-center gap-1.5">
              {props.isOpenAsMentor ? (
                <Button asChild size="sm" className="h-7 text-xs px-2.5">
                  <Link href={`/ask/new?to=${props.userId}&type=mentorship`}>Mentor</Link>
                </Button>
              ) : props.isOpenAsAdviceHelper ? (
                <Button asChild size="sm" variant="outline" className="h-7 text-xs px-2.5">
                  <Link href={`/ask/new?to=${props.userId}&type=advice`}>Advice</Link>
                </Button>
              ) : (
                <Button asChild size="sm" variant="ghost" className="h-7 text-xs px-2.5">
                  <Link href={`/profile/${props.userId}`}>View</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    )
  }
  // Default / Comfortable density card layout (V4 High-Density Inline Columns)
  return (
    <Card className="group p-4 transition-all hover:border-primary/60 hover:shadow-sm">
      <Link href={`/profile/${props.userId}`} className="block">
        <div className="flex gap-3">
          {/* Photo placeholder — charcoal gradient with initials, dot grid, availability dot */}
          <div className="relative size-[52px] shrink-0 overflow-hidden rounded-[8px] bg-[linear-gradient(135deg,#1e293b_0%,#3f465c_100%)]">
            {props.avatarUrl ? (
              <Image
                src={props.avatarUrl}
                alt=""
                fill
                sizes="52px"
                unoptimized
                className="absolute inset-0 size-full object-cover"
              />
            ) : (
              <>
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-50"
                  style={{
                    backgroundImage: 'radial-gradient(rgba(255,255,255,.12) 1px, transparent 1px)',
                    backgroundSize: '8px 8px',
                  }}
                />
                <span className="bc-fraunces relative flex size-full items-center justify-center text-lg font-bold text-white">
                  {initials}
                </span>
              </>
            )}
            {props.isOpenAsMentor ? (
              <span
                aria-hidden
                className={cn(
                  'absolute right-0.5 bottom-0.5 size-2.5 rounded-full ring-1 ring-white',
                  capacityColorClass,
                )}
              />
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <h3 className="bc-fraunces truncate text-base font-semibold text-foreground">
                  {display}
                </h3>
                {yearShort ? (
                  <span className="text-[10px] font-mono text-muted-foreground">{yearShort}</span>
                ) : null}
                <div className="flex items-center gap-1 shrink-0">
                  {props.isFriend ? (
                    <StatusBadge tone="info" dot className="h-4 px-1.5 text-[9px]">
                      Friend
                    </StatusBadge>
                  ) : null}
                  {props.isOpenAsMentor ? (
                    <div className="relative group inline-block cursor-help">
                      <StatusBadge tone="open" className="h-4 px-1.5 text-[9px]">
                        <span
                          className={cn(
                            'inline-block size-1 rounded-full mr-1',
                            capacityColorClass,
                          )}
                        />
                        Mentor
                      </StatusBadge>
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-zinc-950 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 text-[10px] font-mono rounded border border-zinc-800 px-2 py-1 shadow-md whitespace-nowrap z-50">
                        Capacity: {activeCount}/{maxActive} active ({pendingCount} pending)
                      </div>
                    </div>
                  ) : props.isOpenAsAdviceHelper ? (
                    <StatusBadge tone="open" dot className="h-4 px-1.5 text-[9px]">
                      Advice
                    </StatusBadge>
                  ) : props.mentorPaused ? (
                    <StatusBadge tone="warn" dot className="h-4 px-1.5 text-[9px]">
                      Paused
                    </StatusBadge>
                  ) : null}
                </div>
              </div>
              {props.rerankScore !== null ? (
                <Badge variant="secondary" className="shrink-0 font-mono text-[10px] px-1.5 h-4.5">
                  {props.rerankScore}% Match
                </Badge>
              ) : null}
            </div>

            {roleLine.length > 0 ? (
              <p className="mt-0.5 truncate text-[12px] font-medium text-foreground">
                {props.currentTitle ? <span>{props.currentTitle}</span> : null}
                {props.currentTitle && props.currentEmployer ? <span> at </span> : null}
                {props.currentEmployer ? (
                  <span className="font-semibold">{props.currentEmployer}</span>
                ) : null}
              </p>
            ) : null}

            {metaLine ? (
              <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{metaLine}</p>
            ) : null}
          </div>
        </div>

        {props.headline ? (
          <p className="bc-pull-quote mt-2.5 text-[12px] text-foreground leading-normal italic">
            &ldquo;{props.headline}&rdquo;
          </p>
        ) : null}

        {props.mentoringTopics && props.mentoringTopics.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {props.mentoringTopics.slice(0, 3).map((topic) => (
              <Badge
                key={topic}
                variant="secondary"
                className="bg-muted text-muted-foreground text-[9px] px-1.5 py-0"
              >
                {topic}
              </Badge>
            ))}
          </div>
        ) : null}
      </Link>

      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-dashed border-border/80">
        <div className="flex items-center gap-1.5">
          {props.isOpenAsAdviceHelper ? (
            <Button
              asChild
              size="sm"
              variant={props.isOpenAsMentor ? 'outline' : 'default'}
              className="h-7 text-[11px] px-2.5"
            >
              <Link href={`/ask/new?to=${props.userId}&type=advice`}>Ask for Advice</Link>
            </Button>
          ) : null}
          {props.isOpenAsMentor ? (
            <Button asChild size="sm" className="h-7 text-[11px] px-2.5">
              <Link href={`/ask/new?to=${props.userId}&type=mentorship`}>Request Mentorship</Link>
            </Button>
          ) : null}
          <Button asChild size="sm" variant="ghost" className="h-7 text-[11px] px-2">
            <Link href={`/profile/${props.userId}`}>View profile</Link>
          </Button>
        </div>

        {hasRationale ? (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-0.5 text-[10px] font-mono font-bold text-primary hover:underline hover:bg-primary/5 rounded px-1.5 py-0.5"
              >
                <ChevronRight className="size-3" />
                Why this match?
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md border-border font-sans">
              <DialogHeader className="border-b pb-3 border-border">
                <span className="font-mono text-[10px] uppercase tracking-wider text-primary">
                  Claude Re-Rank Match Analysis
                </span>
                <DialogTitle className="bc-fraunces text-xl font-bold mt-1">
                  Why {display} is a Match
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4 text-sm">
                <p className="bc-pull-quote text-[14px] leading-relaxed text-foreground italic border-l-2 border-primary pl-3.5 py-1">
                  &ldquo;{props.rationale}&rdquo;
                </p>
                {props.topCareerEntry ? (
                  <p className="text-xs text-muted-foreground">
                    Most relevant role:{' '}
                    <span className="font-medium text-foreground">
                      {props.topCareerEntry.title}
                    </span>{' '}
                    at {props.topCareerEntry.employer}{' '}
                    <span className="text-muted-foreground">({props.topCareerEntry.dates})</span>
                  </p>
                ) : null}
                {props.rerankScore !== null ? (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t">
                    <span>Match Relevance Score:</span>
                    <Badge variant="secondary" className="font-mono">
                      {props.rerankScore}% Match
                    </Badge>
                  </div>
                ) : null}
              </div>
              <DialogFooter showCloseButton />
            </DialogContent>
          </Dialog>
        ) : null}
      </div>
    </Card>
  )
}

'use client'

import { ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

function getStableBgColor(name: string | null) {
  if (!name) return 'bg-muted-foreground text-background'
  const colors = [
    'bg-accent-rust text-background',
    'bg-accent-sage text-background',
    'bg-accent-plum text-background',
    'bg-accent-ochre text-background',
    'bg-primary text-primary-foreground',
    'bg-muted-foreground text-background',
  ]
  let sum = 0
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i)
  }
  return colors[sum % colors.length]
}

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
  const avatarColorClass = getStableBgColor(display)

  const activeCount = props.activeMenteeCount ?? 0
  const maxActive = props.maxActiveMentees ?? 5
  const pendingCount = props.pendingRequestCount ?? 0
  const activeRatio = maxActive > 0 ? activeCount / maxActive : 0

  const getCapacityColorClass = (ratio: number) => {
    if (ratio <= 0.5) return 'bg-accent-sage'
    if (ratio <= 0.85) return 'bg-accent-ochre'
    return 'bg-destructive'
  }
  const capacityColorClass = getCapacityColorClass(activeRatio)

  if (density === 'compact') {
    return (
      <Card className="group p-3.5 rounded-[6px] border border-border bg-card transition-all hover:border-foreground hover:-translate-y-[1px] hover:shadow-sm duration-150 overflow-visible">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0 w-full">
          {/* Left section: Avatar & Name/Cohort */}
          <Link
            href={`/profile/${props.userId}`}
            className="flex items-center gap-3.5 min-w-0 sm:w-[240px] shrink-0"
          >
            {/* Photo placeholder (smaller, 36px) */}
            <div
              className={cn(
                'relative size-9 shrink-0 overflow-hidden rounded-[6px] shadow-sm',
                props.avatarUrl ? '' : avatarColorClass,
              )}
            >
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
                    className="absolute inset-0 opacity-15"
                    style={{
                      backgroundImage:
                        'radial-gradient(rgba(255,255,255,.12) 1px, transparent 1px)',
                      backgroundSize: '6px 6px',
                    }}
                  />
                  <span className="bc-fraunces relative flex size-full items-center justify-center text-xs font-bold text-background">
                    {initials}
                  </span>
                </>
              )}
              {props.isOpenAsMentor ? (
                <span
                  aria-hidden
                  className={cn(
                    'absolute right-0.5 bottom-0.5 size-2 rounded-full ring-1 ring-background',
                    capacityColorClass,
                  )}
                />
              ) : null}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="bc-fraunces truncate text-sm font-semibold text-foreground">
                  {display}
                </h3>
                {yearShort ? (
                  <span className="text-[10px] font-mono font-bold text-muted-foreground">
                    {yearShort}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {props.isFriend ? (
                  <StatusBadge tone="info" dot size="sm">
                    Friend
                  </StatusBadge>
                ) : null}
                {props.isOpenAsMentor ? (
                  <StatusBadge
                    tone="open"
                    size="sm"
                    className="relative cursor-help mentor-status-badge"
                  >
                    <span
                      className="shrink-0 size-1.5 rounded-full bg-accent-sage mentor-indicator-default"
                      aria-hidden
                    />
                    <span
                      className={cn(
                        'shrink-0 size-1.5 rounded-full hidden mentor-indicator-hover',
                        capacityColorClass,
                      )}
                      aria-hidden
                    />
                    Mentor
                    <span className="mentor-tooltip pointer-events-none absolute bottom-full left-0 mb-1.5 opacity-0 transition-opacity duration-150 bg-foreground text-background text-[10px] font-mono rounded-[6px] border border-border px-2 py-1 shadow-md whitespace-nowrap z-50">
                      Capacity: {activeCount}/{maxActive} active ({pendingCount} pending)
                    </span>
                  </StatusBadge>
                ) : props.isOpenAsAdviceHelper ? (
                  <StatusBadge tone="open" size="sm">
                    Advice
                  </StatusBadge>
                ) : props.mentorPaused ? (
                  <StatusBadge tone="warn" dot size="sm">
                    Paused
                  </StatusBadge>
                ) : null}
              </div>
            </div>
          </Link>

          {/* Center: Role & Company */}
          <Link href={`/profile/${props.userId}`} className="min-w-0 flex-1">
            {props.currentTitle || props.currentEmployer ? (
              <p className="truncate text-xs font-medium text-foreground">
                {props.currentTitle ? <span>{props.currentTitle}</span> : null}
                {props.currentTitle && props.currentEmployer ? (
                  <span className="font-mono text-muted-foreground/60 mx-1.5">·</span>
                ) : null}
                {props.currentEmployer ? (
                  <span className="font-semibold text-foreground">{props.currentEmployer}</span>
                ) : null}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground/60 italic truncate">No role listed</p>
            )}
            {props.city ? (
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{props.city}</p>
            ) : (
              <p className="text-[10px] text-muted-foreground/50 italic mt-0.5 truncate">
                No location listed
              </p>
            )}
          </Link>

          {/* Right section: Match Badge, Actions */}
          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
            {hasRationale && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="font-mono text-[9px] font-bold text-primary hover:text-primary-hover bg-primary/[0.04] hover:bg-primary/[0.08] rounded-[4px] px-2 py-1 border border-primary/20 shrink-0 cursor-pointer"
                  >
                    {props.rerankScore !== null ? `${props.rerankScore}% MATCH` : 'WHY MATCH'}
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md border-border rounded-[6px] sm:rounded-[6px] font-sans bg-card">
                  <DialogHeader className="border-b pb-3 border-border">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-primary font-bold">
                      Match brief
                    </span>
                    <DialogTitle className="bc-fraunces text-xl font-bold mt-1">
                      Why {display} is a Match
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4 text-sm">
                    <p className="bc-pull-quote text-sm leading-relaxed text-foreground italic py-1">
                      &ldquo;{props.rationale}&rdquo;
                    </p>
                    {props.topCareerEntry ? (
                      <p className="text-xs text-muted-foreground">
                        Most relevant role:{' '}
                        <span className="font-semibold text-foreground">
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
                        <span className="font-mono font-bold text-primary">
                          {props.rerankScore}% Match
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <DialogFooter showCloseButton />
                </DialogContent>
              </Dialog>
            )}

            <div className="flex items-center gap-1.5">
              {props.isOpenAsMentor ? (
                <Button asChild size="sm" className="h-7 text-xs px-3.5 rounded-[4px]">
                  <Link href={`/ask/new?to=${props.userId}&type=mentorship`}>Mentor</Link>
                </Button>
              ) : props.isOpenAsAdviceHelper ? (
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs px-3.5 rounded-[4px]"
                >
                  <Link href={`/ask/new?to=${props.userId}&type=advice`}>Advice</Link>
                </Button>
              ) : (
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs px-3 rounded-[4px]"
                >
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
    <Card className="group h-full flex flex-col p-5 rounded-[6px] border border-border bg-card transition-all hover:border-foreground hover:-translate-y-[1px] hover:shadow-sm duration-150 overflow-visible">
      <Link href={`/profile/${props.userId}`} className="flex-1 flex flex-col">
        {/* Top-aligned Content Container */}
        <div className="flex-1">
          <div className="flex gap-3.5">
            {/* Photo placeholder */}
            <div
              className={cn(
                'relative size-[52px] shrink-0 overflow-hidden rounded-[6px] shadow-sm',
                props.avatarUrl ? '' : avatarColorClass,
              )}
            >
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
                    className="absolute inset-0 opacity-15"
                    style={{
                      backgroundImage:
                        'radial-gradient(rgba(255,255,255,.12) 1px, transparent 1px)',
                      backgroundSize: '8px 8px',
                    }}
                  />
                  <span className="bc-fraunces relative flex size-full items-center justify-center text-lg font-bold text-background">
                    {initials}
                  </span>
                </>
              )}
              {props.isOpenAsMentor ? (
                <span
                  aria-hidden
                  className={cn(
                    'absolute right-0.5 bottom-0.5 size-2.5 rounded-full ring-1 ring-background',
                    capacityColorClass,
                  )}
                />
              ) : null}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2 min-w-0">
                <h3 className="bc-fraunces truncate text-base font-semibold text-foreground">
                  {display}
                </h3>
                {yearShort ? (
                  <span className="font-mono text-[10px] font-bold text-muted-foreground shrink-0">
                    {yearShort}
                  </span>
                ) : null}
              </div>

              {/* Status Badges Group */}
              {props.isFriend ||
              props.isOpenAsMentor ||
              props.isOpenAsAdviceHelper ||
              props.mentorPaused ? (
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {props.isFriend ? (
                    <StatusBadge tone="info" dot size="sm">
                      Friend
                    </StatusBadge>
                  ) : null}
                  {props.isOpenAsMentor ? (
                    <StatusBadge
                      tone="open"
                      size="sm"
                      className="relative cursor-help mentor-status-badge"
                    >
                      <span
                        className="shrink-0 size-1.5 rounded-full bg-accent-sage mentor-indicator-default"
                        aria-hidden
                      />
                      <span
                        className={cn(
                          'shrink-0 size-1.5 rounded-full hidden mentor-indicator-hover',
                          capacityColorClass,
                        )}
                        aria-hidden
                      />
                      Mentor
                      <span className="mentor-tooltip pointer-events-none absolute bottom-full left-0 mb-1.5 opacity-0 transition-opacity duration-150 bg-foreground text-background text-[10px] font-mono rounded-[6px] border border-border px-2 py-1 shadow-md whitespace-nowrap z-50">
                        Capacity: {activeCount}/{maxActive} active ({pendingCount} pending)
                      </span>
                    </StatusBadge>
                  ) : props.isOpenAsAdviceHelper ? (
                    <StatusBadge tone="open" dot size="sm">
                      Advice
                    </StatusBadge>
                  ) : props.mentorPaused ? (
                    <StatusBadge tone="warn" dot size="sm">
                      Paused
                    </StatusBadge>
                  ) : null}
                </div>
              ) : null}

              {props.currentTitle || props.currentEmployer ? (
                <p className="mt-1.5 truncate text-[12px] font-medium text-foreground">
                  {props.currentTitle ? <span>{props.currentTitle}</span> : null}
                  {props.currentTitle && props.currentEmployer ? (
                    <span className="font-mono text-muted-foreground/60 mx-1.5">·</span>
                  ) : null}
                  {props.currentEmployer ? (
                    <span className="font-semibold text-foreground">{props.currentEmployer}</span>
                  ) : null}
                </p>
              ) : (
                <p className="mt-1.5 text-[12px] italic text-muted-foreground/60">No role listed</p>
              )}

              {props.city || props.university || props.major ? (
                <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
                  {[props.city, props.university, props.major].filter(Boolean).join(' · ')}
                </p>
              ) : (
                <p className="mt-0.5 text-[11px] italic text-muted-foreground/50">
                  No location or education listed
                </p>
              )}
            </div>
          </div>

          {props.headline || props.rationale ? (
            <div className="mt-3 space-y-1.5">
              {hasRationale ? (
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-primary">
                  Match brief
                </p>
              ) : null}
              <p className="bc-pull-quote text-[12px] leading-normal italic text-foreground">
                &ldquo;{props.rationale ?? props.headline}&rdquo;
              </p>
            </div>
          ) : (
            <p className="mt-3 rounded-[6px] border border-border bg-surface-subtle/35 p-3 text-[12px] leading-relaxed text-muted-foreground">
              Add a specific question to see why this person may be useful.
            </p>
          )}

          <div className="mt-2.5 flex flex-wrap gap-1">
            {props.mentoringTopics && props.mentoringTopics.length > 0 ? (
              props.mentoringTopics.slice(0, 3).map((topic) => (
                <Badge
                  key={topic}
                  variant="secondary"
                  className="bg-muted text-muted-foreground text-[9px] px-2 py-0.5 rounded-[4px] font-mono border border-border/40"
                >
                  {topic}
                </Badge>
              ))
            ) : (
              <Badge
                variant="secondary"
                className="bg-muted/40 text-muted-foreground/40 text-[9px] px-2 py-0.5 rounded-[4px] font-mono border border-border/20 italic"
              >
                Ask from profile context
              </Badge>
            )}
          </div>
        </div>
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-dashed border-border/80">
        <div className="flex flex-wrap items-center gap-1.5">
          {props.isOpenAsAdviceHelper ? (
            <Button
              asChild
              size="sm"
              variant={props.isOpenAsMentor ? 'outline' : 'default'}
              className="h-7 text-[11px] px-3.5 rounded-[4px]"
            >
              <Link href={`/ask/new?to=${props.userId}&type=advice`}>Ask for Advice</Link>
            </Button>
          ) : null}
          {props.isOpenAsMentor ? (
            <Button asChild size="sm" className="h-7 text-[11px] px-3.5 rounded-[4px]">
              <Link href={`/ask/new?to=${props.userId}&type=mentorship`}>Request Mentorship</Link>
            </Button>
          ) : null}
          <Button asChild size="sm" variant="ghost" className="h-7 text-[11px] px-3 rounded-[4px]">
            <Link href={`/profile/${props.userId}`}>View profile</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {props.rerankScore !== null ? (
            <span className="shrink-0 font-mono text-[9px] px-1.5 py-0.5 border border-primary/20 bg-primary/5 text-primary font-bold rounded-[4px]">
              {props.rerankScore}% Match
            </span>
          ) : null}

          {hasRationale ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-0.5 text-[9px] font-mono font-bold text-primary hover:text-primary-hover bg-primary/[0.03] hover:bg-primary/[0.06] rounded-[4px] px-2 py-1 border border-primary/10 cursor-pointer"
                >
                  <ChevronRight className="size-3" />
                  Why match?
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md border-border rounded-[6px] sm:rounded-[6px] font-sans bg-card">
                <DialogHeader className="border-b pb-3 border-border">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-primary font-bold">
                    Match brief
                  </span>
                  <DialogTitle className="bc-fraunces text-xl font-bold mt-1">
                    Why {display} is a Match
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4 text-sm">
                  <p className="bc-pull-quote text-sm leading-relaxed text-foreground italic py-1">
                    &ldquo;{props.rationale}&rdquo;
                  </p>
                  {props.topCareerEntry ? (
                    <p className="text-xs text-muted-foreground">
                      Most relevant role:{' '}
                      <span className="font-semibold text-foreground">
                        {props.topCareerEntry.title}
                      </span>{' '}
                      at {props.topCareerEntry.employer}{' '}
                      <span className="text-muted-foreground">({props.topCareerEntry.dates})</span>
                    </p>
                  ) : null}
                  {props.rerankScore !== null ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t">
                      <span>Match Relevance Score:</span>
                      <span className="font-mono font-bold text-primary">
                        {props.rerankScore}% Match
                      </span>
                    </div>
                  ) : null}
                </div>
                <DialogFooter showCloseButton />
              </DialogContent>
            </Dialog>
          ) : null}
        </div>
      </div>
    </Card>
  )
}

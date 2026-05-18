'use client'

import { ChevronDown, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { displayName } from '@/lib/utils'

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
  // True when the viewer is already friends with this alum. Surfaces a
  // small "Friend" badge — replaces the standalone /friends page now that
  // People folds the friend dimension in.
  isFriend: boolean
  // NL-only fields. Null in structured mode.
  rationale: string | null
  rerankScore: number | null
  // Inline-render expandable career snippet for the rationale panel.
  topCareerEntry: { employer: string; title: string; dates: string } | null
}

/**
 * V3+ profile card — dense layout with editorial bio pull-quote.
 * Charcoal photo placeholder w/ initials, Fraunces name, sapphire-rule italic
 * bio (the headline), year + mentor pills, and a collapsible rationale panel
 * for NL search results.
 */
export function ResultCard(props: ResultCardProps) {
  const [expanded, setExpanded] = useState(false)
  const hasRationale = props.rationale !== null
  // Prefer the day-to-day display name if set; fall back to the canonical
  // name so member-tile reads consistently across cohorts that may know
  // the same person under different names.
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
  const meta = [
    props.city,
    [props.university, props.major].filter(Boolean).join(', ') || null,
  ].filter(Boolean)

  return (
    <Card className="group p-5 transition-all hover:border-primary/60 hover:shadow-md">
      <Link href={`/profile/${props.userId}`} className="block">
        <div className="flex gap-3.5">
          {/* Photo placeholder — charcoal gradient with initials, dot grid, availability dot */}
          <div className="relative size-[72px] shrink-0 overflow-hidden rounded-[10px] bg-[linear-gradient(135deg,#1e293b_0%,#3f465c_100%)]">
            {props.avatarUrl ? (
              <Image
                src={props.avatarUrl}
                alt=""
                fill
                sizes="72px"
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
                    backgroundSize: '10px 10px',
                  }}
                />
                <span className="bc-fraunces relative flex size-full items-center justify-center text-2xl font-bold text-white">
                  {initials}
                </span>
              </>
            )}
            {props.isOpenAsMentor ? (
              <span
                aria-hidden
                className="absolute right-1.5 bottom-1.5 size-3 rounded-full bg-emerald-500 ring-2 ring-white"
              />
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="bc-fraunces truncate text-lg font-semibold text-foreground">
                {display}
              </h3>
              {props.rerankScore !== null ? (
                <Badge variant="secondary" className="ml-auto shrink-0">
                  {props.rerankScore}
                </Badge>
              ) : null}
            </div>
            {roleLine.length > 0 ? (
              <p className="mt-0.5 truncate text-[13px] font-medium text-foreground">
                {props.currentTitle ? <span>{props.currentTitle}</span> : null}
                {props.currentTitle && props.currentEmployer ? <span> at </span> : null}
                {props.currentEmployer ? (
                  <span className="font-semibold">{props.currentEmployer}</span>
                ) : null}
              </p>
            ) : null}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {yearShort ? (
                <span className="inline-flex h-5 items-center rounded-full bg-muted px-2 text-xs font-medium text-muted-foreground">
                  {yearShort}
                </span>
              ) : null}
              {props.isFriend ? (
                <StatusBadge tone="info" dot>
                  Friend
                </StatusBadge>
              ) : null}
              {props.isOpenAsMentor ? (
                <StatusBadge tone="open" dot>
                  Mentor
                </StatusBadge>
              ) : props.isOpenAsAdviceHelper ? (
                <StatusBadge tone="open" dot>
                  Advice
                </StatusBadge>
              ) : props.mentorPaused ? (
                <StatusBadge tone="warn" dot>
                  Paused
                </StatusBadge>
              ) : null}
            </div>
          </div>
        </div>

        {props.headline ? (
          <p className="bc-pull-quote mt-3.5 text-[13px] text-foreground">
            &ldquo;{props.headline}&rdquo;
          </p>
        ) : null}

        {meta.length > 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">{meta.join(' · ')}</p>
        ) : null}
        {props.mentoringTopics && props.mentoringTopics.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {props.mentoringTopics.slice(0, 3).map((topic) => (
              <Badge key={topic} variant="secondary" className="bg-muted text-muted-foreground">
                {topic}
              </Badge>
            ))}
          </div>
        ) : null}
      </Link>

      <div className="mt-4 flex flex-wrap gap-2">
        {props.isOpenAsAdviceHelper ? (
          <Button asChild size="sm" variant={props.isOpenAsMentor ? 'outline' : 'default'}>
            <Link href={`/ask/new?to=${props.userId}&type=advice`}>Ask for advice</Link>
          </Button>
        ) : null}
        {props.isOpenAsMentor ? (
          <Button asChild size="sm">
            <Link href={`/ask/new?to=${props.userId}&type=mentorship`}>Request mentorship</Link>
          </Button>
        ) : null}
        <Button asChild size="sm" variant="ghost">
          <Link href={`/profile/${props.userId}`}>View profile</Link>
        </Button>
      </div>

      {hasRationale ? (
        <div className="-mx-5 -mb-5 mt-4 border-t bg-muted/40 px-5 py-2.5">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setExpanded((v) => !v)
            }}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            aria-expanded={expanded}
          >
            {expanded ? (
              <>
                <ChevronDown className="size-3.5" />
                Hide rationale
              </>
            ) : (
              <>
                <ChevronRight className="size-3.5" />
                Why this match?
              </>
            )}
          </button>
          {expanded ? (
            <div className="mt-2 space-y-2 text-sm">
              <p className="bc-pull-quote text-[13px] text-foreground">
                &ldquo;{props.rationale}&rdquo;
              </p>
              {props.topCareerEntry ? (
                <p className="text-xs text-muted-foreground">
                  Most relevant role:{' '}
                  <span className="font-medium text-foreground">{props.topCareerEntry.title}</span>{' '}
                  at {props.topCareerEntry.employer}{' '}
                  <span className="text-muted-foreground">({props.topCareerEntry.dates})</span>
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  )
}

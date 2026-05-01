'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'

export type ResultCardProps = {
  userId: string
  name: string | null
  headline: string | null
  currentEmployer: string | null
  currentTitle: string | null
  city: string | null
  university: string | null
  major: string | null
  graduationYear: number | null
  avatarUrl: string | null
  isOpenAsMentor: boolean
  mentorPaused: boolean
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
  const initials = (props.name ?? '?')
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
              // biome-ignore lint/performance/noImgElement: avatar URLs come from Supabase storage; Next/Image config not required here.
              <img
                src={props.avatarUrl}
                alt=""
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
                {props.name}
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
              {props.isOpenAsMentor ? (
                <StatusBadge tone="open" dot>
                  Mentor
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
      </Link>
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
            {expanded ? '▼ Hide rationale' : '▶ Why this match?'}
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

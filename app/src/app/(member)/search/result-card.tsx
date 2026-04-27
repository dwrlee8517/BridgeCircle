'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

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
 * Result card with collapsible "Why this match?" rationale panel.
 *
 * The whole card is a profile link; the rationale toggle stops propagation
 * so clicking it doesn't navigate. In structured-search mode (rationale
 * null) the toggle is hidden.
 */
export function ResultCard(props: ResultCardProps) {
  const [expanded, setExpanded] = useState(false)
  const hasRationale = props.rationale !== null

  return (
    <Card className="transition-shadow hover:shadow-md">
      <Link href={`/profile/${props.userId}`} className="block">
        <CardContent className="flex items-start gap-4 pt-5">
          <Avatar className="size-12">
            {props.avatarUrl ? <AvatarImage src={props.avatarUrl} alt={props.name ?? ''} /> : null}
            <AvatarFallback>{(props.name ?? '?').slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{props.name}</span>
              {props.graduationYear ? (
                <span className="text-sm text-muted-foreground">
                  '{`${props.graduationYear}`.slice(-2)}
                </span>
              ) : null}
              {props.isOpenAsMentor ? (
                <Badge variant="default">Mentor</Badge>
              ) : props.mentorPaused ? (
                <Badge variant="outline">Paused</Badge>
              ) : null}
              {props.rerankScore !== null ? (
                <Badge variant="secondary" className="ml-auto">
                  {props.rerankScore}
                </Badge>
              ) : null}
            </div>
            {props.headline ? (
              <p className="text-sm text-muted-foreground">{props.headline}</p>
            ) : null}
            <p className="text-sm">
              {[props.currentTitle, props.currentEmployer].filter(Boolean).join(' · ')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {[props.city, [props.university, props.major].filter(Boolean).join(', ')]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </CardContent>
      </Link>
      {hasRationale ? (
        <div className="border-t bg-muted/30 px-6 py-2.5">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setExpanded((v) => !v)
            }}
            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            aria-expanded={expanded}
          >
            {expanded ? '▼ Hide rationale' : '▶ Why this match?'}
          </button>
          {expanded ? (
            <div className="mt-2 space-y-2 text-sm">
              <p className="italic text-muted-foreground">{props.rationale}</p>
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

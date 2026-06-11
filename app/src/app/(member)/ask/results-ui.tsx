import { ArrowRight, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MatchBandBadge, PersonAvatar, RationaleBlock } from '@/components/ui/person-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { askComposeHref, classYearShort, cn, displayName, preferredAskType } from '@/lib/utils'
import type { HelpNetworkPerson } from '../help-network-ui'

/**
 * Triage layout for ask results: one featured "strongest fit" card with the
 * full reasoning, then compact scannable rows. Hierarchy through density —
 * ten identical heavy cards read as noise; one decision plus a list reads
 * as a brief. The "How we read it" tag derivation lives in
 * lib/search/readingTags.ts.
 */

function askLabelFor(askType: 'advice' | 'mentorship', firstName: string) {
  return askType === 'advice' ? `Ask ${firstName}` : 'Request mentorship'
}

export function FeaturedMatchCard({
  person,
  intent,
  reason,
}: {
  person: HelpNetworkPerson
  intent: string
  reason: string | null
}) {
  const display = displayName(person.name, person.preferredName ?? null)
  const firstName = display.split(/\s+/)[0] || display
  const role = [person.currentTitle, person.currentEmployer].filter(Boolean).join(' at ')
  const context = [role || null, person.city].filter(Boolean).join(' · ')
  const askType = preferredAskType(person)

  return (
    <article className="overflow-hidden rounded-md border border-border bg-card p-4 shadow-card sm:p-5">
      <div className="flex items-start gap-3.5">
        <PersonAvatar
          userId={person.userId}
          name={display}
          avatarUrl={person.avatarUrl}
          shape="square"
          className="size-12 text-base"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              href={`/profile/${person.userId}`}
              className="font-heading text-lg font-semibold leading-tight text-foreground hover:text-primary"
            >
              {display}
            </Link>
            {classYearShort(person.graduationYear) ? (
              <span className="font-mono text-xs font-semibold text-muted-foreground">
                {classYearShort(person.graduationYear)}
              </span>
            ) : null}
            <AvailabilityBadges person={person} />
            {person.matchScore !== null && person.matchScore !== undefined ? (
              <MatchBandBadge score={person.matchScore} />
            ) : null}
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {context || person.university || 'School circle member'}
          </p>
        </div>
      </div>

      <RationaleBlock
        label={`Why ${firstName} might fit`}
        labelClassName="text-primary"
        bodyClassName="text-sm leading-relaxed text-foreground"
        className="mt-3 rounded-md border border-primary/15 bg-primary/[0.04] p-3"
      >
        {reason ?? 'They are part of your trusted school circle.'}
      </RationaleBlock>

      <div className="mt-3.5 flex items-center justify-between gap-3">
        <Link
          href={`/profile/${person.userId}`}
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          View profile
        </Link>
        {askType ? (
          <Button asChild size="sm" className="rounded-md">
            <Link href={askComposeHref(person.userId, askType, intent)}>
              {askLabelFor(askType, firstName)}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        ) : null}
      </div>
    </article>
  )
}

export function CompactMatchRow({
  person,
  intent,
  reason,
}: {
  person: HelpNetworkPerson
  intent: string
  reason: string | null
}) {
  const display = displayName(person.name, person.preferredName ?? null)
  const role = [person.currentTitle, person.currentEmployer].filter(Boolean).join(' at ')
  const askType = preferredAskType(person)

  return (
    <li className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
      <PersonAvatar
        userId={person.userId}
        name={display}
        avatarUrl={person.avatarUrl}
        shape="square"
        className="size-9 text-xs"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">
          <Link
            href={`/profile/${person.userId}`}
            className="font-heading font-semibold text-foreground hover:text-primary"
          >
            {display}
          </Link>
          {classYearShort(person.graduationYear) ? (
            <span className="ml-1.5 font-mono text-xs text-muted-foreground">
              {classYearShort(person.graduationYear)}
            </span>
          ) : null}
          {role ? <span className="ml-1.5 text-muted-foreground">· {role}</span> : null}
        </p>
        {reason ? (
          <p className="mt-0.5 truncate text-xs leading-relaxed text-muted-foreground">{reason}</p>
        ) : null}
      </div>
      {person.mentorPaused ? (
        <StatusBadge tone="warn" size="sm" dot>
          Paused
        </StatusBadge>
      ) : askType ? (
        <span
          aria-hidden
          className="size-1.5 shrink-0 rounded-full bg-accent-sage"
          title="Open to help"
        />
      ) : null}
      {askType ? (
        <Link
          href={askComposeHref(person.userId, askType, intent)}
          className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-link hover:text-link-hover"
        >
          Ask
          <ChevronRight className="size-3.5" />
        </Link>
      ) : (
        <Link
          href={`/profile/${person.userId}`}
          className="shrink-0 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Profile
        </Link>
      )}
    </li>
  )
}

function AvailabilityBadges({ person }: { person: HelpNetworkPerson }) {
  if (person.mentorPaused) {
    return (
      <StatusBadge tone="warn" size="sm" dot>
        Paused
      </StatusBadge>
    )
  }
  return (
    <>
      {person.isOpenAsAdviceHelper ? (
        <StatusBadge tone="open" size="sm" dot>
          Quick advice
        </StatusBadge>
      ) : null}
      {person.isOpenAsMentor ? (
        <StatusBadge tone="info" size="sm" dot>
          Mentorship
        </StatusBadge>
      ) : null}
    </>
  )
}

export function MatchRowDivider({ children }: { children: React.ReactNode }) {
  return (
    <ul
      className={cn(
        'divide-y divide-border/70 rounded-md border border-border bg-card shadow-card',
      )}
    >
      {children}
    </ul>
  )
}

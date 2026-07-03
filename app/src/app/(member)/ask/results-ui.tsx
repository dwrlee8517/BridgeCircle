import { ArrowRight, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MatchBandBadge, PersonAvatar, RationaleBlock } from '@/components/ui/person-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { askComposeHref, classYearShort, cn, displayName, isOpenToHelp } from '@/lib/utils'
import type { HelpNetworkPerson } from '../help-network-ui'

/**
 * Triage layout for ask results: one featured "strongest fit" card with the
 * full reasoning, then compact scannable rows. Hierarchy through density —
 * ten identical heavy cards read as noise; one decision plus a list reads
 * as a brief. The "How we read it" tag derivation lives in
 * lib/search/readingTags.ts.
 */

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
  const canAsk = isOpenToHelp(person)

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
        {canAsk ? (
          <Button asChild size="sm" className="rounded-md">
            <Link href={askComposeHref(person.userId, intent)}>
              {`Ask ${firstName}`}
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
  onSelect,
  dimmed = false,
  flash = false,
}: {
  person: HelpNetworkPerson
  intent: string
  reason: string | null
  /** When set, the whole row promotes this person into the focus slot.
   * Links inside stop propagation so Ask / profile stay one click. */
  onSelect?: () => void
  /** Sub-65 band: quieter treatment so longer shots never dress up as
   * strong fits. */
  dimmed?: boolean
  /** Brief highlight when a person lands back in the list after being
   * demoted from the focus slot — the eye can follow them. */
  flash?: boolean
}) {
  const display = displayName(person.name, person.preferredName ?? null)
  const role = [person.currentTitle, person.currentEmployer].filter(Boolean).join(' at ')
  const canAsk = isOpenToHelp(person)
  const selectable = Boolean(onSelect)

  return (
    <li
      onClick={onSelect}
      onKeyDown={
        selectable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelect?.()
              }
            }
          : undefined
      }
      role={selectable ? 'button' : undefined}
      tabIndex={selectable ? 0 : undefined}
      aria-label={selectable ? `View ${display}'s match details` : undefined}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 transition-colors duration-slow ease-standard sm:px-4',
        selectable && 'cursor-pointer hover:bg-surface-panel/45',
        dimmed && 'opacity-90',
        flash && 'bg-primary-tint duration-instant',
      )}
    >
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
            onClick={selectable ? (event) => event.stopPropagation() : undefined}
            className={cn(
              'font-heading font-semibold hover:text-primary',
              dimmed ? 'text-muted-foreground' : 'text-foreground',
            )}
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
      ) : canAsk ? (
        <span
          aria-hidden
          className={cn('size-1.5 shrink-0 rounded-full', dimmed ? 'bg-border' : 'bg-accent-sage')}
          title="Open to help"
        />
      ) : null}
      {canAsk ? (
        <Link
          href={askComposeHref(person.userId, intent)}
          onClick={selectable ? (event) => event.stopPropagation() : undefined}
          className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-link hover:text-link-hover"
        >
          Ask
          <ChevronRight className="size-3.5" />
        </Link>
      ) : (
        <Link
          href={`/profile/${person.userId}`}
          onClick={selectable ? (event) => event.stopPropagation() : undefined}
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
      {isOpenToHelp(person) ? (
        <StatusBadge tone="open" size="sm" dot>
          Open to help
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

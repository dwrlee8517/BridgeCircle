import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  MessageCircleQuestion,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MatchBandBadge, PersonAvatar, RationaleBlock } from '@/components/ui/person-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { askComposeHref, classYearShort, cn, displayName, preferredAskType } from '@/lib/utils'

export type HelpNetworkPerson = {
  userId: string
  name: string | null
  preferredName?: string | null
  avatarUrl: string | null
  graduationYear: number | null
  currentTitle: string | null
  currentEmployer: string | null
  city: string | null
  university?: string | null
  major?: string | null
  isOpenAsMentor?: boolean
  isOpenAsAdviceHelper?: boolean
  mentorPaused?: boolean
  mentoringTopics?: string[] | null
  rationale?: string | null
  matchScore?: number | null
}

export function AskBar({
  defaultValue = '',
  action = '/ask',
  compact = false,
  submitVariant = 'cta',
}: {
  defaultValue?: string
  action?: string
  compact?: boolean
  /**
   * Amber belongs to the single social-commitment moment per screen. On
   * browse/results surfaces pass 'default' so re-running a search doesn't
   * out-shout the cards (tokens.md § CTA rule).
   */
  submitVariant?: 'cta' | 'default'
}) {
  const spacious = !compact

  return (
    <form
      action={action}
      className={cn(
        'bc-command-surface',
        compact ? 'p-2' : 'p-[14px_16px] max-[760px]:p-[10px_12px]',
      )}
    >
      <div className="relative flex items-center gap-3 max-[760px]:gap-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-3 max-[760px]:gap-2.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground max-[760px]:size-[34px] max-[760px]:rounded-md">
            <CircleHelp className="size-5 max-[760px]:size-4" />
          </div>
          {/* suppressHydrationWarning: form-filler / accessibility browser
              extensions inject attributes onto search inputs after SSR,
              triggering a benign hydration mismatch. The attribute is
              user-environment, not server state. */}
          <input
            type="search"
            name="nl"
            defaultValue={defaultValue}
            aria-label="Ask a question to find people who can help"
            placeholder="What are you trying to figure out?"
            className={cn(
              'h-11 min-w-0 flex-1 border-none bg-transparent px-0 font-medium text-foreground outline-none placeholder:text-muted-foreground/60 max-[760px]:h-8 max-[760px]:text-sm',
              spacious ? 'text-[17px]' : 'text-[15px]',
            )}
            suppressHydrationWarning
          />
        </div>
        <Button
          type="submit"
          variant={submitVariant}
          size={compact ? 'default' : 'lg'}
          className="h-11 rounded-md px-5 text-[15px] font-semibold max-[760px]:size-8 max-[760px]:gap-0 max-[760px]:px-0"
        >
          <span className="max-[760px]:sr-only">Find matches</span>
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </form>
  )
}

export function NetworkMotif({
  helperCount,
  requestCount,
  eventCount,
}: {
  helperCount: number
  requestCount: number
  eventCount: number
}) {
  return (
    <div className="relative min-h-[280px] overflow-hidden rounded-xl border border-border bg-surface-midnight p-5 text-surface-midnight-foreground shadow-hero">
      <svg className="absolute inset-0 size-full opacity-70" viewBox="0 0 520 320" aria-hidden>
        <title>Relationship map motif</title>
        <defs>
          <linearGradient id="networkLine" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="rgb(147 197 253 / .72)" />
            <stop offset="52%" stopColor="rgb(67 196 137 / .64)" />
            <stop offset="100%" stopColor="rgb(221 161 80 / .58)" />
          </linearGradient>
        </defs>
        <path
          d="M72 226 C142 92 232 84 312 158 S430 244 478 92"
          fill="none"
          stroke="url(#networkLine)"
          strokeWidth="1.6"
        />
        <path
          d="M62 86 C150 138 212 232 318 198 S414 124 466 222"
          fill="none"
          stroke="rgb(250 250 249 / .16)"
          strokeWidth="1"
        />
        {[72, 156, 252, 336, 448].map((cx, idx) => (
          <g key={cx}>
            <circle
              cx={cx}
              cy={[226, 124, 184, 154, 96][idx]}
              r="8"
              fill="rgb(250 250 249 / .94)"
            />
            <circle
              cx={cx}
              cy={[226, 124, 184, 154, 96][idx]}
              r="18"
              fill="none"
              stroke="rgb(250 250 249 / .14)"
            />
          </g>
        ))}
      </svg>
      <div className="relative flex h-full min-h-[240px] flex-col justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary-on-dark">
            Live school circle
          </p>
          <h2 className="mt-2 max-w-sm font-heading text-3xl font-semibold leading-tight">
            A trusted map of people who can help, and people you can help.
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <NetworkStat value={helperCount} label="Open helpers" />
          <NetworkStat value={requestCount} label="Need reply" />
          <NetworkStat value={eventCount} label="School events" />
        </div>
      </div>
    </div>
  )
}

function NetworkStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-md border border-editorial-rule bg-white/[0.06] p-3">
      <div className="font-heading text-2xl font-semibold leading-none">{value}</div>
      <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.10em] text-surface-midnight-muted">
        {label}
      </div>
    </div>
  )
}

// Geometry shared between MatchBriefCard and its skeletons (the card-variant
// MatchBriefCardSkeleton below and the list-row mirror in ask/loading.tsx) —
// all consumers must use these so loading states can't drift from the card.
export const MATCH_GRID = 'grid gap-0 md:grid-cols-[minmax(0,1fr)_244px]'
export const MATCH_AVATAR_BOX = 'size-12'
export const MATCH_RAIL =
  'flex flex-col justify-center gap-2 border-t border-border bg-surface-panel/60 p-4 md:border-l md:border-t-0'

export function MatchBriefCard({
  person,
  query,
  reason,
  intent,
  compact: _compact = false,
  variant = 'card',
}: {
  person: HelpNetworkPerson
  query?: string
  reason?: string | null
  intent?: string
  compact?: boolean
  variant?: 'card' | 'list-row'
}) {
  const display = displayName(person.name, person.preferredName ?? null)
  const role = [person.currentTitle, person.currentEmployer].filter(Boolean).join(' at ')
  const askType = preferredAskType(person)
  const matchReason =
    reason ??
    person.rationale ??
    buildDefaultReason(person, query) ??
    'They are part of your trusted school circle.'
  // Synthesis P1-5: drop "Suggested first ask" when there's no query — the
  // templated copy makes the card feel auto-generated when shown on the home
  // feed without context. Keep it on /ask results, where the user typed a
  // question worth echoing back.
  const showSuggestedAsk = Boolean(query?.trim())
  const suggestedAsk = showSuggestedAsk ? buildSuggestedAsk(query, person) : null
  const askLabel = askType === 'advice' ? 'Ask for advice' : 'Request mentorship'
  const askIntent = intent ?? query
  const isListRow = variant === 'list-row'
  const content = (
    <div className={MATCH_GRID}>
      <div className="relative overflow-hidden p-4 sm:p-5">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgb(37_99_235/0.025),transparent_42%),radial-gradient(circle_at_100%_100%,rgb(21_160_95/0.025),transparent_32%)]" />
        <div className="relative flex items-start gap-3.5">
          <PersonAvatar
            userId={person.userId}
            name={display}
            avatarUrl={person.avatarUrl}
            shape="square"
            className={cn(MATCH_AVATAR_BOX, 'text-base')}
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
                <span className="text-xs font-semibold text-muted-foreground">
                  {classYearShort(person.graduationYear)}
                </span>
              ) : null}
              <AvailabilityBadges person={person} />
              {person.matchScore !== null && person.matchScore !== undefined ? (
                <MatchBandBadge score={person.matchScore} />
              ) : null}
            </div>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {role || person.city || person.university || 'School circle member'}
            </p>
          </div>
        </div>

        <div className="relative mt-3 space-y-2">
          <RationaleBlock
            label="Why this person might fit"
            labelClassName="text-primary"
            bodyClassName="text-sm text-foreground"
            className={cn(
              'bg-primary/[0.04] p-3',
              isListRow ? '' : 'rounded-md border border-primary/18 bg-card shadow-sm',
            )}
          >
            {matchReason}
          </RationaleBlock>
          {showSuggestedAsk && suggestedAsk ? (
            <details
              className={cn(
                'group rounded-md border border-accent-sage/18 bg-accent-sage/[0.04] open:bg-accent-sage/[0.06]',
                isListRow && 'border-0 bg-transparent open:bg-transparent',
              )}
            >
              <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground">
                <ChevronRight className="size-3 transition-transform group-open:rotate-90" />
                Suggested first message
              </summary>
              <div className="px-3 pb-3">
                <p className="text-sm leading-relaxed text-foreground">{suggestedAsk}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  A starting point — edit before sending.
                </p>
              </div>
            </details>
          ) : null}
        </div>
      </div>

      <div className={MATCH_RAIL}>
        {askType ? (
          <Button asChild variant="default" size="sm" className="w-full rounded-md">
            <Link href={askComposeHref(person.userId, askType, askIntent)}>
              {askLabel}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm" className="w-full rounded-md">
            <Link href={`/profile/${person.userId}`}>View profile</Link>
          </Button>
        )}
        {askType ? (
          <Link
            href={`/profile/${person.userId}`}
            className="text-center text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            View profile
          </Link>
        ) : null}
      </div>
    </div>
  )

  if (isListRow) {
    return (
      <article className="group border-b border-border/80 bg-card transition-colors last:border-b-0 hover:bg-surface-panel/45">
        {content}
      </article>
    )
  }

  return (
    <Card
      className={cn(
        'group bc-motion-surface overflow-hidden rounded-md border border-border bg-card p-0 shadow-card transition-[border-color,box-shadow,transform] hover:-translate-y-px hover:border-primary/28 hover:shadow-card-hover',
      )}
    >
      {content}
    </Card>
  )
}

// Mirrors MatchBriefCard structure-for-structure so the layout doesn't reflow
// when results land. If you change the card geometry, change this too.
export function MatchBriefCardSkeleton({ count = 5 }: { count?: number }) {
  const placeholders = Array.from({ length: count }, (_, i) => `match-skeleton-${i}`)
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading matches</span>
      {placeholders.map((id) => (
        <Card
          key={id}
          className="overflow-hidden rounded-md border border-border bg-card p-0 shadow-card"
        >
          <div className={MATCH_GRID}>
            {/* Left: identity + reason + disclosure */}
            <div className="relative overflow-hidden p-4 sm:p-5">
              <div className="relative flex items-start gap-3.5">
                {/* Avatar */}
                <div
                  className={cn(
                    MATCH_AVATAR_BOX,
                    'shrink-0 animate-pulse rounded-md bg-surface-subtle',
                  )}
                />
                <div className="min-w-0 flex-1 space-y-2">
                  {/* Name + year + availability badge + (sometimes) match pill */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="h-5 w-36 animate-pulse rounded bg-surface-subtle" />
                    <div className="h-4 w-8 animate-pulse rounded bg-surface-subtle/70" />
                    <div className="h-5 w-24 animate-pulse rounded-full bg-surface-subtle/70" />
                  </div>
                  {/* Role line */}
                  <div className="h-4 w-2/3 animate-pulse rounded bg-surface-subtle/70" />
                </div>
              </div>

              {/* "Why this match" container — keep the colored chrome visible
                  so the skeleton reads as the same structure, not generic
                  muted blocks. */}
              <div className="relative mt-3 space-y-2">
                <div className="rounded-md border border-primary/18 bg-primary/[0.04] p-3 shadow-sm">
                  <div className="h-3 w-24 animate-pulse rounded bg-primary/20" />
                  <div className="mt-2 space-y-1.5">
                    <div className="h-3.5 w-full animate-pulse rounded bg-surface-subtle/80" />
                    <div className="h-3.5 w-11/12 animate-pulse rounded bg-surface-subtle/80" />
                    <div className="h-3.5 w-3/4 animate-pulse rounded bg-surface-subtle/80" />
                  </div>
                </div>

                {/* "Suggested first ask" disclosure row — collapsed state */}
                <div className="flex items-center gap-2 rounded-md border border-accent-sage/18 bg-accent-sage/[0.04] px-3 py-2">
                  <div className="size-3 animate-pulse rounded-sm bg-accent-sage/30" />
                  <div className="h-3 w-32 animate-pulse rounded bg-surface-subtle/70" />
                </div>
              </div>
            </div>

            {/* Right: CTA + view-profile link */}
            <div className={MATCH_RAIL}>
              <div className="h-9 w-full animate-pulse rounded-md bg-surface-subtle" />
              <div className="mx-auto h-3 w-20 animate-pulse rounded bg-surface-subtle/70" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export function HelpOpportunityCard({
  title,
  subtitle,
  body,
  href,
  cta,
  tone = 'sage',
}: {
  title: string
  subtitle: string
  body: string
  href: string
  cta: string
  tone?: 'sage' | 'ochre' | 'plum'
}) {
  // P0-3: ochre fails WCAG (3.32:1) for text — the colored icon chip is
  // background fill + the icon glyph, not body text. We keep the chip but
  // strip text-colored ochre/plum on copy below.
  const toneClass =
    tone === 'ochre'
      ? 'bg-warning-tint text-foreground'
      : tone === 'plum'
        ? 'bg-plum-tint text-accent-plum'
        : 'bg-success-tint text-accent-sage'

  return (
    <Link
      href={href}
      className="group flex gap-4 rounded-md border border-border bg-card p-4 shadow-card transition-[border-color,box-shadow,transform] hover:-translate-y-px hover:border-foreground/30 hover:shadow-card-hover"
    >
      <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-md', toneClass)}>
        <MessageCircleQuestion className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-heading text-lg font-semibold leading-tight text-foreground">{title}</p>
        <p className="mt-1 text-xs font-medium text-muted-foreground">{subtitle}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
        <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-link group-hover:text-link-hover">
          {cta}
          <ArrowRight className="size-4" />
        </span>
      </div>
    </Link>
  )
}

export function SchoolPulseCard({
  title,
  meta,
  body,
  href,
  kind,
}: {
  title: string
  // P0-2 / P1-6: meta is a node so callers can pass <EventTime> for client-
  // timezone formatting instead of a server-formatted string. Plain strings
  // still work.
  meta: React.ReactNode
  body: string
  href: string
  kind: 'event' | 'announcement'
}) {
  return (
    <Link
      href={href}
      className="group flex gap-4 rounded-md border border-border bg-card p-4 shadow-card transition-[border-color,box-shadow] hover:border-foreground/30 hover:shadow-card-hover"
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/[0.08] text-primary">
        {kind === 'event' ? <CalendarDays className="size-5" /> : <Sparkles className="size-5" />}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {meta}
        </p>
        <p className="mt-1 font-heading text-base font-semibold leading-tight text-foreground">
          {title}
        </p>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </Link>
  )
}

// P3 cleanup: gate on actual staleness. The card used to render on every
// home visit. Now the caller passes a daysSinceLastReview signal; we hide
// the card if the profile was reviewed in the last 30 days. Default 999
// preserves the old "always show" behavior if a caller forgets to pass it.
export function FreshnessReviewCard({
  daysSinceLastReview = 999,
  staleAfterDays = 30,
}: {
  daysSinceLastReview?: number
  staleAfterDays?: number
} = {}) {
  if (daysSinceLastReview < staleAfterDays) return null
  return (
    <Card className="rounded-md border-border bg-card p-5 shadow-card">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/[0.08] text-primary">
          <Sparkles className="size-5" />
        </div>
        <div>
          <p className="font-heading text-lg font-semibold leading-tight text-foreground">
            Keep your profile current so the right people can find you.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Review imported changes, add missing topics, or confirm everything still looks right.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm" className="rounded-md">
              <Link href="/profile/import">Review updates</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-md">
              <Link href="/profile/edit">Edit profile</Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
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

function buildDefaultReason(person: HelpNetworkPerson, query?: string) {
  if (person.mentoringTopics && person.mentoringTopics.length > 0) {
    return `They help with ${person.mentoringTopics.slice(0, 2).join(' and ')}, which fits this question.`
  }
  if (person.currentTitle && person.currentEmployer) {
    return `Their path as ${person.currentTitle} at ${person.currentEmployer} could be useful context.`
  }
  if (person.city)
    return `They are connected to ${person.city}, which may make the conversation more practical.`
  if (query) return 'Their profile has signals that match what you asked for.'
  return null
}

function buildSuggestedAsk(_query: string | undefined, person: HelpNetworkPerson) {
  // Never echo the member's raw query back in quotes — the parroted template
  // reads as auto-generated filler. Keep the opener short; the guided
  // composer does the real drafting.
  if (person.mentoringTopics?.[0]) {
    return `Could I get your perspective on ${person.mentoringTopics[0]}?`
  }
  return 'Could I get your perspective on this?'
}

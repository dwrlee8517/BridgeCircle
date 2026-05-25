import { ArrowRight, CalendarDays, Check, CircleHelp, Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn, displayName } from '@/lib/utils'

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
}: {
  defaultValue?: string
  action?: string
  compact?: boolean
}) {
  return (
    <form action={action} className={cn('bc-command-surface', compact ? 'p-2' : 'p-3 sm:p-4')}>
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CircleHelp className="size-5" />
          </div>
          <input
            type="search"
            name="q"
            defaultValue={defaultValue}
            placeholder="What are you trying to figure out?"
            className="h-14 min-w-0 flex-1 border-none bg-transparent px-0 text-base font-medium text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-none focus:shadow-none focus:ring-0 sm:text-lg"
          />
        </div>
        <Button
          type="submit"
          variant="cta"
          size={compact ? 'default' : 'lg'}
          className="rounded-lg"
        >
          Find people
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </form>
  )
}

export function PromptChips({ prompts }: { prompts: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {prompts.map((prompt) => (
        <Link
          key={prompt}
          href={`/ask?q=${encodeURIComponent(prompt)}`}
          className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/[0.04] hover:text-foreground"
        >
          {prompt}
        </Link>
      ))}
    </div>
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
            <stop offset="52%" stopColor="rgb(112 169 130 / .64)" />
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
    <div className="rounded-lg border border-editorial-rule bg-white/[0.06] p-3">
      <div className="font-heading text-2xl font-semibold leading-none">{value}</div>
      <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.10em] text-surface-midnight-muted">
        {label}
      </div>
    </div>
  )
}

export function MatchBriefCard({
  person,
  query,
  reason,
  compact: _compact = false,
  variant = 'card',
}: {
  person: HelpNetworkPerson
  query?: string
  reason?: string | null
  compact?: boolean
  variant?: 'card' | 'list-row'
}) {
  const display = displayName(person.name, person.preferredName ?? null)
  const role = [person.currentTitle, person.currentEmployer].filter(Boolean).join(' at ')
  const askType = person.isOpenAsAdviceHelper
    ? 'advice'
    : person.isOpenAsMentor
      ? 'mentorship'
      : null
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
  const isListRow = variant === 'list-row'
  const content = (
    <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_244px]">
      <div className="relative overflow-hidden p-4 sm:p-5">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgb(37_99_235/0.025),transparent_42%),radial-gradient(circle_at_100%_100%,rgb(59_110_81/0.025),transparent_32%)]" />
        <div className="relative flex items-start gap-3.5">
          <PersonAvatar person={person} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link
                href={`/profile/${person.userId}`}
                className="font-heading text-lg font-semibold leading-tight text-foreground hover:text-primary"
              >
                {display}
              </Link>
              {person.graduationYear ? (
                <span className="text-xs font-semibold text-muted-foreground">
                  &apos;{String(person.graduationYear).slice(-2)}
                </span>
              ) : null}
              <AvailabilityBadges person={person} />
            </div>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {role || person.city || person.university || 'School circle member'}
            </p>
          </div>
        </div>

        <div
          className={cn(
            'relative mt-3 grid gap-3',
            showSuggestedAsk && 'sm:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]',
          )}
        >
          <div
            className={cn(
              'bg-primary/[0.04] p-3',
              isListRow ? '' : 'rounded-lg border border-primary/18 bg-card shadow-sm',
            )}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
              Why this match
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground">{matchReason}</p>
          </div>
          {showSuggestedAsk && suggestedAsk ? (
            <div
              className={cn(
                'bg-accent-sage/[0.04] p-3',
                isListRow ? '' : 'rounded-lg border border-accent-sage/18 bg-card shadow-sm',
              )}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Suggested first ask
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground">{suggestedAsk}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col justify-center border-t border-border bg-surface-panel/60 p-4 md:border-l md:border-t-0">
        {person.matchScore !== null && person.matchScore !== undefined ? (
          <div className="mb-3 border-b border-border/70 pb-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Match signal
            </p>
            <p
              className={cn(
                'mt-1 font-heading text-base font-semibold leading-tight',
                matchBandClass(person.matchScore),
              )}
            >
              {matchBandLabel(person.matchScore)}
            </p>
          </div>
        ) : null}
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-primary">
          Next step
        </p>
        <p className="mt-1 text-sm font-semibold leading-snug text-foreground">
          {askType ? 'Start a focused ask' : 'Review their background'}
        </p>
        <div className="mt-3 flex flex-col gap-1.5">
          {askType ? (
            <Button asChild variant="cta" size="sm" className="w-full rounded-lg">
              <Link href={`/ask/new?to=${person.userId}&type=${askType}`}>
                {askLabel}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm" className="w-full rounded-lg">
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
        'group bc-motion-surface overflow-hidden rounded-xl border border-border bg-card p-0 shadow-card-hover transition-all hover:-translate-y-0.5 hover:border-primary/28 hover:shadow-hero',
      )}
    >
      {content}
    </Card>
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
      className="group flex gap-4 rounded-lg border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-md"
    >
      <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', toneClass)}>
        <Check className="size-4" />
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
      className="group flex gap-4 rounded-lg border border-border bg-card p-4 shadow-sm transition-all hover:border-foreground/30 hover:shadow-md"
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] text-primary">
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
    <Card className="rounded-lg border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] text-primary">
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
            <Button asChild size="sm" className="rounded-lg">
              <Link href="/profile/import">Review updates</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-lg">
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

function PersonAvatar({ person }: { person: HelpNetworkPerson }) {
  const display = displayName(person.name, person.preferredName ?? null)
  const initials = display
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  // P3 cleanup: randomized accent-color avatars looked arbitrary — viewers
  // searched for meaning in the color and found none, and three adjacent
  // cards could pull the same rust hue. One muted surface across the board
  // keeps the visual rhythm calm and lets photos do the differentiation.
  return (
    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-surface-subtle">
      {person.avatarUrl ? (
        <Image
          src={person.avatarUrl}
          alt=""
          fill
          sizes="48px"
          unoptimized
          className="object-cover"
        />
      ) : (
        <span className="flex size-full items-center justify-center font-heading text-base font-semibold text-muted-foreground">
          {initials}
        </span>
      )}
    </div>
  )
}

function buildDefaultReason(person: HelpNetworkPerson, query?: string) {
  if (person.mentoringTopics && person.mentoringTopics.length > 0) {
    return `They help with ${person.mentoringTopics.slice(0, 2).join(' and ')}, which fits this question.`
  }
  if (person.currentTitle && person.currentEmployer) {
    return `Their path as ${person.currentTitle} at ${person.currentEmployer} may be useful context.`
  }
  if (person.city)
    return `They are connected to ${person.city}, which may make the conversation more practical.`
  if (query) return 'Their profile has signals that match what you asked for.'
  return null
}

// Match scores come from the LLM reranker (0-100). Surfacing the raw
// percentage made the card read like "AI-matched: 94% compatibility" —
// the algorithmic spectacle voice §5.5 explicitly bans. Bands match the
// reranker's own mental model (90+ strong / 60-89 partial / <60 weak),
// nudged down slightly so the boundaries don't feel arbitrary.
function matchBandLabel(score: number): string {
  if (score >= 85) return 'Strong fit'
  if (score >= 65) return 'Good fit'
  return 'Worth exploring'
}

function matchBandClass(score: number): string {
  if (score >= 85) return 'text-state-success-foreground'
  if (score >= 65) return 'text-state-info-foreground'
  return 'text-muted-foreground'
}

function buildSuggestedAsk(query: string | undefined, person: HelpNetworkPerson) {
  if (query?.trim()) {
    return `Could I ask how you would think about: “${query.trim()}”?`
  }
  if (person.mentoringTopics?.[0]) {
    return `Could I ask for your perspective on ${person.mentoringTopics[0]}?`
  }
  return 'Could I ask for your perspective based on your path?'
}

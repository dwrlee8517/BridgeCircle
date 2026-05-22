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
    <form
      action={action}
      className={cn(
        'relative overflow-hidden rounded-[8px] border border-foreground/12 bg-card shadow-[0_18px_60px_rgb(12_12_11/0.08)]',
        compact ? 'p-2' : 'p-3 sm:p-4',
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-[6px] bg-primary text-primary-foreground">
            <CircleHelp className="size-5" />
          </div>
          <input
            type="search"
            name="q"
            defaultValue={defaultValue}
            placeholder="What are you trying to figure out?"
            className="h-12 min-w-0 flex-1 border-none bg-transparent px-0 text-base font-medium text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-none focus:shadow-none focus:ring-0 sm:text-lg"
          />
        </div>
        <Button type="submit" size={compact ? 'default' : 'lg'} className="rounded-[6px]">
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
    <div className="relative min-h-[280px] overflow-hidden rounded-[8px] border border-border bg-surface-midnight p-5 text-surface-midnight-foreground shadow-[0_24px_70px_rgb(8_17_38/0.24)]">
      <svg className="absolute inset-0 size-full opacity-70" viewBox="0 0 520 320" aria-hidden>
        <defs>
          <linearGradient id="networkLine" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="rgb(147 197 253 / .72)" />
            <stop offset="52%" stopColor="rgb(112 169 130 / .64)" />
            <stop offset="100%" stopColor="rgb(221 161 80 / .58)" />
          </linearGradient>
        </defs>
        <path d="M72 226 C142 92 232 84 312 158 S430 244 478 92" fill="none" stroke="url(#networkLine)" strokeWidth="1.6" />
        <path d="M62 86 C150 138 212 232 318 198 S414 124 466 222" fill="none" stroke="rgb(250 250 249 / .16)" strokeWidth="1" />
        {[72, 156, 252, 336, 448].map((cx, idx) => (
          <g key={cx}>
            <circle cx={cx} cy={[226, 124, 184, 154, 96][idx]} r="8" fill="rgb(250 250 249 / .94)" />
            <circle cx={cx} cy={[226, 124, 184, 154, 96][idx]} r="18" fill="none" stroke="rgb(250 250 249 / .14)" />
          </g>
        ))}
      </svg>
      <div className="relative flex h-full min-h-[240px] flex-col justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary-on-dark">
            Live school circle
          </p>
          <h2 className="mt-2 max-w-sm font-serif text-3xl font-semibold leading-tight">
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
    <div className="rounded-[6px] border border-editorial-rule bg-white/[0.06] p-3">
      <div className="font-serif text-2xl font-semibold leading-none">{value}</div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-surface-midnight-muted">
        {label}
      </div>
    </div>
  )
}

export function MatchBriefCard({
  person,
  query,
  reason,
  compact = false,
}: {
  person: HelpNetworkPerson
  query?: string
  reason?: string | null
  compact?: boolean
}) {
  const display = displayName(person.name, person.preferredName ?? null)
  const role = [person.currentTitle, person.currentEmployer].filter(Boolean).join(' at ')
  const askType = person.isOpenAsAdviceHelper ? 'advice' : person.isOpenAsMentor ? 'mentorship' : null
  const matchReason =
    reason ??
    person.rationale ??
    buildDefaultReason(person, query) ??
    'They are part of your trusted school circle.'
  const suggestedAsk = buildSuggestedAsk(query, person)

  return (
    <Card className={cn('group overflow-hidden rounded-[8px] border-border bg-card p-0 shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/35 hover:shadow-md', compact && 'rounded-[6px]')}>
      <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_190px]">
        <div className="p-5">
          <div className="flex items-start gap-3.5">
            <PersonAvatar person={person} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Link href={`/profile/${person.userId}`} className="font-serif text-lg font-semibold leading-tight text-foreground hover:text-primary">
                  {display}
                </Link>
                {person.graduationYear ? (
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
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

          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
            <div className="rounded-[6px] border border-border bg-surface-subtle/35 p-3">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-primary">
                Why this match
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground">{matchReason}</p>
            </div>
            <div className="rounded-[6px] border border-border bg-card p-3">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Suggested first ask
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground">{suggestedAsk}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between border-t border-border bg-surface-panel/55 p-5 md:border-l md:border-t-0">
          <div className="space-y-3">
            {person.matchScore !== null && person.matchScore !== undefined ? (
              <div>
                <div className="font-serif text-3xl font-semibold leading-none text-foreground">
                  {person.matchScore}%
                </div>
                <p className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Match signal
                </p>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Start with a lightweight ask. They can respond at their own pace.
              </p>
            )}
          </div>
          <div className="mt-5 flex flex-col gap-2">
            {askType ? (
              <Button asChild className="rounded-[6px]">
                <Link href={`/ask/new?to=${person.userId}&type=${askType}`}>
                  Ask {firstName(display)}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline" className="rounded-[6px]">
                <Link href={`/profile/${person.userId}`}>View profile</Link>
              </Button>
            )}
            <Button asChild variant="ghost" className="rounded-[6px]">
              <Link href={`/profile/${person.userId}`}>View profile</Link>
            </Button>
          </div>
        </div>
      </div>
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
  const toneClass =
    tone === 'ochre'
      ? 'bg-warning-tint text-accent-ochre'
      : tone === 'plum'
        ? 'bg-plum-tint text-accent-plum'
        : 'bg-success-tint text-accent-sage'

  return (
    <Link
      href={href}
      className="group block rounded-[8px] border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-md"
    >
      <div className={cn('mb-4 flex size-9 items-center justify-center rounded-[6px]', toneClass)}>
        <Check className="size-4" />
      </div>
      <p className="font-serif text-lg font-semibold leading-tight text-foreground">{title}</p>
      <p className="mt-1 text-xs font-medium text-muted-foreground">{subtitle}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-link group-hover:text-link-hover">
        {cta}
        <ArrowRight className="size-4" />
      </span>
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
  meta: string
  body: string
  href: string
  kind: 'event' | 'announcement'
}) {
  return (
    <Link
      href={href}
      className="group flex gap-4 rounded-[8px] border border-border bg-card p-4 shadow-sm transition-all hover:border-foreground/30 hover:shadow-md"
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-[6px] bg-primary/[0.08] text-primary">
        {kind === 'event' ? <CalendarDays className="size-5" /> : <Sparkles className="size-5" />}
      </div>
      <div className="min-w-0">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {meta}
        </p>
        <p className="mt-1 font-serif text-base font-semibold leading-tight text-foreground">
          {title}
        </p>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </Link>
  )
}

export function FreshnessReviewCard() {
  return (
    <Card className="rounded-[8px] border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[6px] bg-primary/[0.08] text-primary">
          <Sparkles className="size-5" />
        </div>
        <div>
          <p className="font-serif text-lg font-semibold leading-tight text-foreground">
            Keep your profile current so the right people can find you.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Review imported changes, add missing topics, or confirm everything still looks right.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm" className="rounded-[6px]">
              <Link href="/profile/import">Review updates</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-[6px]">
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
  const bg = avatarColor(display)

  return (
    <div className={cn('relative size-12 shrink-0 overflow-hidden rounded-[8px]', bg)}>
      {person.avatarUrl ? (
        <Image src={person.avatarUrl} alt="" fill sizes="48px" unoptimized className="object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center font-serif text-base font-semibold text-background">
          {initials}
        </span>
      )}
    </div>
  )
}

function avatarColor(name: string) {
  const colors = [
    'bg-accent-rust',
    'bg-accent-sage',
    'bg-accent-plum',
    'bg-accent-ochre',
    'bg-primary',
  ]
  let sum = 0
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i)
  return colors[sum % colors.length]
}

function buildDefaultReason(person: HelpNetworkPerson, query?: string) {
  if (person.mentoringTopics && person.mentoringTopics.length > 0) {
    return `They help with ${person.mentoringTopics.slice(0, 2).join(' and ')}, which fits this question.`
  }
  if (person.currentTitle && person.currentEmployer) {
    return `Their path as ${person.currentTitle} at ${person.currentEmployer} may be useful context.`
  }
  if (person.city) return `They are connected to ${person.city}, which may make the conversation more practical.`
  if (query) return 'Their profile has signals that match what you asked for.'
  return null
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

function firstName(name: string) {
  return name.split(/\s+/)[0] ?? name
}

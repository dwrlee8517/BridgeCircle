import { ArrowRight, CalendarDays, MessageCircleQuestion, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

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

// AskBar moved to ./ask-bar.tsx — it grew client behavior (auto-grow
// textarea, Enter-to-submit) and this file stays server-renderable.

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
    <div className="relative min-h-[280px] overflow-hidden rounded-xl border border-border bg-surface-ink p-5 text-surface-ink-foreground shadow-hero">
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
          <p className="text-xs font-semibold uppercase tracking-kicker text-primary-on-dark">
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
      <div className="mt-1 text-kicker font-medium uppercase tracking-label text-surface-ink-muted">
        {label}
      </div>
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
        <p className="text-kicker font-semibold uppercase tracking-label text-muted-foreground">
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

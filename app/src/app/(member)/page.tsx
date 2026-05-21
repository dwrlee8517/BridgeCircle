import { format, formatDistanceToNow } from 'date-fns'
import {
  ArrowRight,
  CalendarDays,
  CalendarX,
  Handshake,
  MapPin,
  Megaphone,
  MessageSquare,
  UserPlus,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import {
  getHomeFeed,
  type HomeActiveMentorship,
  type HomeEvent,
  type HomeMember,
  type HomeNotification,
  type HomePendingMentorRequest,
  type HomeTelemetry,
} from '@/lib/home/getHomeFeed'
import { displayOrgName } from '@/lib/utils'
import CircleMovesToggle from './circle-moves-toggle'

/**
 * Generates a dynamic editorial Daily Brief based on feed updates.
 */
function generateDailyBrief(
  orgName: string,
  recentJoiners: HomeMember[],
  upcomingEvent: HomeEvent | null,
  openMentorsCount: number,
  userCity: string | null,
): string {
  const parts: string[] = []

  if (recentJoiners.length > 0) {
    const primary = recentJoiners[0]
    const yearShort = primary.graduationYear ? `’${String(primary.graduationYear).slice(-2)}` : ''
    const jobText = primary.currentTitle ? ` as [${primary.currentTitle}]` : ''
    const employerText = primary.currentEmployer ? ` at [${primary.currentEmployer}]` : ''
    const locationText = primary.city ? ` in [${primary.city}]` : ''
    parts.push(
      `Recently active: [${primary.name}] (${yearShort})${jobText}${employerText}${locationText} joined the wire feed.`,
    )
  } else {
    parts.push(`Welcome to the daily briefing for [${orgName}].`)
  }

  if (userCity && recentJoiners.length > 1) {
    const localMatch = recentJoiners
      .slice(1)
      .find((m) => m.city?.toLowerCase() === userCity.toLowerCase())
    if (localMatch) {
      const yearShort = localMatch.graduationYear
        ? `’${String(localMatch.graduationYear).slice(-2)}`
        : ''
      parts.push(
        `Local connection: [${localMatch.name}] (${yearShort}) is also based in your city, [${userCity}].`,
      )
    }
  }

  if (openMentorsCount > 0) {
    parts.push(
      `There are [${openMentorsCount} open mentors] available for career advice or craft reviews.`,
    )
  }

  if (upcomingEvent) {
    const dateFormatted = format(new Date(upcomingEvent.startsAt), 'MMM d')
    const locationText = upcomingEvent.location ? ` at [${upcomingEvent.location}]` : ''
    parts.push(
      `On your calendar: the [${upcomingEvent.title}] is scheduled for [${dateFormatted}]${locationText}.`,
    )
  }

  return parts.join(' ')
}

/**
 * Member home dashboard. Restructured to match the professional Civic Editorial design system:
 * structured rails, 2px solid anchor borders, sharp 6px corners, monospace metadata,
 * and a unified layout based on the BridgeCircle Atrium concept.
 */
export default async function HomePage() {
  const session = await requireSession()
  const supabase = await createClient()

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('id, organization_id, organizations(name)')
    .eq('user_id', session.userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (!membership) return null

  const orgName = (membership.organizations as { name: string } | null)?.name ?? 'your network'
  const orgDisplayName = displayOrgName(orgName)

  const [{ data: viewerBase }, { data: viewerOrgProfile }, { data: viewerHelperPrefs }] =
    await Promise.all([
      supabase
        .from('base_profiles')
        .select('name, city')
        .eq('user_id', session.userId)
        .maybeSingle(),
      supabase
        .from('organization_profiles')
        .select('graduation_year')
        .eq('organization_membership_id', membership.id)
        .maybeSingle(),
      supabase
        .from('helper_preferences')
        .select('open_to_advice, open_to_mentorship')
        .eq('organization_membership_id', membership.id)
        .maybeSingle(),
    ])
  const firstName = viewerBase?.name?.split(' ')[0] ?? 'there'
  const cohortYear = viewerOrgProfile?.graduation_year ?? null
  const isHelper = !!(viewerHelperPrefs?.open_to_advice || viewerHelperPrefs?.open_to_mentorship)

  const feed = await getHomeFeed(supabase, membership.organization_id, session.userId)
  const featuredEvent = feed.upcomingEvents[0] ?? null
  const otherEvents = feed.upcomingEvents.slice(1)

  return (
    <div className="min-h-screen bg-background">
      {/* Announcements Banner Strip at top */}
      {feed.latestAnnouncement ? (
        <AnnouncementBanner announcement={feed.latestAnnouncement} />
      ) : null}

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 space-y-8">
        {/* Greeting Strip */}
        <GreetingStrip
          firstName={firstName}
          cohortYear={cohortYear}
          orgName={orgDisplayName}
          stats={feed.stats}
        />

        {/* Asymmetric 2-Column Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[65fr_35fr] items-start">
          {/* Left Column (65%) */}
          <div className="space-y-8">
            <DailyBrief
              text={generateDailyBrief(
                orgDisplayName,
                feed.recentJoiners,
                featuredEvent,
                feed.stats.openMentorsTotal,
                viewerBase?.city ?? null,
              )}
            />

            <CircleTelemetry telemetry={feed.telemetry} />

            <CircleMovesToggle careerMoves={feed.careerMoves} locationMoves={feed.locationMoves} />

            {/* On the wire */}
            <div className="space-y-6">
              <BucketSectionHeader
                title="On the wire"
                count={feed.stats.newJoinersLast7d}
                countLabel="new this week"
                subtitle="A scanning column. Nothing demands a reply — but a name might catch your eye."
              />
              <WireSection
                recentJoiners={feed.recentJoiners}
                notifications={feed.recentNotifications}
              />
            </div>
          </div>

          {/* Right Column (35%) */}
          <div className="space-y-8">
            {/* On your desk (Conditional) */}
            {isHelper && feed.pendingMentorRequests.length > 0 ? (
              <div className="space-y-6">
                <BucketSectionHeader
                  title="On your desk"
                  count={feed.pendingMentorRequests.length}
                  countLabel="waiting"
                  subtitle="People who have asked for your time. Sorted by pending requests."
                />
                <MenteesWaitingSection requests={feed.pendingMentorRequests} />
              </div>
            ) : null}

            {/* Active Mentorships */}
            <ActiveMentorships mentorships={feed.activeMentorships} />

            {/* On your calendar */}
            <div className="space-y-6">
              <BucketSectionHeader
                title="On your calendar"
                count={feed.stats.upcomingEventsTotal}
                countLabel="active"
                subtitle="Suppers, panel talks, and working sessions. RSVP to attend."
              />
              <CalendarSection featured={featuredEvent} otherEvents={otherEvents} />
            </div>

            {/* Quick Actions */}
            <QuickActions stats={feed.stats} />
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Helper Functions for Visual Customization
// =============================================================================

function getInitials(name: string | null): string {
  if (!name) return 'BC'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const AVATAR_COLORS = [
  'bg-emerald-50 text-emerald-800 border-emerald-200/60 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/30',
  'bg-blue-50 text-blue-800 border-blue-200/60 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/30',
  'bg-indigo-50 text-indigo-800 border-indigo-200/60 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-800/30',
  'bg-amber-50 text-amber-800 border-amber-200/60 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/30',
]

function getAvatarBg(name: string | null): string {
  if (!name) return AVATAR_COLORS[0]
  const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return AVATAR_COLORS[charCodeSum % AVATAR_COLORS.length]
}

// =============================================================================
// Bucket Section Header — Crisp 2px border, display title, monospace count
// =============================================================================

function BucketSectionHeader({
  title,
  count,
  countLabel,
  subtitle,
}: {
  title: string
  count: number
  countLabel: string
  subtitle: string
}) {
  return (
    <div className="border-t-2 border-foreground pt-4 mb-4">
      <div className="flex flex-wrap items-baseline gap-2.5">
        <h2 className="font-heading font-semibold text-lg tracking-tight text-foreground">
          {title}
        </h2>
        <span className="font-mono text-[9px] font-bold tracking-[0.14em] uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-[4px] inline-flex items-center gap-1.5">
          <span className="size-1 rounded-full bg-current" />
          {count} {countLabel}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{subtitle}</p>
    </div>
  )
}

// =============================================================================
// Greeting Strip — Clean bone/white card with elegant SVG line motif
// =============================================================================

function GreetingStrip({
  firstName,
  cohortYear,
  orgName,
  stats,
}: {
  firstName: string
  cohortYear: number | null
  orgName: string
  stats: { newJoinersLast7d: number }
}) {
  const cohortText = cohortYear ? `Class of '${`${cohortYear}`.slice(-2)}` : null

  return (
    <Card className="relative overflow-hidden rounded-[6px] border border-border bg-card">
      {/* Editorial stroke-only overlapping circles SVG overlay */}
      <svg
        aria-hidden="true"
        width="340"
        height="200"
        viewBox="0 0 340 200"
        className="absolute -right-12 -top-12 opacity-15 pointer-events-none stroke-primary hidden sm:block"
      >
        <circle cx="130" cy="100" r="72" fill="none" strokeWidth="1.2" />
        <circle cx="202" cy="100" r="72" fill="none" strokeWidth="1.2" />
      </svg>

      <CardContent className="p-6 md:p-8 relative">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {cohortText ? `${cohortText} · ` : ''}Member Dashboard · {orgName}
            </div>
            <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              Welcome back, {firstName}.
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              The professional circle has grown by{' '}
              <span className="font-semibold text-foreground">
                {stats.newJoinersLast7d} members
              </span>{' '}
              recently. Refresh your focus topics, or review what&apos;s open on the desk.
            </p>
          </div>

          <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted-foreground text-left md:text-right shrink-0">
            {format(new Date(), 'EEE d MMM yyyy')}
            <br className="hidden md:block" />
            <span className="text-primary mr-1 md:ml-1">●</span> Edition 142
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Civic Daily Brief — Georgia narrative summaries
// =============================================================================

function DailyBrief({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\])/g)
  const renderText = () => {
    return parts.map((part, i) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        const label = part.slice(1, -1)
        let href = ''
        if (label.toLowerCase().includes('mentor')) {
          href = '/people'
        } else if (
          label.toLowerCase().includes('calendar') ||
          label.toLowerCase().includes('scheduled') ||
          label.toLowerCase().includes('gathering')
        ) {
          href = '/events'
        }

        if (href) {
          return (
            <Link
              // biome-ignore lint/suspicious/noArrayIndexKey: parts split from static brief paragraph
              key={i}
              href={href}
              className="font-mono text-[11px] font-bold tracking-tight text-primary hover:underline underline-offset-2 inline-block mx-0.5"
            >
              [{label}]
            </Link>
          )
        }

        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: parts split from static brief paragraph
            key={i}
            className="font-mono text-[11px] font-bold tracking-tight text-primary border-b border-primary/40 px-0.5"
          >
            {label}
          </span>
        )
      }
      return part
    })
  }

  return (
    <Card className="rounded-[6px] border border-border p-5 border-l-[3px] border-l-primary bg-card">
      <div className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-2.5">
        Daily Brief
      </div>
      <p className="font-serif text-[14.5px] leading-[1.65] text-foreground/90">{renderText()}</p>
    </Card>
  )
}

// =============================================================================
// Civic Circle Telemetry — Cohort stats and cities
// =============================================================================

function CircleTelemetry({ telemetry }: { telemetry: HomeTelemetry }) {
  const maxCount = Math.max(...telemetry.industries.map((ind) => ind.count), 1)

  return (
    <Card className="rounded-[6px] border border-border p-5 bg-card">
      <div className="flex items-center justify-between border-b border-border pb-2.5 mb-4">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Circle Telemetry · Cohort Stats
        </span>
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">
          [Active members]
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Industries Bar Chart */}
        <div className="flex flex-col gap-2.5">
          <h4 className="font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground mb-1">
            Industries
          </h4>
          {telemetry.industries.map((ind) => {
            const pct = (ind.count / maxCount) * 100
            return (
              <div
                key={ind.label}
                className="grid grid-cols-[80px_1fr_24px] items-center gap-2 text-xs"
              >
                <span className="font-medium text-foreground truncate">{ind.label}</span>
                <div className="bg-muted h-1.5 rounded-full overflow-hidden border border-border/30">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] text-muted-foreground text-right tabular-nums">
                  {ind.count}
                </span>
              </div>
            )
          })}
        </div>

        {/* Top Cities List */}
        <div className="flex flex-col">
          <h4 className="font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground mb-2">
            Top Cities
          </h4>
          <div className="divide-y divide-border/60">
            {telemetry.cities.map((c) => (
              <div key={c.city} className="flex justify-between items-center py-2 text-xs">
                <span className="font-medium text-foreground">{c.city}</span>
                <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                  {c.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

// =============================================================================
// Active Mentorships — Ongoing threads
// =============================================================================

function ActiveMentorships({ mentorships }: { mentorships: HomeActiveMentorship[] }) {
  if (mentorships.length === 0) return null

  return (
    <div className="space-y-4">
      <BucketSectionHeader
        title="Active mentorships"
        count={mentorships.length}
        countLabel="active"
        subtitle="Your ongoing structured coaching/mentoring threads. Keep check-ins updated."
      />
      <Card className="rounded-[6px] border border-border p-4 bg-card space-y-4">
        <div className="divide-y divide-border/60">
          {mentorships.map((m, i) => {
            const pct = Math.round((m.goalsMet / m.goalsTotal) * 100)
            return (
              <div
                key={m.id}
                className={`flex flex-col gap-2.5 ${i === 0 ? 'pb-3.5' : 'py-3.5'} first:pt-0 last:pb-0`}
              >
                <div className="flex justify-between items-baseline">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-heading text-sm font-semibold text-foreground">
                      {m.name}
                    </span>
                    <span className="font-mono text-[9px] text-muted-foreground">{m.year}</span>
                  </div>
                  <Link
                    href={`/ask/thread/${m.id}`}
                    className="font-mono text-[9px] font-bold text-primary uppercase hover:underline"
                  >
                    Next: {m.nextCheckIn}
                  </Link>
                </div>

                <div className="text-xs text-muted-foreground">
                  {m.role} at <span className="font-medium text-foreground">{m.org}</span>
                </div>

                <div className="space-y-1.5 mt-0.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">Goals Met</span>
                    <span className="font-semibold text-foreground">
                      {m.goalsMet} / {m.goalsTotal} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted h-1 rounded-full overflow-hidden border border-border/10">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

// =============================================================================
// Quick Actions — Monospace Utility Strips
// =============================================================================

function QuickActions({
  stats,
}: {
  stats: {
    openMentorsTotal: number
    upcomingEventsTotal: number
  }
}) {
  const actions = [
    { label: 'Find a mentor', count: `${stats.openMentorsTotal} open`, href: '/people' },
    { label: 'Browse the network', count: '1,200+ members', href: '/people' },
    { label: 'Upcoming events', count: `${stats.upcomingEventsTotal} active`, href: '/events' },
    { label: 'Update your profile', count: '64% complete', href: '/profile/me' },
  ]

  return (
    <Card className="rounded-[6px] border border-border p-5 bg-card">
      <div className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-4 border-b border-border pb-2.5">
        Quick Actions
      </div>
      <div className="flex flex-col gap-1.5">
        {actions.map((act) => (
          <Link
            key={act.label}
            href={act.href}
            className="border-b border-border/30 hover:border-primary py-2.5 flex justify-between items-center transition-colors group"
          >
            <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
              {act.label}
            </span>
            <span className="font-mono text-[9px] text-muted-foreground group-hover:text-primary transition-colors">
              [{act.count}]
            </span>
          </Link>
        ))}
      </div>
    </Card>
  )
}

// =============================================================================
// Bucket 1 Components: On your desk
// =============================================================================

function MenteesWaitingSection({ requests }: { requests: HomePendingMentorRequest[] }) {
  if (requests.length === 0) {
    return (
      <Card className="rounded-[6px] border border-border">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-xs text-muted-foreground leading-normal max-w-[220px]">
            No pending requests. When someone reaches out, they will land here.
          </p>
          <Button asChild size="sm" variant="outline" className="rounded-[6px] text-xs">
            <Link href="/profile/me">Update craft topics</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map((r) => {
        const yearShort = r.menteeGraduationYear
          ? `'${`${r.menteeGraduationYear}`.slice(-2)}`
          : null
        const initials = getInitials(r.menteeName)
        const avatarBg = getAvatarBg(r.menteeName)
        const askText = r.reason || r.helpNeeded || ''

        return (
          <Card
            key={r.id}
            className="rounded-[6px] border border-border transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-sm"
          >
            <CardContent className="p-4 flex flex-col justify-between h-full space-y-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`size-9 rounded-[4px] border flex items-center justify-center text-xs font-mono font-bold shrink-0 ${avatarBg}`}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-heading text-sm font-semibold text-foreground truncate leading-none">
                      {r.menteeName ?? 'Someone'}
                    </h4>
                    <p className="font-mono text-[9px] text-muted-foreground uppercase mt-1">
                      {yearShort ? `Class of ${yearShort}` : 'Alumnus'}
                    </p>
                  </div>
                </div>
                <StatusBadge
                  tone="warn"
                  className="shrink-0 text-[9px] font-mono tracking-wider uppercase"
                >
                  Pending
                </StatusBadge>
              </div>

              {askText ? (
                <div className="border-l-2 border-primary/20 pl-3 py-0.5">
                  <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground italic">
                    &ldquo;{askText}&rdquo;
                  </p>
                </div>
              ) : null}

              <div className="flex gap-2 pt-1 border-t border-border/40">
                <Button
                  size="sm"
                  asChild
                  className="rounded-[6px] text-xs h-8 px-3.5 bg-primary text-white hover:bg-primary/95 transition active:translate-y-[0.5px]"
                >
                  <Link href={`/ask/${r.id}`}>Reply</Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  asChild
                  className="rounded-[6px] text-xs h-8 px-3.5 hover:bg-muted text-muted-foreground hover:text-foreground active:translate-y-[0.5px]"
                >
                  <Link href={`/profile/${r.id}`}>Profile</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// =============================================================================
// Bucket 2 Components: On your calendar
// =============================================================================

function CalendarSection({
  featured,
  otherEvents,
}: {
  featured: HomeEvent | null
  otherEvents: HomeEvent[]
}) {
  if (!featured) {
    return (
      <Card className="rounded-[6px] border border-border">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-xs text-muted-foreground leading-normal max-w-[220px]">
            No gatherings on the calendar right now. Stay tuned for suppers and office hours.
          </p>
          <Button asChild size="sm" variant="outline" className="rounded-[6px] text-xs">
            <Link href="/events">View past events</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const start = new Date(featured.startsAt)
  // eslint-disable-next-line react-hooks/purity
  const daysDiff = Math.max(0, Math.round((start.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

  const capacityPct = featured.capacity
    ? Math.min(100, Math.round((featured.goingCount / featured.capacity) * 100))
    : 0

  return (
    <div className="space-y-4">
      {/* Featured Event Hero */}
      <Card className="overflow-hidden rounded-[6px] border border-border transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm">
        {/* Structured header block */}
        <div className="relative border-b border-border bg-muted/20 p-4">
          <div className="flex justify-between items-center">
            <span className="font-mono text-[9px] font-bold tracking-[0.14em] uppercase text-primary">
              Featured Gathering
            </span>
            <span className="font-mono text-[9px] font-semibold uppercase tracking-wider bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 px-2 py-0.5 rounded">
              {daysDiff === 0 ? 'Today' : daysDiff === 1 ? 'Tomorrow' : `T-${daysDiff}d`}
            </span>
          </div>
          <h3 className="mt-2.5 font-heading text-base font-semibold tracking-tight text-foreground line-clamp-1">
            {featured.title}
          </h3>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2.5 text-foreground font-medium">
              <CalendarDays className="size-3.5 text-primary" />
              <span>{format(start, 'MMM d, yyyy · h:mm a')}</span>
            </div>
            {featured.location ? (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{featured.location}</span>
              </div>
            ) : null}
          </div>

          {/* Attendance progress meter */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-muted-foreground">Attendance</span>
              <span className="font-semibold text-foreground">
                {featured.goingCount}
                {featured.capacity ? ` / ${featured.capacity}` : ''} RSVP&apos;d
              </span>
            </div>
            {featured.capacity ? (
              <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden border border-border/30">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${capacityPct}%` }}
                />
              </div>
            ) : null}
          </div>

          <Button
            asChild
            className="w-full rounded-[6px] text-xs h-8.5 bg-foreground text-background hover:bg-foreground/90 transition active:translate-y-[0.5px]"
          >
            <Link href={`/events/${featured.id}`}>View event</Link>
          </Button>
        </div>
      </Card>

      {/* Mini Cards list for other events */}
      {otherEvents.length > 0 ? (
        <div className="space-y-2.5">
          {otherEvents.slice(0, 2).map((e) => {
            const eStart = new Date(e.startsAt)
            return (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
                className="group block rounded-[6px] border border-border/70 p-3 bg-card transition hover:border-primary/40 hover:shadow-xs"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-heading text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {e.title}
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {format(eStart, 'MMM d · h:mm a')}
                    </p>
                  </div>
                  <ArrowRight className="size-3.5 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

// =============================================================================
// Bucket 3 Components: On the wire
// =============================================================================

function WireSection({
  recentJoiners,
  notifications,
}: {
  recentJoiners: HomeMember[]
  notifications: HomeNotification[]
}) {
  const joinersSubset = recentJoiners.slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Recently Joined List */}
      <Card className="rounded-[6px] border border-border p-4 bg-card">
        <h3 className="font-mono text-[9px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-3">
          Recently Joined
        </h3>
        {joinersSubset.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">
            No new alumni joined recently.
          </p>
        ) : (
          <div className="divide-y divide-border/50">
            {joinersSubset.map((m) => {
              const yearShort = m.graduationYear ? `'${`${m.graduationYear}`.slice(-2)}` : null
              const initials = getInitials(m.name)
              const avatarBg = getAvatarBg(m.name)

              return (
                <Link
                  key={m.userId}
                  href={`/profile/${m.userId}`}
                  className="group flex items-start gap-3 py-3 first:pt-0 last:pb-0 transition hover:bg-muted/10 rounded-[4px] px-1 -mx-1"
                >
                  <div
                    className={`size-8 rounded-[4px] border flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${avatarBg}`}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-heading text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {m.name ?? '—'}
                      </h4>
                      {yearShort ? (
                        <span className="font-mono text-[9px] text-muted-foreground">
                          {yearShort}
                        </span>
                      ) : null}
                    </div>
                    {m.currentTitle || m.currentEmployer ? (
                      <p className="truncate text-[10px] text-muted-foreground mt-0.5 leading-snug">
                        {m.currentTitle ? <span>{m.currentTitle}</span> : null}
                        {m.currentTitle && m.currentEmployer ? <span> at </span> : null}
                        {m.currentEmployer ? (
                          <span className="font-medium text-foreground">{m.currentEmployer}</span>
                        ) : null}
                      </p>
                    ) : (
                      m.city && <p className="text-[10px] text-muted-foreground mt-0.5">{m.city}</p>
                    )}
                  </div>
                  <ArrowRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 self-center" />
                </Link>
              )
            })}
          </div>
        )}
      </Card>

      {/* Activity Wire */}
      <Card className="rounded-[6px] border border-border p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/20">
          <h3 className="font-mono text-[9px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            Recent activity
          </h3>
          <Link href="/inbox" className="text-[10px] font-semibold text-primary hover:underline">
            Inbox →
          </Link>
        </div>
        {notifications.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-xs text-muted-foreground">No recent activity.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {notifications.slice(0, 3).map((n) => (
              <li key={n.id}>
                <NotificationRow notification={n} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function NotificationRow({ notification: n }: { notification: HomeNotification }) {
  const unread = n.readAt === null
  const { Icon, tone } = iconForType(n.type)
  const href = notificationHref(n)
  const label = notificationCopy(n)

  const content = (
    <div
      className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40 ${
        unread ? 'bg-primary/[0.02]' : ''
      }`}
    >
      <div
        className="flex size-7 shrink-0 items-center justify-center rounded-[4px] border border-border/50 bg-card"
        style={{ color: tone }}
      >
        <Icon className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`text-[11px] leading-snug truncate ${
            unread ? 'font-semibold text-foreground' : 'font-medium text-foreground'
          }`}
        >
          {label}
        </p>
        <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5 block">
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
        </span>
      </div>
      {unread ? (
        <div aria-hidden className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
      ) : null}
    </div>
  )

  return href ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : (
    content
  )
}

function iconForType(type: string): { Icon: typeof Handshake; tone: string } {
  switch (type) {
    case 'ask_received':
    case 'ask_accepted':
    case 'ask_declined':
      return { Icon: Handshake, tone: 'var(--primary)' }
    case 'friend_request_received':
    case 'friend_request_accepted':
      return { Icon: UserPlus, tone: '#165e34' }
    case 'direct_message':
    case 'ask_message':
      return { Icon: MessageSquare, tone: 'var(--primary)' }
    case 'announcement':
      return { Icon: Megaphone, tone: '#b25e00' }
    case 'event_canceled':
      return { Icon: CalendarX, tone: '#9b2c1f' }
    default:
      return { Icon: Handshake, tone: 'var(--primary)' }
  }
}

function notificationCopy(n: HomeNotification): string {
  const actor = typeof n.payload?.actor_name === 'string' ? n.payload.actor_name : 'Someone'
  switch (n.type) {
    case 'friend_request_received':
      return `${actor} sent you a friend request`
    case 'friend_request_accepted':
      return `${actor} accepted your friend request`
    case 'ask_received':
      return `${actor} requested mentorship`
    case 'ask_accepted':
      return `${actor} accepted your mentorship request`
    case 'ask_declined':
      return `${actor} declined your mentorship request`
    case 'direct_message':
      return `New message from ${actor}`
    case 'ask_message':
      return `${actor} sent a mentorship message`
    case 'announcement':
      return typeof n.payload?.title === 'string' ? n.payload.title : 'New announcement'
    case 'event_canceled': {
      const title = typeof n.payload?.event_title === 'string' ? n.payload.event_title : 'An event'
      return `${title} was canceled`
    }
    default:
      return 'New activity'
  }
}

function notificationHref(n: HomeNotification): string | null {
  switch (n.type) {
    case 'friend_request_received':
      return '/inbox'
    case 'friend_request_accepted':
      return n.targetId ? `/profile/${n.targetId}` : '/inbox'
    case 'ask_received':
    case 'ask_declined':
      return n.targetId ? `/ask/${n.targetId}` : '/inbox'
    case 'ask_accepted':
      return n.targetId ? `/ask/thread/${n.targetId}` : '/inbox'
    case 'direct_message':
      return n.targetId ? `/messages/${n.targetId}` : '/inbox'
    case 'ask_message':
      return n.targetId ? `/ask/thread/${n.targetId}` : '/inbox'
    case 'announcement':
      return '/announcements'
    case 'event_canceled':
      return n.targetId ? `/events/${n.targetId}` : '/events'
    default:
      return null
  }
}

// =============================================================================
// Announcement Banner — Low profile banner at the very top of dashboard
// =============================================================================

function AnnouncementBanner({
  announcement,
}: {
  announcement: { id: string; title: string; body: string | null; publishedAt: string }
}) {
  return (
    <Link
      href="/announcements"
      className="block border-b border-border bg-primary/[0.03] transition hover:bg-primary/[0.06]"
    >
      <div className="mx-auto max-w-6xl px-4 py-2.5 sm:px-8 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <Megaphone className="size-3.5 text-primary shrink-0" />
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-primary shrink-0">
            Announcement
          </span>
          <span className="text-muted-foreground shrink-0 hidden sm:inline">·</span>
          <span className="font-medium text-foreground truncate">{announcement.title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-[10px] text-muted-foreground font-medium">
          <span>
            {formatDistanceToNow(new Date(announcement.publishedAt), { addSuffix: true })}
          </span>
          <ArrowRight className="size-3 text-muted-foreground" />
        </div>
      </div>
    </Link>
  )
}

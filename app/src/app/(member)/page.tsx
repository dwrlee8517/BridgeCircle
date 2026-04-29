import { format, formatDistanceToNow } from 'date-fns'
import { ArrowRight, Calendar, MapPin, Megaphone, Sparkles, Users } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { getHomeFeed, type HomeEvent, type HomeMember } from '@/lib/home/getHomeFeed'
import { displayOrgName } from '@/lib/utils'

/**
 * Member home dashboard. Three columns of curated content + an optional
 * announcement banner above. Replaces the old `/` → `/search` redirect with
 * something the user actually wants to land on after sign-in.
 *
 * Layout choices:
 *   - Hero greeting + 3 stats so the page feels alive even when sections are short
 *   - Announcement strip (only when a recent one exists) — high-signal, dismiss-by-scrolling
 *   - 3-column grid: Recent joiners | Open mentors | Upcoming events
 *   - Each section has its own "see all" link to the full route
 *
 * Empty cells inside any section degrade to a small CTA rather than blank space.
 */
export default async function HomePage() {
  const session = await requireSession()
  const supabase = await createClient()

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('organization_id, organizations(name)')
    .eq('user_id', session.userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (!membership) return null

  const orgName = (membership.organizations as { name: string } | null)?.name ?? 'your network'
  const orgDisplayName = displayOrgName(orgName)

  const { data: viewerBase } = await supabase
    .from('base_profiles')
    .select('name')
    .eq('user_id', session.userId)
    .maybeSingle()
  const firstName = viewerBase?.name?.split(' ')[0] ?? 'there'

  const feed = await getHomeFeed(supabase, membership.organization_id)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      <Hero firstName={firstName} orgName={orgDisplayName} stats={feed.stats} />

      {feed.latestAnnouncement ? (
        <AnnouncementBanner announcement={feed.latestAnnouncement} />
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section aria-labelledby="recent-joiners">
          <SectionHeader
            id="recent-joiners"
            icon={<Sparkles className="size-4" />}
            title="Recently joined"
            seeAll={{ href: '/search', label: 'View directory' }}
          />
          <MemberList members={feed.recentJoiners} emptyText="No new joiners this month." />
        </section>

        <section aria-labelledby="open-mentors">
          <SectionHeader
            id="open-mentors"
            icon={<Users className="size-4" />}
            title="Open to mentor"
            seeAll={{ href: '/search?openToMentor=true', label: 'See all mentors' }}
          />
          <MemberList
            members={feed.openMentors}
            emptyText="No mentors are open right now."
            mentorBadge
          />
        </section>

        <section aria-labelledby="upcoming-events">
          <SectionHeader
            id="upcoming-events"
            icon={<Calendar className="size-4" />}
            title="Upcoming events"
            seeAll={{ href: '/events', label: 'View all events' }}
          />
          <EventList events={feed.upcomingEvents} />
        </section>
      </div>
    </div>
  )
}

// =============================================================================
// Hero — greeting + 3 stats. Sets the tone for the rest of the page.
// =============================================================================
function Hero({
  firstName,
  orgName,
  stats,
}: {
  firstName: string
  orgName: string
  stats: { newJoinersLast7d: number; openMentorsTotal: number; upcomingEventsTotal: number }
}) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back, {firstName}.</h1>
        <p className="mt-1 text-muted-foreground">
          {heroSubline(stats)}{' '}
          <Link
            href="/search"
            className="font-medium text-primary hover:underline underline-offset-2"
          >
            Browse the directory →
          </Link>
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 rounded-xl border bg-accent/40 p-1">
        <StatTile value={stats.newJoinersLast7d} label="new this week" />
        <StatTile value={stats.openMentorsTotal} label="open to mentor" />
        <StatTile value={stats.upcomingEventsTotal} label="upcoming events" />
      </div>

      <p className="sr-only">{orgName}</p>
    </div>
  )
}

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg bg-background px-4 py-3 text-center">
      <div className="text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

function heroSubline(stats: {
  newJoinersLast7d: number
  openMentorsTotal: number
  upcomingEventsTotal: number
}) {
  const n = stats.newJoinersLast7d
  if (n === 0) return 'Quiet week. A good time to refresh your profile or reach out to a mentor.'
  if (n === 1) return 'One alum joined this week.'
  return `${n} alumni joined this week.`
}

// =============================================================================
// Announcement strip — accent-tinted, only when a recent announcement exists.
// =============================================================================
function AnnouncementBanner({
  announcement,
}: {
  announcement: { id: string; title: string; body: string | null; publishedAt: string }
}) {
  return (
    <Link
      href="/announcements"
      className="block rounded-xl border border-primary/20 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
    >
      <div className="flex items-start gap-3">
        <Megaphone className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-primary">
              Latest announcement
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(announcement.publishedAt), { addSuffix: true })}
            </span>
          </div>
          <p className="mt-0.5 truncate font-medium">{announcement.title}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{announcement.body}</p>
        </div>
        <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
      </div>
    </Link>
  )
}

// =============================================================================
// Section header — icon + title + "see all" link.
// =============================================================================
function SectionHeader({
  id,
  icon,
  title,
  seeAll,
}: {
  id: string
  icon: React.ReactNode
  title: string
  seeAll: { href: string; label: string }
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 id={id} className="flex items-center gap-2 text-base font-semibold">
        <span className="text-muted-foreground">{icon}</span>
        {title}
      </h2>
      <Link
        href={seeAll.href}
        className="text-xs font-medium text-muted-foreground hover:text-primary"
      >
        {seeAll.label}
      </Link>
    </div>
  )
}

// =============================================================================
// Member list — used by both Recent joiners and Open mentors.
// =============================================================================
function MemberList({
  members,
  emptyText,
  mentorBadge = false,
}: {
  members: HomeMember[]
  emptyText: string
  mentorBadge?: boolean
}) {
  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-muted-foreground">{emptyText}</p>
          <Button asChild size="sm" variant="outline">
            <Link href="/search">Open directory</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }
  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-y">
          {members.map((m) => (
            <li key={m.userId}>
              <MemberMiniRow member={m} mentorBadge={mentorBadge} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function MemberMiniRow({ member, mentorBadge }: { member: HomeMember; mentorBadge: boolean }) {
  const subtitle = [member.currentTitle, member.currentEmployer].filter(Boolean).join(' · ')
  return (
    <Link
      href={`/profile/${member.userId}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
    >
      <Avatar className="size-10 shrink-0">
        {member.avatarUrl ? <AvatarImage src={member.avatarUrl} alt={member.name ?? ''} /> : null}
        <AvatarFallback>{(member.name ?? '?').slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{member.name ?? '—'}</span>
          {member.graduationYear ? (
            <span className="text-xs text-muted-foreground tabular-nums">
              '{`${member.graduationYear}`.slice(-2)}
            </span>
          ) : null}
          {mentorBadge ? (
            <StatusBadge tone="open" dot className="ml-auto">
              Mentor
            </StatusBadge>
          ) : null}
        </div>
        {subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : member.city ? (
          <p className="truncate text-xs text-muted-foreground">{member.city}</p>
        ) : null}
      </div>
    </Link>
  )
}

// =============================================================================
// Event list — denser cards with date chip on the left.
// =============================================================================
function EventList({ events }: { events: HomeEvent[] }) {
  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-muted-foreground">No upcoming events.</p>
          <Button asChild size="sm" variant="outline">
            <Link href="/events">View past events</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }
  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-y">
          {events.map((e) => (
            <li key={e.id}>
              <EventMiniRow event={e} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function EventMiniRow({ event }: { event: HomeEvent }) {
  const start = new Date(event.startsAt)
  return (
    <Link
      href={`/events/${event.id}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
    >
      <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-md border bg-accent/40 text-center">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {format(start, 'MMM')}
        </span>
        <span className="text-base font-semibold leading-none">{format(start, 'd')}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{event.title}</p>
        <p className="text-xs text-muted-foreground">{format(start, 'EEE · h:mm a')}</p>
        {event.location ? (
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            {event.location}
          </p>
        ) : null}
      </div>
      <div className="shrink-0 text-right">
        <div className="text-xs font-medium tabular-nums">
          {event.goingCount}
          {event.capacity ? (
            <span className="text-muted-foreground"> / {event.capacity}</span>
          ) : null}
        </div>
        <div className="text-[10px] text-muted-foreground">going</div>
      </div>
    </Link>
  )
}

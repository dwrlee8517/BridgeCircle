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
  type HomeEvent,
  type HomeMember,
  type HomeNotification,
  type HomePendingMentorRequest,
} from '@/lib/home/getHomeFeed'
import { displayOrgName } from '@/lib/utils'

/**
 * Member home dashboard. Modeled after the BridgeCircle Design System
 * prototype's "Network" screen: dark midnight hero with the editorial Fraunces
 * greeting, then a 2-column body — mentees waiting + new alumni on the left,
 * featured event + recent activity on the right.
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

  const [{ data: viewerBase }, { data: viewerOrgProfile }] = await Promise.all([
    supabase.from('base_profiles').select('name').eq('user_id', session.userId).maybeSingle(),
    supabase
      .from('organization_profiles')
      .select('graduation_year')
      .eq('organization_membership_id', membership.id)
      .maybeSingle(),
  ])
  const firstName = viewerBase?.name?.split(' ')[0] ?? 'there'
  const cohortYear = viewerOrgProfile?.graduation_year ?? null

  const feed = await getHomeFeed(supabase, membership.organization_id, session.userId)
  const featuredEvent = feed.upcomingEvents[0] ?? null

  return (
    <div>
      <Hero
        firstName={firstName}
        cohortYear={cohortYear}
        orgName={orgDisplayName}
        pendingCount={feed.pendingMentorRequests.length}
        nextEvent={featuredEvent}
        stats={feed.stats}
      />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
        {feed.latestAnnouncement ? (
          <div className="mb-8">
            <AnnouncementBanner announcement={feed.latestAnnouncement} />
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-12 lg:col-span-2">
            <MenteesWaitingSection requests={feed.pendingMentorRequests} />
            <NewAlumniSection members={feed.recentJoiners} />
          </div>

          <div className="space-y-6">
            <FeaturedEventCard event={featuredEvent} />
            <NotificationFeed notifications={feed.recentNotifications} />
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Hero — dark midnight gradient with dot grid + decorative two-circle motif.
// =============================================================================

function Hero({
  firstName,
  cohortYear,
  orgName,
  pendingCount,
  nextEvent,
  stats,
}: {
  firstName: string
  cohortYear: number | null
  orgName: string
  pendingCount: number
  nextEvent: HomeEvent | null
  stats: {
    newJoinersLast7d: number
    openMentorsTotal: number
    upcomingEventsTotal: number
  }
}) {
  const greeting = greetingForHour(new Date().getHours())
  const subline = heroSubline(pendingCount, nextEvent)
  const statItems = [
    { value: stats.newJoinersLast7d.toLocaleString(), label: 'Joined this week' },
    { value: stats.openMentorsTotal.toLocaleString(), label: 'Open mentors' },
    { value: stats.upcomingEventsTotal.toLocaleString(), label: 'Upcoming events' },
    {
      value: cohortYear ? `Class '${`${cohortYear}`.slice(-2)}` : 'Member',
      label: 'Your cohort',
    },
  ]
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0b1220_0%,#131b2e_50%,#1e293b_100%)] text-white">
      <div
        aria-hidden
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: 'radial-gradient(rgba(180,197,255,0.10) 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
        }}
      />
      <svg
        aria-hidden="true"
        role="presentation"
        viewBox="0 0 520 380"
        className="absolute -top-10 right-[-60px] h-[380px] w-[520px] opacity-20"
      >
        <title>Decorative two-circle motif</title>
        <circle cx="200" cy="190" r="140" fill="none" stroke="#b4c5ff" strokeWidth="1.5" />
        <circle cx="320" cy="190" r="140" fill="none" stroke="#316bf3" strokeWidth="1.5" />
      </svg>

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-20">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b4c5ff]">
          {cohortYear ? `Class of '${`${cohortYear}`.slice(-2)} · ` : ''}Welcome back to {orgName}
        </p>
        <h1
          className="bc-fraunces mt-3 max-w-4xl text-balance text-4xl font-bold leading-[1.05] tracking-[-0.025em] sm:text-5xl md:text-[56px]"
          style={{ fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 25' }}
        >
          {greeting}, {firstName}.
          <br />
          <span className="text-[#b4c5ff]">Your circle is active today.</span>
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300 sm:text-[17px]">
          {subline}
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button size="lg" asChild className="gap-2">
            <Link href="/inbox">
              <Handshake className="size-4" />
              Review mentor requests
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/events">
              <CalendarDays className="size-4" />
              Upcoming events
            </Link>
          </Button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            marginTop: 56,
            borderTop: '1px solid rgba(180,197,255,.18)',
            paddingTop: 28,
          }}
        >
          {statItems.map((item, index) => (
            <div
              key={item.label}
              style={{
                minWidth: 0,
                borderLeft: index === 0 ? 'none' : '1px solid rgba(180,197,255,.18)',
                padding: '0 24px',
              }}
            >
              <div
                className="bc-fraunces"
                style={{
                  color: '#ffffff',
                  fontSize: 32,
                  fontWeight: 700,
                  letterSpacing: '-.02em',
                  lineHeight: 1.2,
                  fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 25',
                }}
              >
                {item.value}
              </div>
              <div
                style={{
                  color: '#94a3b8',
                  fontSize: 13,
                  lineHeight: 1.35,
                  marginTop: 4,
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function heroSubline(pendingCount: number, nextEvent: HomeEvent | null): string {
  const parts: string[] = []
  if (pendingCount === 1) parts.push('One mentee is waiting on your reply')
  else if (pendingCount > 1) parts.push(`${pendingCount} mentees are waiting on your reply`)
  if (nextEvent) {
    const days = Math.max(
      0,
      Math.round((new Date(nextEvent.startsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    )
    if (days === 0) parts.push(`${nextEvent.title} is today`)
    else if (days === 1) parts.push(`${nextEvent.title} is tomorrow`)
    else parts.push(`${nextEvent.title} is ${days} days out`)
  }
  if (parts.length === 0) {
    return 'Quiet across the network today. A good moment to refresh your profile or send an intro.'
  }
  return `${parts.join(', and ')}.`
}

// =============================================================================
// Section header — eyebrow + Fraunces title + view-all link, prototype style.
// =============================================================================

function SectionHeader({
  eyebrow,
  title,
  actionHref,
  actionLabel,
}: {
  eyebrow: string
  title: string
  actionHref?: string
  actionLabel?: string
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </p>
        <h2
          className="bc-fraunces mt-1.5 text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-[28px]"
          style={{ fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 25' }}
        >
          {title}
        </h2>
      </div>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="text-sm font-semibold text-primary hover:underline">
          {actionLabel} →
        </Link>
      ) : null}
    </div>
  )
}

// =============================================================================
// Mentees waiting on you — pending mentor requests directed at the viewer.
// =============================================================================

function MenteesWaitingSection({ requests }: { requests: HomePendingMentorRequest[] }) {
  return (
    <section aria-labelledby="mentees-waiting">
      <SectionHeader
        eyebrow="Mentorship"
        title="Mentees waiting on you"
        actionHref="/inbox"
        actionLabel={requests.length > 0 ? `View all ${requests.length}` : undefined}
      />
      <h2 id="mentees-waiting" className="sr-only">
        Mentees waiting on you
      </h2>
      {requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No pending mentor requests. When a mentee reaches out, they&apos;ll appear here.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/mentorship/settings">Mentor settings</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <MenteeRequestCard key={r.id} request={r} />
          ))}
        </div>
      )}
    </section>
  )
}

function MenteeRequestCard({ request }: { request: HomePendingMentorRequest }) {
  const yearShort = request.menteeGraduationYear
    ? `'${`${request.menteeGraduationYear}`.slice(-2)}`
    : null
  const ask = request.reason || request.helpNeeded || ''
  return (
    <Card className="transition-all hover:border-primary/60 hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-foreground">
            {request.menteeName ?? 'Someone'}
          </h3>
          {yearShort ? (
            <span className="inline-flex h-5 items-center rounded-full bg-muted px-2 text-xs font-medium text-muted-foreground">
              Class of {yearShort}
            </span>
          ) : null}
          <StatusBadge tone="warn">Pending response</StatusBadge>
        </div>
        {ask ? (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            &ldquo;{ask}&rdquo;
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href={`/ask/${request.id}`}>Review request</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link href={`/ask/${request.id}`}>View profile</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// New alumni in your area — V3+ profile tiles, 3-up grid.
// =============================================================================

function NewAlumniSection({ members }: { members: HomeMember[] }) {
  const subset = members.slice(0, 3)
  return (
    <section aria-labelledby="new-alumni">
      <SectionHeader
        eyebrow="Network"
        title="New alumni in your area"
        actionHref="/discover"
        actionLabel="Open directory"
      />
      <h2 id="new-alumni" className="sr-only">
        New alumni in your area
      </h2>
      {subset.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">No new joiners this week.</p>
            <Button asChild size="sm" variant="outline">
              <Link href="/discover">Browse the directory</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subset.map((m) => (
            <ProfileTile key={m.userId} member={m} />
          ))}
        </div>
      )}
    </section>
  )
}

function ProfileTile({ member }: { member: HomeMember }) {
  const yearShort = member.graduationYear ? `'${`${member.graduationYear}`.slice(-2)}` : null
  return (
    <Link
      href={`/profile/${member.userId}`}
      className="group block rounded-lg border bg-card p-5 transition-all hover:border-primary/60 hover:shadow-md"
    >
      <h3
        className="bc-fraunces truncate text-lg font-semibold text-foreground"
        style={{ fontVariationSettings: '"SOFT" 50, "opsz" 22' }}
      >
        {member.name ?? '—'}
      </h3>
      {member.currentTitle || member.currentEmployer ? (
        <p className="mt-1 line-clamp-2 text-[13px] font-medium text-foreground">
          {member.currentTitle ? <span>{member.currentTitle}</span> : null}
          {member.currentTitle && member.currentEmployer ? <span> at </span> : null}
          {member.currentEmployer ? (
            <span className="font-semibold">{member.currentEmployer}</span>
          ) : null}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {yearShort ? (
          <span className="inline-flex h-5 items-center rounded-full bg-muted px-2 text-xs font-medium text-muted-foreground">
            {yearShort}
          </span>
        ) : null}
        {member.city ? <span className="text-xs text-muted-foreground">{member.city}</span> : null}
      </div>
      <p className="bc-pull-quote mt-3 line-clamp-3 text-[13px] text-foreground">
        &ldquo;Open to mentoring junior alumni in the network.&rdquo;
      </p>
    </Link>
  )
}

// =============================================================================
// Featured event card — gradient header + meta + RSVP CTA.
// =============================================================================

function FeaturedEventCard({ event }: { event: HomeEvent | null }) {
  if (!event) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-muted-foreground">No upcoming events.</p>
          <Button asChild size="sm" variant="outline">
            <Link href="/events">Browse all events</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }
  const start = new Date(event.startsAt)
  return (
    <Card className="overflow-hidden p-0">
      <div className="relative h-[110px] overflow-hidden bg-[linear-gradient(135deg,#0b1220_0%,#0051d5_100%)] p-5 text-white">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,.10) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />
        <p className="relative text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b4c5ff]">
          Featured event
        </p>
        <h3
          className="bc-fraunces relative mt-2 truncate text-xl font-bold tracking-[-0.015em]"
          style={{ fontVariationSettings: '"SOFT" 50, "opsz" 25' }}
        >
          {event.title}
        </h3>
      </div>
      <div className="p-5">
        <div className="mb-2 flex items-center gap-2.5 text-sm font-semibold text-foreground">
          <CalendarDays className="size-4 text-primary" />
          <span>{format(start, 'MMM d, yyyy · h:mm a')}</span>
        </div>
        {event.location ? (
          <div className="mb-4 flex items-center gap-2.5 text-sm text-muted-foreground">
            <MapPin className="size-4 text-primary" />
            <span className="truncate">{event.location}</span>
          </div>
        ) : null}
        <div className="mb-4 flex items-center justify-between border-y py-3 text-sm">
          <span className="text-muted-foreground">
            {event.goingCount}
            {event.capacity ? <span> / {event.capacity}</span> : null} attending
          </span>
        </div>
        <Button asChild className="w-full">
          <Link href={`/events/${event.id}`}>View event</Link>
        </Button>
      </div>
    </Card>
  )
}

// =============================================================================
// Recent activity feed — last 4 notifications, prototype-style row layout.
// =============================================================================

function NotificationFeed({ notifications }: { notifications: HomeNotification[] }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <h3 className="text-sm font-semibold text-foreground">Recent activity</h3>
        <Link href="/notifications" className="text-xs font-semibold text-primary hover:underline">
          View all
        </Link>
      </div>
      {notifications.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        </div>
      ) : (
        <ul>
          {notifications.map((n, i) => (
            <li key={n.id} className={i === notifications.length - 1 ? '' : 'border-b'}>
              <NotificationRow notification={n} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function NotificationRow({ notification: n }: { notification: HomeNotification }) {
  const unread = n.readAt === null
  const { Icon, tone } = iconForType(n.type)
  const href = notificationHref(n)
  const label = notificationCopy(n)
  const content = (
    <div
      className={`flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-muted/40 ${
        unread ? 'bg-primary/[0.03]' : ''
      }`}
    >
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-full"
        style={{ background: `${tone}26`, color: tone }}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`text-[13px] leading-snug ${
            unread ? 'font-semibold text-foreground' : 'font-medium text-foreground'
          }`}
        >
          {label}
        </p>
        <span className="text-[11px] text-muted-foreground">
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
        </span>
      </div>
      {unread ? (
        <div aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
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
      return { Icon: Handshake, tone: '#0051d5' }
    case 'friend_request_received':
    case 'friend_request_accepted':
      return { Icon: UserPlus, tone: '#10b981' }
    case 'direct_message':
    case 'ask_message':
      return { Icon: MessageSquare, tone: '#0051d5' }
    case 'announcement':
      return { Icon: Megaphone, tone: '#f59e0b' }
    case 'event_canceled':
      return { Icon: CalendarX, tone: '#ba1a1a' }
    default:
      return { Icon: Handshake, tone: '#0051d5' }
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
      return '/friends'
    case 'friend_request_accepted':
      return n.targetId ? `/profile/${n.targetId}` : '/friends'
    case 'ask_received':
    case 'ask_declined':
      return n.targetId ? `/ask/${n.targetId}` : '/inbox'
    case 'ask_accepted':
      return n.targetId ? `/ask/thread/${n.targetId}` : '/inbox'
    case 'direct_message':
      return n.targetId ? `/messages/${n.targetId}` : '/messages'
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
// Announcement strip — preserved from prior implementation.
// =============================================================================

function AnnouncementBanner({
  announcement,
}: {
  announcement: { id: string; title: string; body: string | null; publishedAt: string }
}) {
  return (
    <Link href="/announcements" className="block">
      <Card className="border-transparent bg-muted transition-shadow hover:shadow-md">
        <CardContent className="flex items-start gap-3 p-4">
          <Megaphone className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                Latest announcement
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(announcement.publishedAt), { addSuffix: true })}
              </span>
            </div>
            <p className="mt-0.5 truncate font-semibold text-foreground">{announcement.title}</p>
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{announcement.body}</p>
          </div>
          <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  )
}

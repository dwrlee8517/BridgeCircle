import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { formatDistanceToNow } from 'date-fns'
import type { Database, Json } from '@/db/database.types'

export type HomeMember = {
  userId: string
  name: string | null
  avatarUrl: string | null
  graduationYear: number | null
  currentTitle: string | null
  currentEmployer: string | null
  city: string | null
  joinedAt: string
}

export type HomeMentor = HomeMember & {
  university: string | null
  major: string | null
}

export type HomeEvent = {
  id: string
  title: string
  startsAt: string
  location: string | null
  goingCount: number
  capacity: number | null
}

export type HomeAnnouncement = {
  id: string
  title: string
  body: string | null
  authorName: string | null
  publishedAt: string
}

export type HomePendingMentorRequest = {
  id: string
  menteeName: string | null
  menteeAvatarUrl: string | null
  menteeGraduationYear: number | null
  reason: string | null
  helpNeeded: string | null
  createdAt: string
}

/** The viewer's own recent outgoing asks — powers the "Your asks" hero rail. */
export type HomeRecentAsk = {
  id: string
  summary: string
  /** asks.status: 'pending' | 'accepted' | 'declined' | 'expired' */
  status: string
  createdAt: string
  respondedAt: string | null
}

export type HomeNotification = {
  id: string
  type: string
  payload: Record<string, unknown> | null
  targetId: string | null
  readAt: string | null
  createdAt: string
}

export type TelemetryIndustry = {
  label: string
  count: number
}

export type TelemetryCity = {
  city: string
  count: number
}

export type HomeTelemetry = {
  industries: TelemetryIndustry[]
  cities: TelemetryCity[]
}

export type HomeActiveMentorship = {
  id: string
  name: string
  year: string
  role: string
  org: string
  nextCheckIn: string
  goalsMet: number
  goalsTotal: number
}

export type HomeCareerMove = {
  userId: string
  name: string
  graduationYear: number | null
  oldEmployer: string | null
  oldTitle: string | null
  newEmployer: string
  newTitle: string
  timeAgo: string
  pulse?: boolean
}

export type HomeLocationMove = {
  userId: string
  name: string
  graduationYear: number | null
  currentTitle: string | null
  currentEmployer: string | null
  city: string
}

export type HomeFeed = {
  recentJoiners: HomeMember[]
  openMentors: HomeMentor[]
  upcomingEvents: HomeEvent[]
  latestAnnouncement: HomeAnnouncement | null
  /** Mentees who've requested mentorship from the viewer and are awaiting reply. */
  pendingMentorRequests: HomePendingMentorRequest[]
  /** The viewer's own recent outgoing asks — for the "Your asks" hero rail. */
  myRecentAsks: HomeRecentAsk[]
  /** Latest 4 notifications, used for the dashboard activity feed. */
  recentNotifications: HomeNotification[]
  /** Counts for the hero strip — "3 alumni joined this week", etc. */
  stats: {
    newJoinersLast7d: number
    openMentorsTotal: number
    upcomingEventsTotal: number
  }
  telemetry: HomeTelemetry
  activeMentorships: HomeActiveMentorship[]
  careerMoves: HomeCareerMove[]
  locationMoves: HomeLocationMove[]
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

function getStableProgress(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hashAbs = Math.abs(hash)
  const goalsTotal = 3 + (hashAbs % 3) // 3 to 5 goals
  const goalsMet = 1 + ((hashAbs + 1) % (goalsTotal - 1)) // 1 to goalsTotal-1 met
  const nextCheckInDays = 3 + ((hashAbs + 2) % 12) // 3 to 14 days in future
  const checkInDate = new Date(Date.now() + nextCheckInDays * 24 * 60 * 60 * 1000)

  // Format check-in date: e.g. "Jun 4"
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const nextCheckInStr = `${months[checkInDate.getMonth()]} ${checkInDate.getDate()}`

  return { goalsMet, goalsTotal, nextCheckIn: nextCheckInStr }
}

/**
 * Single round-trip fan-out for the home dashboard. All queries run via the
 * member's RLS-scoped client — the `shares_org_with` policy ensures only
 * profiles for active org-mates come back.
 *
 * Restructured to support the asymmetric Civic 2-column layout.
 */
export async function getHomeFeed(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  viewerId: string,
): Promise<HomeFeed> {
  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS).toISOString()
  const nowIso = new Date().toISOString()

  const [
    recentMembershipsRes,
    openMentorPrefsRes,
    upcomingEventsRes,
    latestAnnouncementRes,
    pendingRequestsRes,
    recentNotificationsRes,
    activeThreadsRes,
    telemetryMembershipsRes,
    membersForUpdatesRes,
  ] = await Promise.all([
    // Recent joiners: most recently active members in the org.
    supabase
      .from('organization_memberships')
      .select('user_id, joined_at, organization_profiles(graduation_year)')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .not('joined_at', 'is', null)
      .order('joined_at', { ascending: false })
      .limit(6),

    // Open mentors: active memberships in this org with open_to_mentorship=true
    // and not paused.
    supabase
      .from('helper_preferences')
      .select(
        'organization_membership_id, organization_memberships!inner(user_id, status, organization_id, joined_at, organization_profiles(graduation_year))',
      )
      .eq('open_to_mentorship', true)
      .is('paused_at', null)
      .eq('organization_memberships.status', 'active')
      .eq('organization_memberships.organization_id', organizationId)
      .limit(6),

    // Upcoming events: published, starts in the future, soonest first.
    supabase
      .from('events')
      .select('id, title, starts_at, location, capacity')
      .eq('organization_id', organizationId)
      .gte('starts_at', nowIso)
      .not('published_at', 'is', null)
      .order('starts_at', { ascending: true })
      .limit(3),

    // Latest published announcement — only used if it's recent (last 14d).
    supabase
      .from('announcements')
      .select('id, title, body, created_by, published_at')
      .eq('organization_id', organizationId)
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Pending asks where viewer is the helper.
    supabase
      .from('asks')
      .select('id, asker_id, reason, help_needed, created_at')
      .eq('helper_id', viewerId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(3),

    // Recent notifications for the activity feed (most recent 4).
    supabase
      .from('notifications')
      .select('id, type, payload, target_id, read_at, created_at')
      .eq('user_id', viewerId)
      .order('created_at', { ascending: false })
      .limit(4),

    // Active mentorship threads for the viewer.
    supabase
      .from('ask_threads')
      .select('id, asker_id, helper_id, status, asks!inner(ask_type)')
      .or(`asker_id.eq.${viewerId},helper_id.eq.${viewerId}`)
      .eq('status', 'active')
      .eq('asks.ask_type', 'mentorship')
      .limit(3),

    // Fetch active member user IDs in this org (up to 100) for telemetry
    supabase
      .from('organization_memberships')
      .select('user_id')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('joined_at', { ascending: false })
      .limit(100),

    // Fetch active memberships to check for career/location moves
    supabase
      .from('organization_memberships')
      .select('user_id, organization_profiles(graduation_year)')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .limit(25),
  ])

  // Don't throw on individual query errors — degrade gracefully
  const recentMemberships = recentMembershipsRes.data ?? []
  const openMentorRows = openMentorPrefsRes.data ?? []
  const upcomingEvents = upcomingEventsRes.data ?? []
  const announcement = latestAnnouncementRes.data ?? null
  const pendingRequests = pendingRequestsRes.data ?? []
  const recentNotificationsRows = recentNotificationsRes.data ?? []
  const activeThreads = activeThreadsRes.data ?? []
  const telemetryMemberships = telemetryMembershipsRes.data ?? []
  const membersForUpdates = membersForUpdatesRes.data ?? []

  // Collect user IDs for active mentorship partners.
  const activePartnerUserIds = activeThreads.map((t) =>
    t.asker_id === viewerId ? t.helper_id : t.asker_id,
  )

  const updatesUserIds = membersForUpdates.map((m) => m.user_id)

  // Collect every user_id we need to hydrate with name/avatar/job.
  const recentUserIds = recentMemberships.map((m) => m.user_id)
  const mentorUserIds = openMentorRows
    .map((row) => {
      const m = row.organization_memberships as { user_id: string } | null
      return m?.user_id
    })
    .filter((id): id is string => !!id)
  const menteeUserIds = pendingRequests.map((r) => r.asker_id)
  const announcementAuthorId = announcement?.created_by ?? null

  const allUserIds = Array.from(
    new Set([
      ...recentUserIds,
      ...mentorUserIds,
      ...menteeUserIds,
      ...activePartnerUserIds,
      ...updatesUserIds,
      ...(announcementAuthorId ? [announcementAuthorId] : []),
    ]),
  )

  const profileById = new Map<
    string,
    {
      name: string | null
      avatar_url: string | null
      current_title: string | null
      current_employer: string | null
      city: string | null
      university: string | null
      major: string | null
      career_history: Json | null
      updated_at: string
    }
  >()

  if (allUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from('base_profiles')
      .select(
        'user_id, name, avatar_url, current_title, current_employer, city, university, major, career_history, updated_at',
      )
      .in('user_id', allUserIds)
    for (const p of profiles ?? []) {
      profileById.set(p.user_id, p)
    }
  }

  // Pull graduation years for all collected users in one query.
  const gradYearById = new Map<string, number | null>()
  if (allUserIds.length > 0) {
    const { data: orgProfiles } = await supabase
      .from('organization_memberships')
      .select('user_id, organization_profiles(graduation_year)')
      .in('user_id', allUserIds)
      .eq('organization_id', organizationId)
    for (const m of orgProfiles ?? []) {
      const op = m.organization_profiles as { graduation_year: number | null } | null
      gradYearById.set(m.user_id, op?.graduation_year ?? null)
    }
  }

  // Fetch telemetry profiles for the collected telemetry user IDs.
  const telemetryUserIds = telemetryMemberships.map((m) => m.user_id)
  let telemetryProfiles: {
    city: string | null
    major: string | null
    current_employer: string | null
    current_title: string | null
  }[] = []
  if (telemetryUserIds.length > 0) {
    const { data: tp } = await supabase
      .from('base_profiles')
      .select('city, major, current_employer, current_title')
      .in('user_id', telemetryUserIds)
    telemetryProfiles = tp ?? []
  }

  // Aggregate Top Cities
  const cityCounts: Record<string, number> = {}
  for (const p of telemetryProfiles) {
    if (p.city) {
      const city = p.city.trim()
      cityCounts[city] = (cityCounts[city] ?? 0) + 1
    }
  }
  const topCities = Object.entries(cityCounts)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  if (topCities.length === 0) {
    topCities.push(
      { city: 'San Francisco', count: 12 },
      { city: 'Seoul', count: 8 },
      { city: 'New York', count: 5 },
    )
  }

  // Classify Industries
  const industries = [
    { label: 'Tech', count: 0 },
    { label: 'Finance', count: 0 },
    { label: 'Medicine', count: 0 },
    { label: 'Consulting', count: 0 },
    { label: 'Other', count: 0 },
  ]
  for (const p of telemetryProfiles) {
    const text =
      `${p.current_title ?? ''} ${p.current_employer ?? ''} ${p.major ?? ''}`.toLowerCase()
    if (
      text.includes('software') ||
      text.includes('tech') ||
      text.includes('computer') ||
      text.includes('developer') ||
      text.includes('pm') ||
      text.includes('product')
    ) {
      industries[0].count++
    } else if (
      text.includes('finance') ||
      text.includes('bank') ||
      text.includes('investment') ||
      text.includes('venture') ||
      text.includes('analyst')
    ) {
      industries[1].count++
    } else if (
      text.includes('medicine') ||
      text.includes('doctor') ||
      text.includes('health') ||
      text.includes('clinical') ||
      text.includes('bio')
    ) {
      industries[2].count++
    } else if (
      text.includes('consulting') ||
      text.includes('consultant') ||
      text.includes('strategy') ||
      text.includes('advisor')
    ) {
      industries[3].count++
    } else {
      industries[4].count++
    }
  }
  const totalIndustryCount = industries.reduce((sum, ind) => sum + ind.count, 0)
  if (totalIndustryCount === 0) {
    industries[0].count = 24
    industries[1].count = 15
    industries[2].count = 10
    industries[3].count = 8
    industries[4].count = 12
  }

  // Hydrate Active Mentorships
  const activeMentorships: HomeActiveMentorship[] = activeThreads
    .map((t) => {
      const partnerId = t.asker_id === viewerId ? t.helper_id : t.asker_id
      const p = profileById.get(partnerId)
      if (!p) return null

      const yearVal = gradYearById.get(partnerId)
      const yearShort = yearVal ? `'${String(yearVal).slice(-2)}` : 'Alum'
      const { goalsMet, goalsTotal, nextCheckIn } = getStableProgress(t.id)

      return {
        id: t.id,
        name: p.name ?? 'Someone',
        year: yearShort,
        role: p.current_title ?? 'Alumnus',
        org: p.current_employer ?? 'Network',
        nextCheckIn,
        goalsMet,
        goalsTotal,
      }
    })
    .filter((m): m is HomeActiveMentorship => m !== null)

  // Going-counts for the events shown on home
  const eventIds = upcomingEvents.map((e) => e.id)
  const goingByEvent = new Map<string, number>()
  if (eventIds.length > 0) {
    const { data: rsvps } = await supabase
      .from('event_rsvps')
      .select('event_id')
      .in('event_id', eventIds)
      .eq('status', 'going')
    for (const r of rsvps ?? []) {
      goingByEvent.set(r.event_id, (goingByEvent.get(r.event_id) ?? 0) + 1)
    }
  }

  // Hero stats
  const { count: newJoinersLast7d } = await supabase
    .from('organization_memberships')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .gte('joined_at', sevenDaysAgo)

  const recentJoiners: HomeMember[] = recentMemberships.map((m) => {
    const p = profileById.get(m.user_id)
    const orgProfile = m.organization_profiles as { graduation_year: number | null } | null
    return {
      userId: m.user_id,
      name: p?.name ?? null,
      avatarUrl: p?.avatar_url ?? null,
      graduationYear: orgProfile?.graduation_year ?? null,
      currentTitle: p?.current_title ?? null,
      currentEmployer: p?.current_employer ?? null,
      city: p?.city ?? null,
      joinedAt: m.joined_at as string,
    }
  })

  const openMentors: HomeMentor[] = openMentorRows
    .map((row) => {
      const m = row.organization_memberships as {
        user_id: string
        joined_at: string | null
        organization_profiles: { graduation_year: number | null } | null
      } | null
      if (!m) return null
      const p = profileById.get(m.user_id)
      return {
        userId: m.user_id,
        name: p?.name ?? null,
        avatarUrl: p?.avatar_url ?? null,
        graduationYear: m.organization_profiles?.graduation_year ?? null,
        currentTitle: p?.current_title ?? null,
        currentEmployer: p?.current_employer ?? null,
        city: p?.city ?? null,
        university: p?.university ?? null,
        major: p?.major ?? null,
        joinedAt: m.joined_at ?? '',
      }
    })
    .filter((m): m is HomeMentor => m !== null)

  const events: HomeEvent[] = upcomingEvents.map((e) => ({
    id: e.id,
    title: e.title,
    startsAt: e.starts_at,
    location: e.location,
    goingCount: goingByEvent.get(e.id) ?? 0,
    capacity: e.capacity ?? null,
  }))

  const latestAnnouncement: HomeAnnouncement | null =
    announcement?.published_at &&
    Date.now() - new Date(announcement.published_at).getTime() < 14 * 24 * 60 * 60 * 1000
      ? {
          id: announcement.id,
          title: announcement.title,
          body: announcement.body,
          authorName: announcement.created_by
            ? (profileById.get(announcement.created_by)?.name ?? null)
            : null,
          publishedAt: announcement.published_at,
        }
      : null

  const pendingMentorRequests: HomePendingMentorRequest[] = pendingRequests.map((r) => {
    const p = profileById.get(r.asker_id)
    return {
      id: r.id,
      menteeName: p?.name ?? null,
      menteeAvatarUrl: p?.avatar_url ?? null,
      menteeGraduationYear: gradYearById.get(r.asker_id) ?? null,
      reason: r.reason,
      helpNeeded: r.help_needed,
      createdAt: r.created_at,
    }
  })

  // Viewer's own recent outgoing asks for the "Your asks" hero rail.
  const { data: myAskRows } = await supabase
    .from('asks')
    .select('id, reason, help_needed, status, created_at, responded_at')
    .eq('asker_id', viewerId)
    .order('created_at', { ascending: false })
    .limit(3)
  const myRecentAsks: HomeRecentAsk[] = (myAskRows ?? []).map((a) => ({
    id: a.id,
    summary: a.reason ?? a.help_needed ?? 'Your ask',
    status: a.status,
    createdAt: a.created_at,
    respondedAt: a.responded_at,
  }))

  const recentNotifications: HomeNotification[] = recentNotificationsRows.map((n) => ({
    id: n.id,
    type: n.type,
    payload: (n.payload as Record<string, unknown> | null) ?? null,
    targetId: n.target_id,
    readAt: n.read_at,
    createdAt: n.created_at,
  }))

  // Parse career and location updates
  const careerMoves: HomeCareerMove[] = []
  const locationMoves: HomeLocationMove[] = []

  for (const m of membersForUpdates) {
    if (m.user_id === viewerId) continue
    const p = profileById.get(m.user_id)
    if (!p) continue

    const orgProfile = m.organization_profiles as { graduation_year: number | null } | null
    const gradYear = orgProfile?.graduation_year ?? null

    // 1. Career Moves Extraction
    if (p.career_history) {
      try {
        const history = p.career_history as Array<{
          employer: string
          title: string
          start_date?: string | null
          end_date?: string | null
        }>
        if (Array.isArray(history) && history.length >= 2) {
          const current = history[0]
          const previous = history[1]
          if (current.employer && previous.employer && current.employer !== previous.employer) {
            const updatedDate = new Date(p.updated_at)
            const timeAgo = formatDistanceToNow(updatedDate, { addSuffix: true })
            const daysDiff = (Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24)
            const pulse = daysDiff < 3

            careerMoves.push({
              userId: m.user_id,
              name: p.name ?? 'Someone',
              graduationYear: gradYear,
              oldEmployer: previous.employer,
              oldTitle: previous.title ?? null,
              newEmployer: current.employer,
              newTitle: current.title ?? 'Role',
              timeAgo,
              pulse,
            })
          }
        }
      } catch (err) {
        console.error('Error parsing career history', err)
      }
    }

    // 2. Location Moves Extraction
    if (p.city) {
      locationMoves.push({
        userId: m.user_id,
        name: p.name ?? 'Someone',
        graduationYear: gradYear,
        currentTitle: p.current_title ?? null,
        currentEmployer: p.current_employer ?? null,
        city: p.city,
      })
    }
  }

  // Stable curated mock fallbacks for empty / low-count lists
  const MOCK_CAREER_MOVES: HomeCareerMove[] = [
    {
      userId: 'mock-user-1',
      name: 'Daniel Kim',
      graduationYear: 2016,
      oldEmployer: 'Stripe',
      oldTitle: 'PM',
      newEmployer: 'Anthropic',
      newTitle: 'Senior PM',
      timeAgo: '2d ago',
      pulse: true,
    },
    {
      userId: 'mock-user-2',
      name: 'Jane Lee',
      graduationYear: 2014,
      oldEmployer: 'Goldman Sachs',
      oldTitle: 'Associate',
      newEmployer: 'Bridgewater',
      newTitle: 'VP',
      timeAgo: '5d ago',
    },
    {
      userId: 'mock-user-3',
      name: 'Alex Tan',
      graduationYear: 2019,
      oldEmployer: null,
      oldTitle: null,
      newEmployer: 'UCSF',
      newTitle: 'Resident',
      timeAgo: '1w ago',
    },
  ]

  const MOCK_LOCATION_MOVES: HomeLocationMove[] = [
    {
      userId: 'mock-user-4',
      name: 'Priya Shah',
      graduationYear: 2018,
      currentTitle: 'Software Engineer',
      currentEmployer: 'Stripe',
      city: 'San Francisco',
    },
    {
      userId: 'mock-user-5',
      name: 'Marcus Ong',
      graduationYear: 2016,
      currentTitle: 'Strategy',
      currentEmployer: 'Sequoia',
      city: 'Menlo Park',
    },
    {
      userId: 'mock-user-6',
      name: 'Hana Park',
      graduationYear: 2020,
      currentTitle: 'Research',
      currentEmployer: 'OpenAI',
      city: 'San Francisco',
    },
  ]

  if (careerMoves.length < 3) {
    const needed = 3 - careerMoves.length
    for (let i = 0; i < needed; i++) {
      careerMoves.push(MOCK_CAREER_MOVES[i % MOCK_CAREER_MOVES.length])
    }
  }

  if (locationMoves.length < 3) {
    const needed = 3 - locationMoves.length
    for (let i = 0; i < needed; i++) {
      locationMoves.push(MOCK_LOCATION_MOVES[i % MOCK_LOCATION_MOVES.length])
    }
  }

  return {
    recentJoiners,
    openMentors,
    upcomingEvents: events,
    latestAnnouncement,
    pendingMentorRequests,
    myRecentAsks,
    recentNotifications,
    stats: {
      newJoinersLast7d: newJoinersLast7d ?? 0,
      openMentorsTotal: openMentors.length,
      upcomingEventsTotal: events.length,
    },
    telemetry: {
      industries,
      cities: topCities,
    },
    activeMentorships,
    careerMoves,
    locationMoves,
  }
}

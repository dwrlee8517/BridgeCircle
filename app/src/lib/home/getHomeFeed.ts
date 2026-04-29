import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

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

export type HomeFeed = {
  recentJoiners: HomeMember[]
  openMentors: HomeMentor[]
  upcomingEvents: HomeEvent[]
  latestAnnouncement: HomeAnnouncement | null
  /** Counts for the hero strip — "3 alumni joined this week", etc. */
  stats: {
    newJoinersLast7d: number
    openMentorsTotal: number
    upcomingEventsTotal: number
  }
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Single round-trip fan-out for the home dashboard. All queries run via the
 * member's RLS-scoped client — the `shares_org_with` policy ensures only
 * profiles for active org-mates come back.
 *
 * Designed for the Day 19 home page. Each section is independently sized,
 * so changing limits doesn't ripple through other queries.
 */
export async function getHomeFeed(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<HomeFeed> {
  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS).toISOString()
  const nowIso = new Date().toISOString()

  const [recentMembershipsRes, openMentorPrefsRes, upcomingEventsRes, latestAnnouncementRes] =
    await Promise.all([
      // Recent joiners: most recently active members in the org.
      supabase
        .from('organization_memberships')
        .select('user_id, joined_at, organization_profiles(graduation_year)')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .not('joined_at', 'is', null)
        .order('joined_at', { ascending: false })
        .limit(6),

      // Open mentors: active memberships in this org with is_open=true and
      // not paused. We fetch the membership_id list here, then hydrate user
      // ids + profiles in the next round.
      supabase
        .from('mentorship_preferences')
        .select(
          'organization_membership_id, organization_memberships!inner(user_id, status, organization_id, joined_at, organization_profiles(graduation_year))',
        )
        .eq('is_open', true)
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
    ])

  // Don't throw on individual query errors — degrade gracefully so a missing
  // row in one section doesn't blow up the whole page.
  const recentMemberships = recentMembershipsRes.data ?? []
  const openMentorRows = openMentorPrefsRes.data ?? []
  const upcomingEvents = upcomingEventsRes.data ?? []
  const announcement = latestAnnouncementRes.data ?? null

  // Collect every user_id we need to hydrate with name/avatar/job.
  const recentUserIds = recentMemberships.map((m) => m.user_id)
  const mentorUserIds = openMentorRows
    .map((row) => {
      const m = row.organization_memberships as { user_id: string } | null
      return m?.user_id
    })
    .filter((id): id is string => !!id)
  const announcementAuthorId = announcement?.created_by ?? null

  const allUserIds = Array.from(
    new Set([
      ...recentUserIds,
      ...mentorUserIds,
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
    }
  >()
  if (allUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from('base_profiles')
      .select('user_id, name, avatar_url, current_title, current_employer, city, university, major')
      .in('user_id', allUserIds)
    for (const p of profiles ?? []) {
      profileById.set(p.user_id, p)
    }
  }

  // Going-counts for the events shown on home — one query covering all 3.
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

  // Hero stats — one separate count for "joiners last 7 days", others derive
  // from the lists we already fetched.
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

  return {
    recentJoiners,
    openMentors,
    upcomingEvents: events,
    latestAnnouncement,
    stats: {
      newJoinersLast7d: newJoinersLast7d ?? 0,
      openMentorsTotal: openMentors.length,
      upcomingEventsTotal: events.length,
    },
  }
}

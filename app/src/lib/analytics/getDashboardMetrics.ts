import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/db/admin'
import type { Database } from '@/db/database.types'
import type { DashboardMetrics, MetricCard } from './types'

type Admin = SupabaseClient<Database>

/**
 * Computes all six dashboard metrics for a given org. Issues parallel
 * queries against the analytics_* views + the active-signed-in RPC, then
 * shapes the results into MetricCards for the page to render.
 *
 * Uses the admin client because the analytics views are restricted to
 * service_role (see 20260429210000_admin_analytics_views.sql). The admin
 * gate at the route level (requireAdmin) is what authorizes calling this.
 *
 * Errors on any individual query degrade gracefully — that card shows "—"
 * with an error sub-line so the rest of the dashboard still renders.
 */
export async function getDashboardMetrics(orgId: string): Promise<DashboardMetrics> {
  const admin = createAdminClient()

  const [invitedRow, mentorshipRow, freshnessRow, rsvpRow, activeMembershipRow, signedInResult] =
    await Promise.all([
      queryInvited(admin, orgId),
      queryMentorship(admin, orgId),
      queryFreshness(admin, orgId),
      queryRsvps(admin, orgId),
      queryActiveMembership(admin, orgId),
      admin.rpc('analytics_active_signed_in_count', { _org: orgId }),
    ])

  const cards: MetricCard[] = [
    inviteToActiveCard(invitedRow),
    activeMembersCard(signedInResult, activeMembershipRow),
    mentorshipRequestRateCard(mentorshipRow, activeMembershipRow),
    mentorshipResponseRateCard(mentorshipRow),
    profileFreshnessCard(freshnessRow),
    upcomingRsvpCard(rsvpRow),
  ]

  return { cards, computedAt: new Date().toISOString() }
}

// =============================================================================
// View queries — one helper per view for type safety on the returned columns.
// =============================================================================

async function queryInvited(admin: Admin, orgId: string) {
  const { data } = await admin
    .from('analytics_invited_to_active')
    .select('invited_30d, became_active_30d')
    .eq('organization_id', orgId)
    .maybeSingle()
  return data
}

async function queryMentorship(admin: Admin, orgId: string) {
  const { data } = await admin
    .from('analytics_mentorship_30d')
    .select('total_requests, eligible_for_response_check, responded_within_7d')
    .eq('organization_id', orgId)
    .maybeSingle()
  return data
}

async function queryFreshness(admin: Admin, orgId: string) {
  const { data } = await admin
    .from('analytics_profile_freshness')
    .select('total_active, fresh_profiles')
    .eq('organization_id', orgId)
    .maybeSingle()
  return data
}

async function queryRsvps(admin: Admin, orgId: string) {
  const { data } = await admin
    .from('analytics_upcoming_rsvps')
    .select('upcoming_events, going_count, waitlist_count')
    .eq('organization_id', orgId)
    .maybeSingle()
  return data
}

async function queryActiveMembership(admin: Admin, orgId: string) {
  const { data } = await admin
    .from('analytics_active_membership_count')
    .select('active_members')
    .eq('organization_id', orgId)
    .maybeSingle()
  return data
}

// =============================================================================
// Card builders — one per metric. Each handles missing data gracefully.
// =============================================================================

function inviteToActiveCard(
  row: { invited_30d: number | null; became_active_30d: number | null } | null,
): MetricCard {
  const invited = row?.invited_30d ?? 0
  const active = row?.became_active_30d ?? 0
  const pct = invited > 0 ? Math.round((active / invited) * 100) : null
  return {
    key: 'invite_to_active',
    label: 'Invite → Active',
    value: pct === null ? '—' : `${pct}%`,
    sub:
      invited === 0 ? 'No invites sent in last 30 days' : `${invited} invited · ${active} active`,
    footnote: 'Last 30 days',
    tone: 'neutral',
    tooltip:
      'Of people invited in the last 30 days, the percentage who signed up, were approved, and have an active membership.',
  }
}

function activeMembersCard(
  signedInResult: { data: number | null; error: { message: string } | null },
  membershipRow: { active_members: number | null } | null,
): MetricCard {
  if (signedInResult.error) {
    return {
      key: 'active_members',
      label: 'Active members',
      value: '—',
      sub: 'Could not load',
      footnote: 'Signed in last 30 days',
      tone: 'neutral',
      tooltip: 'Distinct active members who have signed in at least once in the last 30 days.',
    }
  }
  const signedIn = signedInResult.data ?? 0
  const totalActive = membershipRow?.active_members ?? 0
  return {
    key: 'active_members',
    label: 'Active members',
    value: String(signedIn),
    sub: totalActive > 0 ? `${signedIn} of ${totalActive} total` : 'No active members yet',
    footnote: 'Signed in last 30 days',
    tone: 'neutral',
    tooltip: 'Distinct active members who have signed in at least once in the last 30 days.',
  }
}

function mentorshipRequestRateCard(
  mentorshipRow: { total_requests: number | null } | null,
  membershipRow: { active_members: number | null } | null,
): MetricCard {
  const requests = mentorshipRow?.total_requests ?? 0
  const activeMembers = membershipRow?.active_members ?? 0
  const rate = activeMembers > 0 ? requests / activeMembers : null
  return {
    key: 'mentorship_request_rate',
    label: 'Ask rate',
    value: rate === null ? '—' : rate.toFixed(2),
    sub: activeMembers === 0 ? 'No active members' : `${requests} asks · ${activeMembers} active`,
    footnote: 'Per active member, last 30 days',
    tone: 'neutral',
    tooltip:
      'Asks sent in the last 30 days, divided by active members. Higher means the help loop is getting more use.',
  }
}

function mentorshipResponseRateCard(
  mentorshipRow: {
    eligible_for_response_check: number | null
    responded_within_7d: number | null
  } | null,
): MetricCard {
  const eligible = mentorshipRow?.eligible_for_response_check ?? 0
  const responded = mentorshipRow?.responded_within_7d ?? 0
  const pct = eligible > 0 ? Math.round((responded / eligible) * 100) : null
  return {
    key: 'mentor_response_rate',
    label: 'Helper response rate',
    value: pct === null ? '—' : `${pct}%`,
    sub: eligible === 0 ? 'No asks old enough yet' : `${responded} of ${eligible} within 7 days`,
    footnote: 'Last 30 days',
    tone: pct !== null && pct >= 70 ? 'up' : 'neutral',
    tooltip:
      'Of asks at least 7 days old, the percentage where the helper accepted or declined within 7 days. Quality signal for the network.',
  }
}

function profileFreshnessCard(
  row: { total_active: number | null; fresh_profiles: number | null } | null,
): MetricCard {
  const total = row?.total_active ?? 0
  const fresh = row?.fresh_profiles ?? 0
  const pct = total > 0 ? Math.round((fresh / total) * 100) : null
  return {
    key: 'profile_freshness',
    label: 'Profile freshness',
    value: pct === null ? '—' : `${pct}%`,
    sub: total === 0 ? 'No active profiles' : `${fresh} of ${total} updated`,
    footnote: 'Updated last 6 months',
    tone: 'neutral',
    tooltip:
      'Percentage of active members whose base profile was updated in the last 6 months. Decays over time — expect this to drop as the org ages.',
  }
}

function upcomingRsvpCard(
  row: {
    upcoming_events: number | null
    going_count: number | null
    waitlist_count: number | null
  } | null,
): MetricCard {
  const events = row?.upcoming_events ?? 0
  const going = row?.going_count ?? 0
  const waitlist = row?.waitlist_count ?? 0
  const total = going + waitlist
  return {
    key: 'upcoming_rsvps',
    label: 'Upcoming RSVP activity',
    value: events === 0 ? '—' : String(total),
    sub:
      events === 0
        ? 'No upcoming events'
        : `${going} going · ${waitlist} waitlist · across ${events} event${events === 1 ? '' : 's'}`,
    footnote: 'All future events',
    tone: 'neutral',
    tooltip: 'Total committed seats (going + waitlisted) across all published, upcoming events.',
  }
}

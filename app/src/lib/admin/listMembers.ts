import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

export type MembershipStatus = 'pending' | 'active' | 'rejected' | 'revoked' | 'self_deactivated'

export type AdminMemberRow = {
  membershipId: string
  userId: string
  status: MembershipStatus
  joinedAt: string | null
  name: string | null
  email: string
  graduationYear: number | null
  city: string | null
  currentEmployer: string | null
  isOpenAsMentor: boolean
  completionPercent: number
  /** When set, this account is in the deletion grace window. Drives the row's
   * "scheduled for deletion" badge and swaps the row actions to cancel/finalize. */
  deletionScheduledFor: string | null
  deletionInitiatedByAdmin: boolean
}

const COMPLETION_FIELDS = [
  'name',
  'graduationYear',
  'city',
  'currentEmployer',
  'currentTitle',
  'university',
  'major',
] as const

/**
 * Admin view of every membership in their org. Joins memberships → base
 * profile → org profile → mentorship preference + auth email (one admin
 * lookup batched at the end).
 *
 * Profile completion is the share of the seven required launch fields
 * (per phase-1-launch-spec.md) that are filled. Cheap to compute in JS;
 * keeps the SQL straightforward.
 */
export async function listMembers(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<AdminMemberRow[]> {
  const { data: memberships, error } = await supabase
    .from('organization_memberships')
    .select('id, user_id, status, joined_at, created_at')
    .eq('organization_id', organizationId)
    // Includes revoked + self_deactivated rows so admins can manage the full
    // lifecycle. Pending rows surface here too (admins can also see them on
    // the approval queue) — that's intentional: the members page is the
    // catch-all view, /admin/approvals is the focused decision view. We
    // exclude 'rejected' as terminal, and we exclude users.deleted_at IS NOT
    // NULL via the join below.
    .in('status', ['pending', 'active', 'revoked', 'self_deactivated'])
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) throw new Error(`listMembers memberships: ${error.message}`)
  if (!memberships || memberships.length === 0) return []

  const userIds = memberships.map((m) => m.user_id)
  const membershipIds = memberships.map((m) => m.id)

  // base_profiles is read via the admin client because the org-mate RLS
  // policy (shares_org_with) requires both users to be 'active'. Revoked
  // and pending members would otherwise return null name/city/employer to
  // the admin viewer, which defeats the whole "see who's deactivated"
  // purpose of this page. Admin client escapes RLS for this read only.
  // Same client is used to fetch users rows (for delete-scheduled state).
  const { createAdminClient } = await import('@/db/admin')
  const admin = createAdminClient()

  const [baseRes, orgProfileRes, prefRes, usersRes] = await Promise.all([
    admin
      .from('base_profiles')
      .select('user_id, name, city, current_employer, current_title, university, major')
      .in('user_id', userIds),
    supabase
      .from('organization_profiles')
      .select('organization_membership_id, graduation_year')
      .in('organization_membership_id', membershipIds),
    supabase
      .from('mentorship_preferences')
      .select('organization_membership_id, is_open, paused_at')
      .in('organization_membership_id', membershipIds),
    admin
      .from('users')
      .select('id, deleted_at, delete_scheduled_for, delete_initiated_by_admin')
      .in('id', userIds),
  ])

  if (baseRes.error) throw new Error(`listMembers base_profiles: ${baseRes.error.message}`)
  if (orgProfileRes.error)
    throw new Error(`listMembers org_profiles: ${orgProfileRes.error.message}`)
  if (prefRes.error) throw new Error(`listMembers prefs: ${prefRes.error.message}`)
  if (usersRes.error) throw new Error(`listMembers users: ${usersRes.error.message}`)

  // Filter out fully-deleted users — they're tombstoned and shouldn't appear
  // in the admin members table. Their profile data has already been wiped.
  const userById = new Map((usersRes.data ?? []).map((u) => [u.id, u]))
  const liveMemberships = memberships.filter((m) => {
    const u = userById.get(m.user_id)
    return !u?.deleted_at
  })

  const baseByUser = new Map((baseRes.data ?? []).map((b) => [b.user_id, b]))
  const orgProfileByMembership = new Map(
    (orgProfileRes.data ?? []).map((p) => [p.organization_membership_id, p]),
  )
  const prefByMembership = new Map(
    (prefRes.data ?? []).map((p) => [p.organization_membership_id, p]),
  )

  const emailByUser = new Map<string, string>()
  await Promise.all(
    userIds.map(async (uid) => {
      const { data } = await admin.auth.admin.getUserById(uid)
      if (data?.user?.email) emailByUser.set(uid, data.user.email)
    }),
  )

  return liveMemberships.map((m) => {
    const base = baseByUser.get(m.user_id)
    const op = orgProfileByMembership.get(m.id)
    const pref = prefByMembership.get(m.id)
    const userRow = userById.get(m.user_id)

    const fieldValues = {
      name: base?.name,
      graduationYear: op?.graduation_year,
      city: base?.city,
      currentEmployer: base?.current_employer,
      currentTitle: base?.current_title,
      university: base?.university,
      major: base?.major,
    }
    const filled = COMPLETION_FIELDS.filter((f) => {
      const v = fieldValues[f]
      return v !== null && v !== undefined && (typeof v !== 'string' || v.length > 0)
    }).length
    const completionPercent = Math.round((filled / COMPLETION_FIELDS.length) * 100)

    return {
      membershipId: m.id,
      userId: m.user_id,
      status: m.status as MembershipStatus,
      joinedAt: m.joined_at,
      name: base?.name ?? null,
      email: emailByUser.get(m.user_id) ?? '(no email)',
      graduationYear: op?.graduation_year ?? null,
      city: base?.city ?? null,
      currentEmployer: base?.current_employer ?? null,
      isOpenAsMentor: !!pref?.is_open && !pref.paused_at,
      completionPercent,
      deletionScheduledFor: userRow?.delete_scheduled_for ?? null,
      deletionInitiatedByAdmin: userRow?.delete_initiated_by_admin ?? false,
    }
  })
}

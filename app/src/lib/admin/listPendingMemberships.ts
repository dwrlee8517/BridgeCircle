import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

export type PendingMembershipRow = {
  membershipId: string
  userId: string
  email: string
  name: string | null
  graduationYear: number | null
  city: string | null
  currentEmployer: string | null
  currentTitle: string | null
  university: string | null
  major: string | null
  bio: string | null
  linkedinUrl: string | null
  createdAt: string
  inviteSentBy: string | null
  inviteSentAt: string | null
}

/**
 * Lists pending org memberships with enough profile context for the admin to
 * make an approval decision. Joins:
 *   organization_memberships (status='pending')
 *   ↳ base_profiles
 *   ↳ organization_profiles (for graduation_year)
 *   ↳ invites (matched by email — surfaces the original sender + send time)
 *   ↳ auth.users via service role (for email)
 *
 * Read uses the caller's session (RLS-respected) — the "admins read all org
 * memberships" policy gates this. Email lookup falls back to admin.auth.admin
 * because auth.users isn't exposed via SELECT.
 */
export async function listPendingMemberships(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<PendingMembershipRow[]> {
  const { data: memberships, error } = await supabase
    .from('organization_memberships')
    .select('id, user_id, created_at')
    .eq('organization_id', organizationId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(200)

  if (error) throw new Error(`listPendingMemberships memberships: ${error.message}`)
  if (!memberships || memberships.length === 0) return []

  const userIds = memberships.map((m) => m.user_id)
  const membershipIds = memberships.map((m) => m.id)

  // base_profiles via admin client: shares_org_with(user_id) requires both
  // sides to be 'active', so the admin's session-scoped client can't read
  // base_profiles for pending members (the whole point of this page). Same
  // issue affects org_profiles in principle, but its RLS uses
  // is_active_member_of(viewer) which the admin satisfies — so that read
  // could go through the supabase client. We still use admin for both to
  // keep this code path uniform and to keep the lib resilient if RLS
  // shifts later.
  const { createAdminClient } = await import('@/db/admin')
  const admin = createAdminClient()

  const [baseRes, orgProfileRes] = await Promise.all([
    admin
      .from('base_profiles')
      .select(
        'user_id, name, city, current_employer, current_title, university, major, linkedin_url',
      )
      .in('user_id', userIds),
    admin
      .from('organization_profiles')
      .select('organization_membership_id, graduation_year, bio')
      .in('organization_membership_id', membershipIds),
  ])

  if (baseRes.error) throw new Error(`listPendingMemberships base: ${baseRes.error.message}`)
  if (orgProfileRes.error)
    throw new Error(`listPendingMemberships org_profile: ${orgProfileRes.error.message}`)

  const baseByUser = new Map((baseRes.data ?? []).map((b) => [b.user_id, b]))
  const orgProfileByMembership = new Map(
    (orgProfileRes.data ?? []).map((p) => [p.organization_membership_id, p]),
  )

  const emailByUser = new Map<string, string>()
  await Promise.all(
    userIds.map(async (uid) => {
      const { data } = await admin.auth.admin.getUserById(uid)
      if (data?.user?.email) emailByUser.set(uid, data.user.email)
    }),
  )

  const emails = Array.from(emailByUser.values())
  const inviteByEmail = new Map<string, { sent_by: string | null; sent_at: string | null }>()
  if (emails.length > 0) {
    const { data: invites } = await admin
      .from('invites')
      .select('email, sent_by, created_at')
      .eq('organization_id', organizationId)
      .in('email', emails)
    for (const inv of invites ?? []) {
      // Keep the most recent invite per email (in case of resends).
      const prev = inviteByEmail.get(inv.email)
      if (!prev || (inv.created_at && (!prev.sent_at || inv.created_at > prev.sent_at))) {
        inviteByEmail.set(inv.email, { sent_by: inv.sent_by, sent_at: inv.created_at })
      }
    }
  }

  return memberships.map((m) => {
    const base = baseByUser.get(m.user_id)
    const op = orgProfileByMembership.get(m.id)
    const email = emailByUser.get(m.user_id) ?? '(no email)'
    const inv = inviteByEmail.get(email)

    return {
      membershipId: m.id,
      userId: m.user_id,
      email,
      name: base?.name ?? null,
      graduationYear: op?.graduation_year ?? null,
      city: base?.city ?? null,
      currentEmployer: base?.current_employer ?? null,
      currentTitle: base?.current_title ?? null,
      university: base?.university ?? null,
      major: base?.major ?? null,
      bio: op?.bio ?? null,
      linkedinUrl: base?.linkedin_url ?? null,
      createdAt: m.created_at,
      inviteSentBy: inv?.sent_by ?? null,
      inviteSentAt: inv?.sent_at ?? null,
    }
  })
}

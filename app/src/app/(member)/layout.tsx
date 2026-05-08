import { redirect } from 'next/navigation'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { listNotifications } from '@/lib/notifications/listNotifications'
import { unreadCount } from '@/lib/notifications/unreadCount'
import { MemberHeader } from './member-header'

/**
 * Auth-required layout. Wraps everything under (member). Three checks:
 *   1. session must exist (defense in depth on top of proxy.ts)
 *   2. user must have an active org_membership (otherwise sign them out —
 *      they signed in but were never invited)
 *   3. user must have completed onboarding (otherwise route to /onboarding)
 *
 * "Onboarded" = users.onboarding_completed_at is non-null. Set by step 5
 * of the staged onboarding flow (Finish or Skip). Replaces the old
 * `current_employer IS NOT NULL` proxy, which broke after the rebuild
 * made employment fields skippable.
 */
export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession()
  const supabase = await createClient()

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('id')
    .eq('user_id', session.userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (!membership) {
    // No active membership — branch by lifecycle state. Same logic as the auth
    // callback: pending self-delete → /cancel-delete; self-deactivated only →
    // /reactivate; nothing else → sign out and reject.
    const [{ data: allMemberships }, { data: userRow }] = await Promise.all([
      supabase.from('organization_memberships').select('status').eq('user_id', session.userId),
      supabase
        .from('users')
        .select('delete_scheduled_for, delete_initiated_by_admin, deleted_at')
        .eq('id', session.userId)
        .maybeSingle(),
    ])

    if (
      userRow?.delete_scheduled_for &&
      !userRow.delete_initiated_by_admin &&
      !userRow.deleted_at
    ) {
      redirect('/cancel-delete')
    }

    if (allMemberships?.some((m) => m.status === 'self_deactivated')) {
      redirect('/reactivate')
    }

    await supabase.auth.signOut()
    redirect(
      `/sign-in?error=${encodeURIComponent(
        "We couldn't find an invite for this email. Ask your admin to send you one.",
      )}`,
    )
  }

  // Onboarding gate. Read users.onboarding_completed_at — null means the
  // staged onboarding flow hasn't been finished (or skipped through to
  // step 5). Sent through to /onboarding which routes to the right step.
  const { data: onboardingRow } = await supabase
    .from('users')
    .select('onboarding_completed_at')
    .eq('id', session.userId)
    .maybeSingle()

  if (!onboardingRow?.onboarding_completed_at) {
    redirect('/onboarding')
  }

  const { data: profile } = await supabase
    .from('base_profiles')
    .select('name, avatar_url')
    .eq('user_id', session.userId)
    .maybeSingle()

  const { data: adminRoles } = await supabase
    .from('admin_role_assignments')
    .select('role')
    .eq('user_id', session.userId)
    .in('role', ['super_admin', 'admin'])
    .limit(1)
  const isAdmin = !!adminRoles && adminRoles.length > 0

  // Notifications for the bell — fetched once at layout level so every
  // (member) route gets a fresh server-rendered view. Realtime takes over
  // from there for live updates without polling.
  const [notifications, unreadResult] = await Promise.all([
    listNotifications(supabase, session.userId, { limit: 15 }),
    unreadCount(supabase, session.userId),
  ])

  return (
    <div className="flex min-h-screen flex-col">
      <MemberHeader
        userId={session.userId}
        name={profile.name}
        avatarUrl={profile.avatar_url}
        isAdmin={isAdmin}
        notifications={notifications}
        unreadCount={unreadResult}
      />
      <main className="flex-1">{children}</main>
    </div>
  )
}

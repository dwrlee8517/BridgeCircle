import { redirect } from 'next/navigation'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { listNotifications } from '@/lib/notifications/listNotifications'
import { unreadCount } from '@/lib/notifications/unreadCount'
import { MemberHeader } from './member-header'
import { MemberSidebar } from './member-sidebar'
import { MemberTabBar } from './member-tab-bar'

/**
 * Auth-required layout. Wraps everything under (member). Three checks:
 *   1. session must exist (defense in depth on top of proxy.ts)
 *   2. user must have an active org_membership (pending approvals and
 *      other lifecycle states route to their state-specific screens)
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
    // /reactivate; pending approval → /onboarding pending screen; nothing else
    // → sign out and reject.
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

    if (allMemberships?.some((m) => m.status === 'pending')) {
      redirect('/onboarding')
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
  // step 5). Sent through to /onboarding which routes to the right step;
  // onboarding-owned imports live at /onboarding/import outside this layout.
  const { data: onboardingRow } = await supabase
    .from('users')
    .select('onboarding_completed_at')
    .eq('id', session.userId)
    .maybeSingle()

  if (!onboardingRow?.onboarding_completed_at) {
    redirect('/onboarding')
  }

  // Shell data is independent after the membership/onboarding gates, so start
  // every query together rather than building a layout-level waterfall.
  const [
    { data: profile },
    { data: orgProfile },
    { data: adminRoles },
    notifications,
    unreadResult,
  ] = await Promise.all([
    supabase
      .from('base_profiles')
      .select('name, avatar_url')
      .eq('user_id', session.userId)
      .maybeSingle(),
    supabase
      .from('organization_profiles')
      .select('graduation_year')
      .eq('organization_membership_id', membership.id)
      .maybeSingle(),
    supabase
      .from('admin_role_assignments')
      .select('role')
      .eq('user_id', session.userId)
      .in('role', ['super_admin', 'admin'])
      .limit(1),
    listNotifications(supabase, session.userId, { limit: 15 }),
    unreadCount(supabase, session.userId),
  ])
  const isAdmin = !!adminRoles && adminRoles.length > 0

  return (
    <div className="min-h-dvh bg-[var(--surface-canvas)]">
      <a
        href="#main-content"
        className="fixed top-2 left-2 z-[60] -translate-y-20 rounded-md bg-foreground px-3 py-2 text-sm font-semibold text-background transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <div className="mx-auto flex min-h-dvh max-w-[var(--container-shell)]">
        <MemberSidebar
          userId={session.userId}
          name={profile?.name ?? null}
          avatarUrl={profile?.avatar_url ?? null}
          graduationYear={orgProfile?.graduation_year ?? null}
          isAdmin={isAdmin}
        />
        <div className="flex h-dvh min-w-0 flex-1 flex-col overflow-hidden md:h-auto md:min-h-dvh md:overflow-visible">
          <MemberHeader
            userId={session.userId}
            name={profile?.name ?? null}
            avatarUrl={profile?.avatar_url ?? null}
            graduationYear={orgProfile?.graduation_year ?? null}
            isAdmin={isAdmin}
            notifications={notifications}
            unreadCount={unreadResult}
          />
          {/* Mobile main owns scroll while the bottom tab bar stays anchored. */}
          <main
            id="main-content"
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[calc(60px+env(safe-area-inset-bottom))] [-webkit-overflow-scrolling:touch] md:overflow-visible md:pb-0"
          >
            {children}
          </main>
          <MemberTabBar />
        </div>
      </div>
    </div>
  )
}

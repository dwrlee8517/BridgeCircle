import { redirect } from 'next/navigation'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'

/**
 * Auth-required layout. Wraps everything under (member). Three checks:
 *   1. session must exist (defense in depth on top of proxy.ts)
 *   2. user must have an active org_membership (otherwise sign them out —
 *      they signed in but were never invited)
 *   3. profile must be onboarded (otherwise redirect to /onboarding)
 *
 * "Onboarded" = current_employer is set. The invite-accept flow only sets
 * `name` (from the optional CSV column), so name IS NOT NULL would let users
 * skip onboarding when the admin pre-filled their name. current_employer is
 * only ever set during the onboarding form submission.
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
    await supabase.auth.signOut()
    redirect(
      `/sign-in?error=${encodeURIComponent(
        "We couldn't find an invite for this email. Ask your admin to send you one.",
      )}`,
    )
  }

  const { data: profile } = await supabase
    .from('base_profiles')
    .select('current_employer')
    .eq('user_id', session.userId)
    .maybeSingle()

  if (!profile?.current_employer) {
    redirect('/onboarding')
  }

  return <>{children}</>
}

import { redirect } from 'next/navigation'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'

/**
 * Auth-required layout. Wraps everything under (member). Two checks:
 *   1. session must exist (defense in depth on top of proxy.ts)
 *   2. profile must be onboarded (otherwise redirect to /onboarding)
 *
 * "Onboarded" = current_employer is set. We use that as the canary because:
 *   - The invite-accept flow only sets `name` (from the optional CSV column),
 *     so `name IS NOT NULL` would let users skip onboarding when the admin
 *     pre-filled their name on the invite.
 *   - current_employer is only ever set by the user during onboarding —
 *     that's a clean signal that they've gone through the form.
 */
export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession()
  const supabase = await createClient()

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

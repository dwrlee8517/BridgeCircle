import { redirect } from 'next/navigation'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'

/**
 * Auth-required layout. Wraps everything under (member). Two checks:
 *   1. session must exist (defense in depth on top of proxy.ts)
 *   2. base_profiles.name must be set (otherwise redirect to /onboarding)
 *
 * The proxy already redirects unauthenticated requests to /sign-in, so
 * step 1 is mostly belt-and-braces. Step 2 is the onboarding gate.
 */
export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('base_profiles')
    .select('name')
    .eq('user_id', session.userId)
    .maybeSingle()

  if (!profile?.name) {
    redirect('/onboarding')
  }

  return <>{children}</>
}

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/db/server'
import { getAppOrigin } from '@/lib/auth/app-url'
import { verifyInviteToken } from '@/lib/invite/verify'
import { acceptInvite } from '@/lib/invite/accept'

const PENDING_INVITE_COOKIE = 'pending_invite_token'

/**
 * OAuth callback. Supabase Auth redirects here with ?code=... after a
 * successful Google sign-in. We:
 *   1. Exchange the code for a session.
 *   2. If a pending_invite_token cookie is set (planted by /join), validate
 *      it again (defense in depth) and accept the invite.
 *   3. Redirect to /onboarding (new signups) or ?next= (returning users).
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const nextParam = url.searchParams.get('next')
  const errorParam = url.searchParams.get('error_description')

  // Use the public app origin, NOT the request URL's origin. On Railway
  // request.url returns the internal "localhost:8080" because the container
  // binds to that port; using it as the redirect base sends users to a dead
  // URL after sign-in.
  const origin = await getAppOrigin()

  if (errorParam) {
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent(errorParam)}`,
    )
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=missing_code`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) {
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent(error?.message ?? 'oauth_failed')}`,
    )
  }

  const cookieStore = await cookies()
  const pendingToken = cookieStore.get(PENDING_INVITE_COOKIE)?.value

  if (pendingToken) {
    cookieStore.delete(PENDING_INVITE_COOKIE)

    const verified = await verifyInviteToken(pendingToken)
    if (verified.ok && verified.invite.email.toLowerCase() === data.user.email?.toLowerCase()) {
      await acceptInvite({ inviteId: verified.invite.id, userId: data.user.id })
      return NextResponse.redirect(`${origin}/onboarding`)
    }
    // Mismatched email or invalid token. Fall through to the no-invite check
    // below — if they have a prior membership that's fine, otherwise we
    // bounce them out.
  }

  // Returning user (no pending invite cookie). Confirm they actually have an
  // active membership; otherwise this is a Google sign-in for someone who
  // never went through an invite, and we should not let them in.
  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('id')
    .eq('user_id', data.user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (!membership) {
    await supabase.auth.signOut()
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent(
        "We couldn't find an invite for this email. Ask your admin to send you one.",
      )}`,
    )
  }

  const safeNext = nextParam && nextParam.startsWith('/') ? nextParam : '/'
  return NextResponse.redirect(`${origin}${safeNext}`)
}

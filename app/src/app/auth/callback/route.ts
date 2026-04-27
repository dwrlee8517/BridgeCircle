import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/db/server'
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
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next')
  const errorParam = searchParams.get('error_description')

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
    // Mismatched email or invalid token: still sign in but show the error.
    // The (member) layout will block access until they get a real invite.
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent('Invite token did not match this Google account.')}`,
    )
  }

  const safeNext = nextParam && nextParam.startsWith('/') ? nextParam : '/'
  return NextResponse.redirect(`${origin}${safeNext}`)
}

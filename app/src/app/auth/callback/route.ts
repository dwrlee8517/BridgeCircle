import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { clearMembershipPreference, setMembershipPreference } from '@/app/_lib/membership-cookie'
import { createAdminClient } from '@/db/admin'
import {
  createInviteAcceptanceRepository,
  createInviteVerificationRepository,
} from '@/db/repositories/invites'
import { getMemberContext } from '@/db/repositories/member-context'
import { createClient } from '@/db/server'
import { getAppOrigin } from '@/lib/auth/app-url'
import { acceptInvite } from '@/lib/invite/accept'
import { verifyInviteToken } from '@/lib/invite/verify'

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
    return NextResponse.redirect(`${origin}/sign-in?error=${encodeURIComponent(errorParam)}`)
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

    const verified = await verifyInviteToken(
      pendingToken,
      createInviteVerificationRepository(createAdminClient()),
    )
    if (verified.ok && verified.invite.email.toLowerCase() === data.user.email?.toLowerCase()) {
      const accepted = await acceptInvite(pendingToken, createInviteAcceptanceRepository(supabase))
      if (accepted.ok) {
        await setMembershipPreference(accepted.membershipId)
        return NextResponse.redirect(`${origin}/onboarding?step=1`)
      }
    }
    // Mismatched/invalid invite. Existing members keep their account; a new
    // empty Auth account is removed below after the context check.
  }

  // Returning user (no pending invite cookie). Branch on lifecycle state:
  //   1. Active membership exists → land on /<next>
  //   2. No active, but pending self-delete grace → /cancel-delete
  //   3. No active, but self_deactivated memberships exist → /reactivate
  //   4. Pending approval membership exists → /onboarding pending screen
  //   5. Otherwise → not invited / not authorized → reject
  //
  // Admin-initiated deletions ban the auth user immediately, so they never
  // reach this branch — the auth.exchangeCodeForSession above fails for
  // banned users and we redirect to /sign-in with the error.
  const context = await getMemberContext(supabase)
  const hasActive = context.memberships.some((membership) => membership.status === 'active')
  const hasPending = context.memberships.some((membership) => membership.status === 'pending')

  if (hasActive) {
    // Onboarding gate for returning users: if their onboarding wasn't
    // finished (e.g. they signed up via password, bailed mid-flow, then
    // signed back in via Google later), route them to the staged flow.
    if (!context.onboardingCompletedAt) {
      return NextResponse.redirect(`${origin}/onboarding`)
    }
    const safeNext = nextParam?.startsWith('/') ? nextParam : '/'
    return NextResponse.redirect(`${origin}${safeNext}`)
  }

  if (context.deleteScheduledFor && !context.deleteInitiatedByAdmin && !context.deletedAt) {
    return NextResponse.redirect(`${origin}/cancel-delete`)
  }

  if (hasPending) {
    return NextResponse.redirect(`${origin}/onboarding`)
  }

  await supabase.auth.signOut()
  await clearMembershipPreference()
  if (context.memberships.length === 0) {
    await createAdminClient().auth.admin.deleteUser(data.user.id)
  }
  return NextResponse.redirect(
    `${origin}/sign-in?error=${encodeURIComponent(
      "We couldn't find an invite for this email. Ask your admin to send you one.",
    )}`,
  )
}

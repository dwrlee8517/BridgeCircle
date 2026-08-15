import { NextResponse } from 'next/server'
import { setMembershipPreference } from '@/app/_lib/membership-cookie'
import { createAdminClient } from '@/db/admin'
import { createDemoWindowsRepository } from '@/db/repositories/demo-windows'
import { getMemberContext } from '@/db/repositories/member-context'
import { createClient } from '@/db/server'
import { getAppOrigin } from '@/lib/auth/app-url'
import { authorizeDemoDoor } from '@/lib/demo/gate'
import { validateDemoEntry } from '@/lib/demo/windows'
import { memberEntryPath } from '@/lib/entry/routing'

/**
 * The demo door. While an armed window is open (see /demo/arm), a visitor
 * holding the current link enters as the seeded demo persona: a real Supabase
 * session, scoped by RLS to the demo organization like any other member.
 *
 * The persona has no usable password — entry works by minting a one-time
 * magic-link token server-side and consuming it immediately, so there is no
 * standing credential that could sign in through /sign-in between windows.
 *
 * Every failure — gate closed, no window, wrong token, sign-in trouble, or a
 * persona that is not a demo-org member — is a plain 404, so outside an armed
 * window the route reads as nonexistent.
 */
export async function GET(request: Request) {
  const notFound = () => new NextResponse(null, { status: 404 })

  try {
    const open = authorizeDemoDoor({
      enabled: process.env.DEMO_LOGIN_ENABLED,
      appEnv: process.env.APP_ENV,
      configuredAppUrl: process.env.NEXT_PUBLIC_APP_URL,
    })
    if (!open) return notFound()
  } catch (error) {
    console.error('demo door misconfiguration', error)
    return notFound()
  }

  const url = new URL(request.url)
  const token = url.searchParams.get('k') ?? ''

  const admin = createAdminClient()
  const admitted = await validateDemoEntry({
    repository: createDemoWindowsRepository(admin),
    now: new Date(),
    token,
  })
  if (!admitted) return notFound()

  const email = process.env.DEMO_USER_EMAIL
  if (!email) {
    console.error('demo door is armed but DEMO_USER_EMAIL is unset')
    return notFound()
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })
  const tokenHash = linkData?.properties?.hashed_token
  if (linkError || !tokenHash) {
    console.error('demo door could not mint an entry token', linkError?.message)
    return notFound()
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash: tokenHash,
  })
  if (error || !data.user) {
    console.error('demo door sign-in failed', error?.message)
    return notFound()
  }

  // Refuse to hand out a session for anything but the demo-org persona — a
  // mispointed DEMO_USER_EMAIL must never admit visitors into a real account.
  const context = await getMemberContext(supabase)
  const membership = context.memberships.find(
    (candidate) => candidate.membershipId === context.selectedMembershipId,
  )
  if (!membership || membership.organization.slug !== 'demo') {
    console.error('demo door persona is not a demo-org member — refusing entry')
    await supabase.auth.signOut()
    return notFound()
  }
  await setMembershipPreference(membership.membershipId)

  const origin = await getAppOrigin()
  return NextResponse.redirect(`${origin}${memberEntryPath(context, url.searchParams.get('next'))}`)
}

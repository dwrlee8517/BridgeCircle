import type { EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/db/server'
import { getAppOrigin } from '@/lib/auth/app-url'
import { safeNextPath } from '@/lib/entry/routing'

const RECOVERY_TYPE: EmailOtpType = 'recovery'

/**
 * Server-side email confirmation for Supabase Auth token hashes.
 *
 * Recovery emails must land here rather than at GoTrue's default verify URL:
 * the default returns a session in the URL fragment, which a server-rendered
 * route cannot read. verifyOtp returns the session to the server client so it
 * can persist the auth cookies before redirecting to the password form.
 */
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash')
  const type = request.nextUrl.searchParams.get('type')
  const next = safeNextPath(request.nextUrl.searchParams.get('next'), '/reset-password/update')
  const origin = await getAppOrigin()

  if (tokenHash && type === RECOVERY_TYPE) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: RECOVERY_TYPE,
    })
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(
    `${origin}/sign-in?error=${encodeURIComponent('That reset link expired. Request a new one.')}`,
  )
}

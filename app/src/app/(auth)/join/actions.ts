'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createAdminClient } from '@/db/admin'
import { createClient } from '@/db/server'
import { getAppOrigin } from '@/lib/auth/app-url'
import { acceptInvite } from '@/lib/invite/accept'
import { verifyInviteToken } from '@/lib/invite/verify'

const PENDING_INVITE_COOKIE = 'pending_invite_token'
const PENDING_INVITE_TTL_SECONDS = 60 * 10

export type JoinState = {
  error?: string
}

const joinSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(72),
})

export async function signUpWithPassword(_prev: JoinState, formData: FormData): Promise<JoinState> {
  const parsed = joinSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const verified = await verifyInviteToken(parsed.data.token)
  if (!verified.ok) {
    return { error: errorMessage(verified.error) }
  }

  const admin = createAdminClient()
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: verified.invite.email,
    password: parsed.data.password,
    email_confirm: true,
  })
  if (createErr || !created.user) {
    if (createErr?.message?.toLowerCase().includes('already')) {
      return {
        error: 'An account with this email already exists. Sign in on the sign-in page instead.',
      }
    }
    return { error: 'Could not create account. Please try again.' }
  }

  const supabase = await createClient()
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: verified.invite.email,
    password: parsed.data.password,
  })
  if (signInErr) {
    return { error: 'Account was created but sign-in failed. Try signing in directly.' }
  }

  const accept = await acceptInvite({ inviteId: verified.invite.id, userId: created.user.id })
  if (!accept.ok) {
    return { error: 'Account was created but accepting the invite failed. Contact your admin.' }
  }

  redirect('/onboarding?step=1')
}

export async function startGoogleSignup(formData: FormData) {
  const token = formData.get('token')
  if (typeof token !== 'string' || token.length === 0) {
    redirect('/sign-in?error=missing_token')
  }

  const verified = await verifyInviteToken(token as string)
  if (!verified.ok) {
    redirect(`/join?token=${encodeURIComponent(token as string)}&error=${verified.error}`)
  }

  const cookieStore = await cookies()
  cookieStore.set(PENDING_INVITE_COOKIE, token as string, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: PENDING_INVITE_TTL_SECONDS,
    path: '/',
  })

  const supabase = await createClient()
  const origin = await getAppOrigin()
  const redirectTo = `${origin}/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      // Force the account picker so users explicitly choose the Google
      // account that matches the invite email. Otherwise the silent flow
      // can use whatever account Chrome is currently signed into, fail the
      // email-match check in /auth/callback, and confuse the user.
      queryParams: { prompt: 'select_account' },
    },
  })
  if (error || !data.url) {
    redirect('/sign-in?error=oauth_start_failed')
  }
  redirect(data.url)
}

function errorMessage(err: 'not_found' | 'expired' | 'revoked' | 'accepted'): string {
  switch (err) {
    case 'not_found':
      return 'This invite is not valid.'
    case 'expired':
      return 'This invite has expired. Ask your admin to send a new one.'
    case 'revoked':
      return 'This invite has been revoked.'
    case 'accepted':
      return 'This invite has already been used. Sign in instead.'
  }
}

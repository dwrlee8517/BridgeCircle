'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/db/server'
import { getAppOrigin } from '@/lib/auth/app-url'
import { signInSchema } from '@/lib/invite/schemas'

export type SignInState = {
  error?: string
}

export async function signInWithPassword(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { error: 'Enter a valid email and password.' }
  }

  const supabase = await createClient()
  const { error, data } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) {
    return { error: 'Invalid email or password.' }
  }

  // Onboarding gate: users without onboarding_completed_at land on the
  // staged onboarding flow regardless of where they were headed. Once
  // they finish (or skip-through) they land at /. Returning users
  // (onboarding_completed_at non-null) honor `next` or land at /.
  const next = formData.get('next')
  const safeNext = typeof next === 'string' && next.startsWith('/') ? next : '/'
  if (data.user) {
    const { data: userRow } = await supabase
      .from('users')
      .select('onboarding_completed_at')
      .eq('id', data.user.id)
      .maybeSingle()
    if (!userRow?.onboarding_completed_at) {
      redirect('/onboarding')
    }
  }
  redirect(safeNext)
}

export async function signInWithGoogle(formData: FormData) {
  const supabase = await createClient()
  const origin = await getAppOrigin()
  const next = formData.get('next')
  const redirectTo = `${origin}/auth/callback${
    typeof next === 'string' && next.startsWith('/') ? `?next=${encodeURIComponent(next)}` : ''
  }`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      // Force the account picker so users can switch accounts on /sign-in
      // instead of getting silently logged in as whoever Chrome happens to be
      // currently signed into.
      queryParams: { prompt: 'select_account' },
    },
  })
  if (error || !data.url) {
    redirect(`/sign-in?error=${encodeURIComponent('Could not start Google sign-in.')}`)
  }
  redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/sign-in')
}

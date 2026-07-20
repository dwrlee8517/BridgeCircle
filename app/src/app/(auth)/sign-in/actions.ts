'use server'

import { redirect } from 'next/navigation'
import { clearMembershipPreference } from '@/app/_lib/membership-cookie'
import { getMemberContext } from '@/db/repositories/member-context'
import { createClient } from '@/db/server'
import { getAppOrigin } from '@/lib/auth/app-url'
import { memberEntryPath, safeNextPath } from '@/lib/entry/routing'
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

  const next = formData.get('next')
  if (data.user) {
    redirect(memberEntryPath(await getMemberContext(supabase), next))
  }
  redirect('/')
}

export async function signInWithGoogle(formData: FormData) {
  const supabase = await createClient()
  const origin = await getAppOrigin()
  const next = formData.get('next')
  const safeNext = safeNextPath(next, '')
  const redirectTo = `${origin}/auth/callback${
    safeNext ? `?next=${encodeURIComponent(safeNext)}` : ''
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
  await clearMembershipPreference()
  redirect('/sign-in')
}

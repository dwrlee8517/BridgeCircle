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
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) {
    return { error: 'Invalid email or password.' }
  }

  const next = formData.get('next')
  redirect(typeof next === 'string' && next.startsWith('/') ? next : '/')
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
    options: { redirectTo },
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

'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/db/server'
import { getAppOrigin } from '@/lib/auth/app-url'

export type ResetRequestState = {
  /** True once the request was processed — copy never reveals whether the email exists. */
  done?: boolean
  error?: string
}

const emailSchema = z.object({ email: z.string().email() })

export async function requestPasswordReset(
  _prev: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const parsed = emailSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) {
    return { error: 'Enter the email you use for BridgeCircle.' }
  }

  const supabase = await createClient()
  const origin = await getAppOrigin()
  // The custom Supabase recovery template sends its token hash to
  // /auth/confirm, which verifies it server-side and persists the session
  // before landing on the update form. Errors are intentionally not surfaced
  // here — the response must not reveal whether an email is in the circle.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent('/reset-password/update')}`,
  })

  return { done: true }
}

export type UpdatePasswordState = {
  error?: string
}

const passwordSchema = z.object({ password: z.string().min(8).max(200) })

export async function updatePassword(
  _prev: UpdatePasswordState,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const parsed = passwordSchema.safeParse({ password: formData.get('password') })
  if (!parsed.success) {
    return { error: 'Passwords need at least 8 characters.' }
  }

  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    redirect(`/sign-in?error=${encodeURIComponent('That reset link expired. Request a new one.')}`)
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) {
    return { error: "We couldn't save that password. Try a different one." }
  }

  redirect('/')
}

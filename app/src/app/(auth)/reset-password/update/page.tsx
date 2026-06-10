import { redirect } from 'next/navigation'
import { createClient } from '@/db/server'
import { UpdatePasswordForm } from './update-password-form'

export const metadata = { title: 'Choose a new password · BridgeCircle' }

/**
 * Landing page for the recovery link. The /auth/callback exchange has
 * already signed the member in; without a session the link is stale,
 * so bounce back to the request form.
 */
export default async function UpdatePasswordPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) {
    redirect(`/sign-in?error=${encodeURIComponent('That reset link expired. Request a new one.')}`)
  }

  return <UpdatePasswordForm />
}

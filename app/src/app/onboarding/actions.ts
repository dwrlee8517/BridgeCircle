'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { saveProfile } from '@/lib/profile/saveProfile'
import { parseProfileForm } from '@/lib/profile/schemas'
import type { ProfileFormState } from '@/components/profile-form'

export async function onboardingAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const session = await requireSession()
  const parsed = parseProfileForm(formData)

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.')
      if (!fieldErrors[path]) fieldErrors[path] = issue.message
    }
    return { error: 'Please fix the highlighted fields.', fieldErrors }
  }

  const supabase = await createClient()
  const result = await saveProfile(supabase, session.userId, parsed.data)

  if (!result.ok) {
    if (result.error === 'no_membership') {
      await supabase.auth.signOut()
      redirect(
        `/sign-in?error=${encodeURIComponent(
          "We couldn't find an invite for this email. Ask your admin to send you one.",
        )}`,
      )
    }
    return { error: 'Could not save your profile. Try again.' }
  }

  redirect('/')
}

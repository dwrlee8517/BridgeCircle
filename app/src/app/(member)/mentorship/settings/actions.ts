'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/db/server'
import { saveHelperPreference } from '@/lib/asks/preferences'
import { parseHelperPreferenceForm } from '@/lib/asks/schemas'
import { requireSession } from '@/lib/auth/session'

export type SettingsFormState = {
  ok?: boolean
  error?: string
  fieldErrors?: Record<string, string>
}

export async function saveMentorSettings(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const session = await requireSession()
  const parsed = parseHelperPreferenceForm(formData)

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.')
      if (!fieldErrors[path]) fieldErrors[path] = issue.message
    }
    return { error: 'Please fix the highlighted fields.', fieldErrors }
  }

  const supabase = await createClient()
  const result = await saveHelperPreference(supabase, session.userId, parsed.data)

  if (!result.ok) {
    if (result.error === 'no_membership') {
      return { error: 'Could not find your organization. Try signing out and back in.' }
    }
    return { error: 'Could not save your settings. Try again.' }
  }

  revalidatePath('/mentorship/settings')
  revalidatePath(`/profile/${session.userId}`)
  return { ok: true }
}

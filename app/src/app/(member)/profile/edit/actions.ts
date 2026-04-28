'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { ProfileFormState } from '@/components/profile-form'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { PRIVACY_SECTIONS, privacySettingsSchema } from '@/lib/profile/privacy'
import { savePrivacySettings } from '@/lib/profile/savePrivacySettings'
import { saveProfile } from '@/lib/profile/saveProfile'
import { parseProfileForm } from '@/lib/profile/schemas'

export async function editProfileAction(
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
    return { error: 'Could not save your profile. Try again.' }
  }

  redirect(`/profile/${session.userId}`)
}

export type PrivacyFormState = { ok: boolean; message: string } | null

/**
 * Save the privacy panel. Reads each section from form fields and persists
 * non-default tiers to base_profiles.privacy_settings.
 */
export async function savePrivacySettingsAction(
  _prev: PrivacyFormState,
  formData: FormData,
): Promise<PrivacyFormState> {
  const session = await requireSession()

  const raw: Record<string, FormDataEntryValue | null> = {}
  for (const section of PRIVACY_SECTIONS) {
    raw[section] = formData.get(section)
  }
  const parsed = privacySettingsSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, message: 'Invalid privacy selection.' }
  }

  const supabase = await createClient()
  const result = await savePrivacySettings(supabase, session.userId, parsed.data)
  if (!result.ok) {
    return { ok: false, message: 'Could not save privacy settings.' }
  }

  revalidatePath(`/profile/${session.userId}`)
  return { ok: true, message: 'Privacy settings saved.' }
}

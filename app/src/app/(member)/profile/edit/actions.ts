'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import type { ProfileFormState } from '@/components/profile-form'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { refreshFromLinkedIn } from '@/lib/enrichment/manualRefresh'
import { PRIVACY_SECTIONS, privacySettingsSchema } from '@/lib/profile/privacy'
import { savePrivacySettings } from '@/lib/profile/savePrivacySettings'
import { saveProfile } from '@/lib/profile/saveProfile'
import { SELF_DELETE_REASON_CATEGORIES, scheduleSelfDelete } from '@/lib/profile/scheduleSelfDelete'
import { parseProfileForm } from '@/lib/profile/schemas'
import { selfDeactivate } from '@/lib/profile/selfDeactivate'
import { uploadAvatar } from '@/lib/profile/uploadAvatar'

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

  // ?saved=1 lets the destination page render a "Profile saved" banner.
  // Server-side flag (not a client toast) so it survives the redirect
  // without needing to wire Sonner through the (member) layout.
  redirect(`/profile/${session.userId}?saved=1`)
}

/**
 * "Update from LinkedIn" — manual on-demand refresh.
 *
 * Calls the live LinkdAPI primary, falls back to PDL on failure. If the
 * fetched profile fingerprint matches the last stored one, redirects with
 * ?refresh=none for a "no updates found" banner. Otherwise creates a
 * profile_change_proposals row and redirects to its review page.
 */
export async function refreshFromLinkedInAction(): Promise<void> {
  const session = await requireSession()
  const result = await refreshFromLinkedIn({ userId: session.userId })

  if (!result.ok) {
    const code =
      result.error === 'no_settings'
        ? 'no-url'
        : result.error === 'all_providers_failed'
          ? 'failed'
          : result.error === 'quality_rejected'
            ? 'rejected'
            : 'error'
    redirect(`/profile/edit?refresh=${code}`)
  }

  if (result.outcome === 'no_meaningful_change') {
    redirect('/profile/edit?refresh=none')
  }

  redirect(`/profile/proposals/${result.proposalId}`)
}

export type AvatarUploadResult = { error?: string; publicUrl?: string }

/**
 * Upload a new avatar to the public 'avatars' bucket and update the
 * caller's base_profile.avatar_url. Called from the AvatarUploader client
 * component on file change.
 */
export async function uploadAvatarAction(formData: FormData): Promise<AvatarUploadResult> {
  const session = await requireSession()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return { error: 'No file selected.' }
  }
  const supabase = await createClient()
  const result = await uploadAvatar(supabase, session.userId, file)
  if (!result.ok) {
    const messages: Record<typeof result.error, string> = {
      too_large: 'File is too large. Please pick something under 5 MB.',
      unsupported_type: 'Unsupported format. Use JPEG, PNG, WebP, or GIF.',
      upload_failed: 'Upload failed. Please try again.',
      profile_update_failed: 'Uploaded, but could not update your profile. Refresh and retry.',
    }
    return { error: messages[result.error] }
  }
  revalidatePath('/profile/edit')
  revalidatePath(`/profile/${session.userId}`)
  return { publicUrl: result.publicUrl }
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

// =============================================================================
// Danger zone — self-deactivate / self-delete
// =============================================================================

export type SelfDeactivateState = { ok?: boolean; error?: string }

/**
 * User pauses their own account. No dialog, no email — silent. After flipping
 * memberships to self_deactivated, sign the user out so they don't continue
 * navigating into pages that will all be empty under RLS.
 */
export async function selfDeactivateAction(
  _prev: SelfDeactivateState,
  _formData: FormData,
): Promise<SelfDeactivateState> {
  const session = await requireSession()
  const result = await selfDeactivate({ userId: session.userId })

  if (!result.ok) {
    if (result.error === 'no_active_membership') {
      return { error: 'You have no active membership to deactivate.' }
    }
    return { error: 'Could not deactivate. Try again.' }
  }

  // Sign out so navigation cleanly resets. The user can sign back in any time
  // and the auth callback will route them to /reactivate.
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/sign-in?paused=1')
}

const selfDeleteSchema = z.object({
  reasonCategory: z.enum(SELF_DELETE_REASON_CATEGORIES),
  customReason: z.string().trim().max(1000).optional(),
})

export type SelfDeleteState = { ok?: boolean; error?: string }

/**
 * User schedules their own account for deletion (30-day grace). After
 * scheduling, redirect to /cancel-delete which doubles as their landing page
 * during grace — they can change their mind there at any time.
 */
export async function scheduleSelfDeleteAction(
  _prev: SelfDeleteState,
  formData: FormData,
): Promise<SelfDeleteState> {
  const session = await requireSession()

  const parsed = selfDeleteSchema.safeParse({
    reasonCategory: formData.get('reasonCategory'),
    customReason: formData.get('customReason') ?? undefined,
  })
  if (!parsed.success) return { error: 'Please pick a reason.' }

  const result = await scheduleSelfDelete({
    userId: session.userId,
    reasonCategory: parsed.data.reasonCategory,
    customReason: parsed.data.customReason ?? null,
  })

  if (!result.ok) {
    if (result.error === 'already_scheduled') {
      return { error: 'Your account is already scheduled for deletion.' }
    }
    return { error: 'Could not schedule deletion. Try again.' }
  }

  redirect('/cancel-delete')
}

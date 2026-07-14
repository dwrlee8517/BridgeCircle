'use server'

import { revalidatePath } from 'next/cache'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { createAvatarStorageRepository } from '@/db/repositories/avatar-storage'
import { createProfileRepository } from '@/db/repositories/profiles'
import { requireSession } from '@/lib/auth/session'
import { selectedMembership } from '@/lib/membership/selection'
import { uploadAvatar } from '@/lib/profile/uploadAvatar'

export type AvatarUploadResult = { error?: string; publicUrl?: string }

export async function uploadAvatarAction(formData: FormData): Promise<AvatarUploadResult> {
  const session = await requireSession()
  const file = formData.get('file')
  if (!(file instanceof File)) return { error: 'No file selected.' }

  const { client, context } = await loadMemberContext()
  const membership = selectedMembership(context)
  if (!membership || (membership.status !== 'active' && membership.status !== 'pending')) {
    return { error: 'Choose an available circle before adding a photo.' }
  }

  const result = await uploadAvatar({
    storage: createAvatarStorageRepository(client),
    profiles: createProfileRepository(client),
    membershipId: membership.membershipId,
    userId: session.userId,
    file,
  })
  if (!result.ok) {
    const messages: Record<typeof result.error, string> = {
      too_large: 'File is too large. Please pick something under 5 MB.',
      unsupported_type: 'Unsupported format. Use JPEG, PNG, or WebP.',
      upload_failed: 'Upload failed. Please try again.',
      profile_update_failed: 'Uploaded, but could not update your profile. Refresh and retry.',
    }
    return { error: messages[result.error] }
  }

  revalidatePath('/onboarding')
  revalidatePath('/profile/edit')
  revalidatePath(`/profile/${session.userId}`)
  return { publicUrl: result.publicUrl }
}

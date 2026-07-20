import type { AvatarStorageRepository, ProfileRepository } from './contracts'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export type UploadAvatarResult =
  | { ok: true; publicUrl: string }
  | {
      ok: false
      error: 'too_large' | 'unsupported_type' | 'upload_failed' | 'profile_update_failed'
      detail?: string
    }

export async function uploadAvatar(input: {
  storage: AvatarStorageRepository
  profiles: Pick<ProfileRepository, 'setAvatarPath'>
  membershipId: string
  userId: string
  file: File
  now?: () => number
}): Promise<UploadAvatarResult> {
  if (input.file.size > MAX_BYTES) {
    return { ok: false, error: 'too_large', detail: `${Math.round(input.file.size / 1024)} KB` }
  }
  if (!ALLOWED_TYPES.has(input.file.type)) {
    return { ok: false, error: 'unsupported_type', detail: input.file.type || 'unknown' }
  }

  const path = `${input.userId}/${(input.now ?? Date.now)()}.${extension(input.file.type)}`
  const uploaded = await input.storage.upload(path, input.file)
  if (!uploaded.ok) return { ok: false, error: 'upload_failed', detail: uploaded.error }

  const persisted = await input.profiles.setAvatarPath(input.membershipId, path)
  if (persisted !== 'saved') {
    return { ok: false, error: 'profile_update_failed', detail: persisted }
  }

  return { ok: true, publicUrl: input.storage.publicUrl(path) }
}

function extension(contentType: string) {
  switch (contentType) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    default:
      return 'bin'
  }
}

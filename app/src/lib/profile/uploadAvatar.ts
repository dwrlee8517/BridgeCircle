import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

const BUCKET = 'avatars'

const MAX_BYTES = 4 * 1024 * 1024 // 4 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export type UploadAvatarResult =
  | { ok: true; publicUrl: string }
  | {
      ok: false
      error: 'too_large' | 'unsupported_type' | 'upload_failed' | 'profile_update_failed'
      detail?: string
    }

/**
 * Upload an avatar image to the public avatars bucket and update the
 * caller's base_profile.avatar_url.
 *
 * File is stored at avatars/<userId>/<timestamp>.<ext>; old uploads stay
 * around (cheap, and lets us roll back if the new one is bad). The lib
 * layer doesn't currently garbage-collect — that's acceptable at our
 * scale and avoids the "uploaded but profile update failed → orphan
 * URL" race.
 */
export async function uploadAvatar(
  supabase: SupabaseClient<Database>,
  userId: string,
  file: File,
): Promise<UploadAvatarResult> {
  if (file.size > MAX_BYTES) {
    return { ok: false, error: 'too_large', detail: `${Math.round(file.size / 1024)} KB` }
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return { ok: false, error: 'unsupported_type', detail: file.type || 'unknown' }
  }

  const ext = extFromContentType(file.type)
  const path = `${userId}/${Date.now()}.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (uploadErr) {
    return { ok: false, error: 'upload_failed', detail: uploadErr.message }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path)

  const { error: updateErr } = await supabase
    .from('base_profiles')
    .update({ avatar_url: publicUrl })
    .eq('user_id', userId)

  if (updateErr) {
    return { ok: false, error: 'profile_update_failed', detail: updateErr.message }
  }

  return { ok: true, publicUrl }
}

function extFromContentType(contentType: string): string {
  switch (contentType) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    default:
      return 'bin'
  }
}

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import type { AvatarStorageRepository } from '@/lib/profile/contracts'

const BUCKET = 'avatars'

export function createAvatarStorageRepository(
  client: SupabaseClient<Database>,
): AvatarStorageRepository {
  return {
    async upload(path, file) {
      const { error } = await client.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false })
      return error ? { ok: false, error: error.message } : { ok: true }
    },
    publicUrl(path) {
      return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
    },
  }
}

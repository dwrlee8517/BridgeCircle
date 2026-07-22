import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import type { AccountExportStorage } from '@/lib/settings/contracts'

export function createAccountExportStorage(client: SupabaseClient<Database>): AccountExportStorage {
  return {
    async createSignedUrl(bucket, path) {
      const { data, error } = await client.storage.from(bucket).createSignedUrl(path, 60)
      if (error) throw new Error('Could not create account export download')
      return data.signedUrl
    },
  }
}

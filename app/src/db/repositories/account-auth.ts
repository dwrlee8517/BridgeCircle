import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import type { AccountAuthRepository } from '@/lib/settings/contracts'

export function createAccountAuthRepository(
  client: SupabaseClient<Database>,
): AccountAuthRepository {
  return {
    async changeEmail(email) {
      const { error } = await client.auth.updateUser({ email })
      return error ? 'failed' : 'changed'
    },
  }
}

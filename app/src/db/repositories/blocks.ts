import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

export type BlockRepository = {
  block(userId: string): Promise<void>
  unblock(userId: string): Promise<void>
}

export function createBlockRepository(client: SupabaseClient<Database>): BlockRepository {
  return {
    async block(userId) {
      const { error } = await client
        .schema('api')
        .rpc('block_member', { p_blocked_user_id: userId })
      if (error) throw new Error(`blockMember: ${error.message}`)
    },
    async unblock(userId) {
      const { error } = await client
        .schema('api')
        .rpc('unblock_member', { p_blocked_user_id: userId })
      if (error) throw new Error(`unblockMember: ${error.message}`)
    },
  }
}

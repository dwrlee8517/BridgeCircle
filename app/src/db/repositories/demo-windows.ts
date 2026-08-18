import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import type { DemoWindowsRepository } from '@/lib/demo/windows'

/**
 * Service-role implementation of the demo windows repository. The table and
 * the session-revocation RPC are locked to service_role, so `client` must be
 * the admin client — the demo door and arm page are the only callers.
 */
export function createDemoWindowsRepository(
  client: SupabaseClient<Database>,
): DemoWindowsRepository {
  return {
    async insertWindow({ tokenHash, expiresAt, armedByUserId }) {
      const { error } = await client.from('demo_access_windows').insert({
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        armed_by_user_id: armedByUserId,
      })
      if (error) throw new Error(`insertWindow: ${error.message}`)
    },

    async activeWindows(now) {
      const { data, error } = await client
        .from('demo_access_windows')
        .select('id, token_hash, expires_at, created_at')
        .is('revoked_at', null)
        .gt('expires_at', now.toISOString())
      if (error) throw new Error(`activeWindows: ${error.message}`)
      return (data ?? []).map((row) => ({
        id: row.id,
        tokenHash: row.token_hash,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
      }))
    },

    async revokeAllWindows(now) {
      const { error } = await client
        .from('demo_access_windows')
        .update({ revoked_at: now.toISOString() })
        .is('revoked_at', null)
      if (error) throw new Error(`revokeAllWindows: ${error.message}`)
    },

    async revokeDemoSessions() {
      const { error } = await client.schema('api').rpc('demo_revoke_sessions')
      if (error) throw new Error(`revokeDemoSessions: ${error.message}`)
    },
  }
}

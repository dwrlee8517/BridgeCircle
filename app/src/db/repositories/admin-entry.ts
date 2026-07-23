import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/db/database.types'

const pendingMembershipSchema = z.object({
  membership_id: z.guid(),
  user_id: z.guid(),
  display_name: z.string().nullable(),
  avatar_path: z.string().nullable(),
  graduation_year: z.number().int().nullable(),
  requested_at: z.string(),
})

export type PendingMembership = {
  membershipId: string
  userId: string
  displayName: string | null
  avatarPath: string | null
  graduationYear: number | null
  requestedAt: string
}

export function createAdminEntryRepository(client: SupabaseClient<Database>) {
  return {
    async listPending(input: {
      organizationId: string
      beforeCreatedAt?: string
      beforeId?: string
      limit?: number
    }): Promise<PendingMembership[]> {
      const { data, error } = await client.schema('api').rpc('list_pending_memberships', {
        p_organization_id: input.organizationId,
        p_before_created_at: input.beforeCreatedAt,
        p_before_id: input.beforeId,
        p_limit: input.limit,
      })
      if (error) throw new Error(`listPendingMemberships: ${error.message}`)
      return (data ?? []).map((row) => {
        const parsed = pendingMembershipSchema.parse(row)
        return {
          membershipId: parsed.membership_id,
          userId: parsed.user_id,
          displayName: parsed.display_name,
          avatarPath: parsed.avatar_path,
          graduationYear: parsed.graduation_year,
          requestedAt: parsed.requested_at,
        }
      })
    },
  }
}

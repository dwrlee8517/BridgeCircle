import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/db/database.types'
import type {
  AdminMemberListResult,
  AdminMembersRepository,
  AdminRoleChangeResult,
} from '@/lib/admin/contracts'

const memberSchema = z
  .object({
    membershipId: z.uuid(),
    userId: z.uuid(),
    displayName: z.string().nullable(),
    title: z.string().nullable(),
    employer: z.string().nullable(),
    city: z.string().nullable(),
    graduationYear: z.number().int().nullable(),
    status: z.enum(['pending', 'active', 'rejected', 'revoked']),
    joinedAt: z.string().nullable(),
    createdAt: z.string(),
    accountState: z.enum(['active', 'deletion_scheduled']),
    lastSeenAt: z.string().nullable(),
    openToHelp: z.boolean(),
    roles: z.array(z.string()),
  })
  .strict()

const listSchema = z.discriminatedUnion('resultCode', [
  z.object({ resultCode: z.literal('ok'), total: z.number().int(), items: z.array(memberSchema) }),
  z.object({ resultCode: z.enum(['invalid_input', 'not_available']) }),
])

const roleChangeSchema = z.object({
  resultCode: z.enum([
    'granted',
    'already_granted',
    'revoked',
    'not_found',
    'invalid_input',
    'not_available',
    'forbidden',
  ]),
})

export function parseAdminMemberList(value: unknown): AdminMemberListResult {
  const parsed = listSchema.parse(value)
  if (parsed.resultCode === 'ok') {
    return { ok: true, total: parsed.total, items: parsed.items }
  }
  return { ok: false, error: parsed.resultCode }
}

export function parseAdminRoleChange(value: unknown): AdminRoleChangeResult {
  const { resultCode } = roleChangeSchema.parse(value)
  if (
    resultCode === 'granted' ||
    resultCode === 'already_granted' ||
    resultCode === 'revoked' ||
    resultCode === 'not_found'
  ) {
    return { ok: true, status: resultCode }
  }
  return { ok: false, error: resultCode }
}

export function createAdminMembersRepository(
  client: SupabaseClient<Database>,
): AdminMembersRepository {
  const rpc = client.schema('api')

  return {
    async list(input) {
      const { data, error } = await rpc.rpc('list_admin_members', {
        p_membership_id: input.membershipId,
        p_search: input.search ?? undefined,
        p_class_year: input.classYear ?? undefined,
        p_status: input.status ?? undefined,
        p_open_to_help: input.openToHelp ?? undefined,
        p_inactive_days: input.inactiveDays ?? undefined,
        p_limit: input.limit ?? 100,
        p_offset: input.offset ?? 0,
      })
      if (error) throw new Error(`listAdminMembers: ${error.message}`)
      return parseAdminMemberList(data)
    },

    async grantRole(input) {
      const { data, error } = await rpc.rpc('admin_grant_role', {
        p_membership_id: input.membershipId,
        p_target_membership_id: input.targetMembershipId,
        p_role: input.role,
      })
      if (error) throw new Error(`adminGrantRole: ${error.message}`)
      return parseAdminRoleChange(data)
    },

    async revokeRole(input) {
      const { data, error } = await rpc.rpc('admin_revoke_role', {
        p_membership_id: input.membershipId,
        p_target_membership_id: input.targetMembershipId,
        p_role: input.role,
      })
      if (error) throw new Error(`adminRevokeRole: ${error.message}`)
      return parseAdminRoleChange(data)
    },
  }
}

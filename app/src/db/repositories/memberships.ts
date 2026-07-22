import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/db/database.types'
import type { MembershipDecisionRepository, MembershipDecisionResult } from '@/lib/admin/contracts'

const decisionRowSchema = z
  .object({
    result_code: z.enum([
      'approved',
      'rejected',
      'invalid_decision',
      'invalid_reason',
      'not_found',
      'not_authorized',
      'not_available',
      'not_pending',
    ]),
    membership_status: z.string().nullable(),
  })
  .strict()

export function parseMembershipDecisionRow(value: unknown): MembershipDecisionResult {
  const row = decisionRowSchema.parse(value)
  if (row.result_code === 'approved' && row.membership_status === 'active') {
    return { ok: true, membershipStatus: 'active' }
  }
  if (row.result_code === 'rejected' && row.membership_status === 'rejected') {
    return { ok: true, membershipStatus: 'rejected' }
  }
  if (row.result_code === 'approved' || row.result_code === 'rejected') {
    throw new Error('decideMembership: success result omitted matching status')
  }
  return {
    ok: false,
    error: row.result_code,
    membershipStatus: row.membership_status,
  }
}

export function createMembershipDecisionRepository(
  client: SupabaseClient<Database>,
): MembershipDecisionRepository {
  return {
    async decide(input) {
      const { data, error } = await client
        .schema('api')
        .rpc('decide_membership_with_reason', {
          p_membership_id: input.membershipId,
          p_decision: input.decision,
          p_reason_code: input.decision === 'reject' ? input.reasonCode : undefined,
          p_private_note:
            input.decision === 'reject' ? (input.privateNote ?? undefined) : undefined,
        })
        .single()
      if (error) throw new Error(`decideMembership: ${error.message}`)
      return parseMembershipDecisionRow(data)
    },
  }
}

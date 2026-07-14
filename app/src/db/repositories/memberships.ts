import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/db/database.types'
import type { MembershipDecisionRepository, MembershipDecisionResult } from '@/lib/admin/contracts'

const decisionRowSchema = z.object({
  result_code: z.enum([
    'approved',
    'rejected',
    'invalid_decision',
    'not_found',
    'not_authorized',
    'not_pending',
  ]),
  membership_status: z.string().nullable(),
})

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
    async decide(membershipId, decision) {
      const { data, error } = await client
        .schema('api')
        .rpc('decide_membership', {
          p_membership_id: membershipId,
          p_decision: decision,
        })
        .single()
      if (error) throw new Error(`decideMembership: ${error.message}`)
      return parseMembershipDecisionRow(data)
    },
  }
}

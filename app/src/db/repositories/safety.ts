import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/db/database.types'
import type {
  BlockMemberResult,
  ReportMessageResult,
  SafetyRepository,
} from '@/lib/safety/contracts'

const blockRowSchema = z
  .object({ result_code: z.enum(['blocked', 'unchanged', 'not_available']) })
  .strict()

function transportError(operation: string, error: { code?: string } | null): never {
  const code = error?.code ? ` (${error.code})` : ''
  throw new Error(`Safety ${operation} transport failed${code}`)
}

export function parseBlockMemberRow(row: unknown): BlockMemberResult {
  return { status: blockRowSchema.parse(row).result_code }
}

export function createSafetyRepository(memberClient: SupabaseClient<Database>): SafetyRepository {
  return {
    async reportMessage(input): Promise<ReportMessageResult> {
      const { data, error } = await memberClient.schema('api').rpc('submit_report', {
        p_target_type: 'message',
        p_target_id: String(input.messageId),
        p_reason: input.reason,
        ...(input.note ? { p_note: input.note } : {}),
      })
      if (error?.code === '42501') return { status: 'not_available' }
      if (error) transportError('reportMessage', error)
      return { status: 'submitted', reportId: z.uuid().parse(data) }
    },

    async reportProfile(input) {
      const { data, error } = await memberClient.schema('api').rpc('submit_report', {
        p_target_type: 'profile',
        p_target_id: input.userId,
        p_reason: input.reason,
        ...(input.note ? { p_note: input.note } : {}),
      })
      if (error?.code === '42501') return { status: 'not_available' }
      if (error) transportError('reportProfile', error)
      return { status: 'submitted', reportId: z.uuid().parse(data) }
    },

    async blockMember(userId) {
      const { data, error } = await memberClient
        .schema('api')
        .rpc('block_member', { p_blocked_user_id: userId })
        .single()
      if (error) transportError('blockMember', error)
      return parseBlockMemberRow(data)
    },
  }
}

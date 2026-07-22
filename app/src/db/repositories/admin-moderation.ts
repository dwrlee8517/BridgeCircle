import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/db/database.types'
import type {
  AdminModerationRepository,
  AdminReportDecisionResult,
  AdminReportListResult,
} from '@/lib/admin/contracts'

const latestActionSchema = z
  .object({
    type: z.string().min(1),
    note: z.string().nullable(),
    createdAt: z.iso.datetime({ offset: true }),
  })
  .strict()

const adminReportSchema = z
  .object({
    id: z.guid(),
    status: z.enum(['open', 'reviewing', 'actioned', 'dismissed']),
    reason: z.enum(['harassment', 'spam', 'inappropriate', 'impersonation', 'other']),
    note: z.string().nullable(),
    targetType: z.enum(['ask', 'offer', 'message', 'profile']),
    targetId: z.string().min(1).max(200),
    reporterName: z.string().nullable(),
    reportedName: z.string().nullable(),
    evidence: z.record(z.string(), z.unknown()),
    assignedToUserId: z.guid().nullable(),
    resolvedAt: z.iso.datetime({ offset: true }).nullable(),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
    latestAction: latestActionSchema.nullable(),
  })
  .strict()

const adminReportListSchema = z.discriminatedUnion('resultCode', [
  z
    .object({
      resultCode: z.literal('ok'),
      items: z.array(adminReportSchema),
    })
    .strict(),
  z.object({ resultCode: z.enum(['invalid_input', 'not_available']) }).strict(),
])

const adminReportDecisionSchema = z.enum([
  'reviewing',
  'dismissed',
  'actioned',
  'stale',
  'invalid_input',
  'not_available',
])

type RpcError = { message: string }
type RpcResult = { data: unknown; error: RpcError | null }
type AdminModerationRpc = {
  rpc(
    name: 'list_admin_reports' | 'decide_admin_report',
    args: Record<string, unknown>,
  ): PromiseLike<RpcResult>
}

export function parseAdminReportList(value: unknown): AdminReportListResult {
  const parsed = adminReportListSchema.parse(value)
  if (parsed.resultCode !== 'ok') return { ok: false, error: parsed.resultCode }
  return { ok: true, items: parsed.items }
}

export function parseAdminReportDecision(value: unknown): AdminReportDecisionResult {
  const parsed = adminReportDecisionSchema.parse(value)
  if (parsed === 'reviewing' || parsed === 'dismissed' || parsed === 'actioned') {
    return { ok: true, status: parsed }
  }
  return { ok: false, error: parsed }
}

export function createAdminModerationRepository(
  client: SupabaseClient<Database>,
): AdminModerationRepository {
  const rpc = client.schema('api') as unknown as AdminModerationRpc

  return {
    async list(input) {
      const { data, error } = await rpc.rpc('list_admin_reports', {
        p_membership_id: input.membershipId,
        p_status: input.status ?? null,
        p_limit: input.limit ?? 100,
      })
      if (error) throw new Error(`listAdminReports: ${error.message}`)
      return parseAdminReportList(data)
    },

    async decide(input) {
      const { data, error } = await rpc.rpc('decide_admin_report', {
        p_membership_id: input.membershipId,
        p_report_id: input.reportId,
        p_decision: input.decision,
        p_note: input.note ?? null,
      })
      if (error) throw new Error(`decideAdminReport: ${error.message}`)
      return parseAdminReportDecision(data)
    },
  }
}

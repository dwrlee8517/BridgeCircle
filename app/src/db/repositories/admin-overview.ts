import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/db/database.types'
import type { AdminOverviewRepository, AdminOverviewResult } from '@/lib/admin/contracts'

const signalSchema = z.object({ count: z.number().int(), oldestAt: z.string().nullable() }).strict()

const overviewSchema = z
  .object({
    attention: z
      .object({
        approvals: signalSchema,
        reports: signalSchema,
        staleInvites: signalSchema,
        quietAsks: signalSchema,
        quietNewMembers: z.object({ count: z.number().int() }).strict(),
      })
      .strict(),
    pulse: z
      .object({
        activeMembers: z.number().int(),
        openToHelp: z.number().int(),
        asksLast30: z.number().int(),
        heardBackLast30: z.number().int(),
        newMembersLast30: z.number().int(),
        nextEvent: z
          .object({
            id: z.uuid(),
            title: z.string(),
            startsAt: z.string(),
            goingCount: z.number().int(),
          })
          .strict()
          .nullable(),
      })
      .strict(),
  })
  .strict()

const resultSchema = z.discriminatedUnion('resultCode', [
  overviewSchema.extend({ resultCode: z.literal('ok') }).strict(),
  z.object({ resultCode: z.literal('not_available') }),
])

export function parseAdminOverview(value: unknown): AdminOverviewResult {
  const parsed = resultSchema.parse(value)
  if (parsed.resultCode === 'ok') {
    const { resultCode: _, ...overview } = parsed
    return { ok: true, overview }
  }
  return { ok: false, error: parsed.resultCode }
}

export function createAdminOverviewRepository(
  client: SupabaseClient<Database>,
): AdminOverviewRepository {
  return {
    async get(input) {
      const { data, error } = await client
        .schema('api')
        .rpc('admin_overview', { p_membership_id: input.membershipId })
      if (error) throw new Error(`adminOverview: ${error.message}`)
      return parseAdminOverview(data)
    },
  }
}

import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database, Json } from '@/db/database.types'
import type { ImportCurrentProfile } from '@/lib/onboarding/import-current-profile'
import {
  type ImportApplyPayload,
  type ImportProposal,
  importProposalSchema,
  importProposalSourceSchema,
} from '@/lib/onboarding/import-proposal'
import type { ExtractedProfile } from '@/lib/resume/schemas'

const beginRowSchema = z.object({
  result_code: z.enum([
    'started',
    'existing',
    'in_progress',
    'idempotency_conflict',
    'invalid_input',
    'not_available',
  ]),
  request_id: z.string().nullable(),
  proposal_id: z.string().nullable(),
})

const finishRowSchema = z.object({
  result_code: z.enum(['ready', 'existing', 'not_owned', 'not_processing', 'invalid_input']),
  proposal_id: z.string().nullable(),
})

const importRowSchema = z.object({
  result_code: z.enum(['ok', 'empty', 'not_available']),
  proposal_id: z.string().nullable(),
  source: z.string().nullable(),
  status: z.string().nullable(),
  current_snapshot: z.unknown().nullable(),
  proposed_snapshot: z.unknown().nullable(),
  source_metadata: z.unknown().nullable(),
  expires_at: z.string().nullable(),
  created_at: z.string().nullable(),
})

export type ImportAttempt = {
  provider: 'linkdapi' | 'brightdata' | 'pdl'
  purpose: 'onboarding_import' | 'fallback_verification'
  status: 'succeeded' | 'no_match' | 'failed'
  costUnits: number
  fingerprint: string | null
  error: string | null
}

export function createProfileImportRepository(client: SupabaseClient<Database>) {
  return {
    async begin(args: {
      membershipId: string
      clientRequestId: string
      source: 'linkedin' | 'resume'
      sourceKey: string
    }) {
      const { data, error } = await client
        .schema('api')
        .rpc('begin_profile_import', {
          p_membership_id: args.membershipId,
          p_client_request_id: args.clientRequestId,
          p_source: args.source,
          p_source_key: args.sourceKey,
        })
        .single()
      if (error) throw new Error(`beginProfileImport: ${error.message}`)
      return beginRowSchema.parse(data)
    },

    async finish(args: {
      requestId: string
      current: ImportCurrentProfile
      proposed: ExtractedProfile
      source: 'linkdapi' | 'brightdata' | 'pdl' | 'resume'
      sourceMetadata: Record<string, Json | undefined>
      attempts: ImportAttempt[]
      confidence: number
    }) {
      const { data, error } = await client
        .schema('api')
        .rpc('finish_profile_import', {
          p_request_id: args.requestId,
          p_current_snapshot: toJson(args.current),
          p_proposed_snapshot: toJson(args.proposed),
          p_source: args.source,
          p_source_metadata: args.sourceMetadata,
          p_attempts: toJson(args.attempts),
          p_confidence: args.confidence,
        })
        .single()
      if (error) throw new Error(`finishProfileImport: ${error.message}`)
      return finishRowSchema.parse(data)
    },

    async fail(requestId: string, errorCode: string, attempts: ImportAttempt[]) {
      const { data, error } = await client.schema('api').rpc('fail_profile_import', {
        p_request_id: requestId,
        p_error_code: errorCode,
        p_attempts: toJson(attempts),
      })
      if (error) throw new Error(`failProfileImport: ${error.message}`)
      return z.enum(['failed', 'not_owned', 'invalid_input']).parse(data)
    },

    async get(membershipId: string, proposalId?: string): Promise<ImportProposal | null> {
      const { data, error } = await client
        .schema('api')
        .rpc('get_my_profile_import', {
          p_membership_id: membershipId,
          ...(proposalId ? { p_proposal_id: proposalId } : {}),
        })
        .single()
      if (error) throw new Error(`getMyProfileImport: ${error.message}`)
      const row = importRowSchema.parse(data)
      if (row.result_code !== 'ok') return null
      if (
        !row.proposal_id ||
        !row.source ||
        !row.status ||
        !row.current_snapshot ||
        !row.proposed_snapshot ||
        !row.source_metadata ||
        !row.expires_at ||
        !row.created_at
      ) {
        throw new Error('getMyProfileImport: complete proposal was not returned')
      }
      return importProposalSchema.parse({
        id: row.proposal_id,
        source: importProposalSourceSchema.parse(row.source),
        status: row.status,
        current: row.current_snapshot,
        proposed: row.proposed_snapshot,
        sourceMetadata: row.source_metadata,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
      })
    },

    async apply(
      membershipId: string,
      proposalId: string,
      payload: ImportApplyPayload,
      edited: boolean,
    ) {
      const { data, error } = await client.schema('api').rpc('apply_profile_import', {
        p_membership_id: membershipId,
        p_proposal_id: proposalId,
        p_payload: toJson(payload),
        p_edited: edited,
      })
      if (error) throw new Error(`applyProfileImport: ${error.message}`)
      return z
        .enum([
          'applied',
          'not_owned',
          'already_reviewed',
          'expired',
          'invalid_input',
          'invalid_profile',
        ])
        .parse(data)
    },

    async decline(membershipId: string, proposalId: string) {
      const { data, error } = await client.schema('api').rpc('decline_profile_import', {
        p_membership_id: membershipId,
        p_proposal_id: proposalId,
      })
      if (error) throw new Error(`declineProfileImport: ${error.message}`)
      return z.enum(['declined', 'not_available', 'already_reviewed', 'not_owned']).parse(data)
    },
  }
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value))
}

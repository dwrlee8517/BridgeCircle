import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database, Json } from '@/db/database.types'
import type { ExistingHelpProfileChunk, HelpProfileFact } from '@/lib/help/profile-index'
import { EMAIL_NOTIFICATION_TYPES } from '@/lib/notifications/types'
import { parseHelpCandidateRow } from './help'

const matchingContextSchema = z
  .object({
    ask_id: z.guid(),
    asker_membership_id: z.guid(),
    question: z.string().min(1).max(2_000),
  })
  .strict()

const factSchema = z
  .object({
    id: z.string().min(1).max(100),
    sourceSection: z.enum([
      'directory',
      'career_history',
      'education_history',
      'bio',
      'skills',
      'helper_topics',
    ]),
    visibility: z.enum(['organization', 'connections']),
    content: z.string().min(1).max(20_000),
  })
  .strict()

const existingChunkSchema = z
  .object({ id: z.guid(), fingerprint: z.string().regex(/^[0-9a-f]{64}$/) })
  .strict()

const profileSourceSchema = z
  .object({
    organization_id: z.guid(),
    user_id: z.guid(),
    membership_id: z.guid(),
    facts: z.array(factSchema).max(6),
    existing_chunks: z.array(existingChunkSchema).max(20),
  })
  .strict()

const emailContextSchema = z
  .object({
    job_id: z.number().int().positive(),
    notification_type: z.enum(EMAIL_NOTIFICATION_TYPES),
    recipient_user_id: z.guid(),
    recipient_email: z.email(),
    recipient_display_name: z.string().min(1),
    actor_display_name: z.string().nullable(),
    target_type: z.enum(['ask', 'offer', 'conversation', 'event', 'announcement']),
    target_id: z.guid(),
    idempotency_key: z.string().min(1).max(100),
    provider_result_id: z.string().min(1).max(500).nullable(),
  })
  .strict()

export type HelpWorkerMatchingContext = {
  askId: string
  askerMembershipId: string
  question: string
}

export type HelpWorkerProfileSource = {
  organizationId: string
  userId: string
  membershipId: string
  facts: HelpProfileFact[]
  existingChunks: ExistingHelpProfileChunk[]
}

export type HelpWorkerEmailContext = {
  jobId: number
  notificationType: z.infer<typeof emailContextSchema>['notification_type']
  recipientUserId: string
  recipientEmail: string
  recipientDisplayName: string
  actorDisplayName: string | null
  targetType: 'ask' | 'offer' | 'conversation' | 'event' | 'announcement'
  targetId: string
  idempotencyKey: string
  providerResultId: string | null
}

function transportError(operation: string, error: { code?: string } | null): never {
  const code = error?.code ? ` (${error.code})` : ''
  throw new Error(`Help worker ${operation} failed${code}`)
}

export function createHelpWorkerRepository(serviceClient: SupabaseClient<Database>) {
  return {
    async getMatchingContext(
      jobId: number,
      workerId: string,
    ): Promise<HelpWorkerMatchingContext | null> {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('get_ask_matching_context', { p_job_id: jobId, p_worker_id: workerId })
        .maybeSingle()
      if (error) transportError('getMatchingContext', error)
      if (!data) return null
      const parsed = matchingContextSchema.parse(data)
      return {
        askId: parsed.ask_id,
        askerMembershipId: parsed.asker_membership_id,
        question: parsed.question,
      }
    },

    async searchMatchingCandidates(input: {
      jobId: number
      workerId: string
      queryEmbedding: string | null
      limit: number
    }) {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('search_ask_matching_candidates', {
          p_job_id: input.jobId,
          p_worker_id: input.workerId,
          p_limit: input.limit,
          ...(input.queryEmbedding ? { p_query_embedding: input.queryEmbedding } : {}),
        })
      if (error) transportError('searchMatchingCandidates', error)
      return z.array(z.unknown()).parse(data).map(parseHelpCandidateRow)
    },

    async consumeAskMatchingProviderBudget(jobId: number, workerId: string) {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('consume_ask_matching_provider_budget', {
          p_job_id: jobId,
          p_worker_id: workerId,
        })
      if (error) transportError('consumeAskMatchingProviderBudget', error)
      return z.enum(['allowed', 'limited', 'not_available']).parse(data)
    },

    async applyMatches(input: {
      askId: string
      pipelineVersion: string
      modelVersion: string
      matches: Json
    }) {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('apply_ask_matches', {
          p_ask_id: input.askId,
          p_pipeline_version: input.pipelineVersion,
          p_model_version: input.modelVersion,
          p_matches: input.matches,
        })
        .single()
      if (error) transportError('applyMatches', error)
      return z
        .object({
          result_code: z.enum(['applied', 'invalid_input', 'not_available']),
          applied_count: z.number().int().nonnegative(),
        })
        .strict()
        .parse(data)
    },

    async getProfileIndexSource(
      jobId: number,
      workerId: string,
    ): Promise<HelpWorkerProfileSource | null> {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('get_profile_index_source', { p_job_id: jobId, p_worker_id: workerId })
        .maybeSingle()
      if (error) transportError('getProfileIndexSource', error)
      if (!data) return null
      const parsed = profileSourceSchema.parse(data)
      return {
        organizationId: parsed.organization_id,
        userId: parsed.user_id,
        membershipId: parsed.membership_id,
        facts: parsed.facts,
        existingChunks: parsed.existing_chunks,
      }
    },

    async beginProfileIndexAttempt(jobId: number, workerId: string, sourceFingerprint: string) {
      const { data, error } = await serviceClient.schema('api').rpc('begin_profile_index_attempt', {
        p_job_id: jobId,
        p_worker_id: workerId,
        p_source_fingerprint: sourceFingerprint,
      })
      if (error) transportError('beginProfileIndexAttempt', error)
      return z
        .enum([
          'allowed',
          'unchanged',
          'coalesced',
          'busy',
          'limited',
          'invalid_input',
          'not_available',
        ])
        .parse(data)
    },

    async syncProfileIndex(input: {
      jobId: number
      workerId: string
      desiredFingerprints: string[]
      newChunks: Json
    }) {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('sync_profile_index', {
          p_job_id: input.jobId,
          p_worker_id: input.workerId,
          p_desired_fingerprints: input.desiredFingerprints,
          p_new_chunks: input.newChunks,
        })
        .single()
      if (error) transportError('syncProfileIndex', error)
      return z
        .object({
          result_code: z.enum(['synced', 'invalid_input', 'not_available']),
          chunk_count: z.number().int().nonnegative(),
        })
        .strict()
        .parse(data)
    },

    async materializeNotification(jobId: number, workerId: string) {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('materialize_notification_job', { p_job_id: jobId, p_worker_id: workerId })
        .single()
      if (error) transportError('materializeNotification', error)
      return z
        .object({
          result_code: z.enum(['materialized', 'not_available']),
          notification_id: z.number().int().positive().nullable(),
          email_job_id: z.number().int().positive().nullable(),
        })
        .strict()
        .parse(data)
    },

    async getEmailContext(jobId: number, workerId: string): Promise<HelpWorkerEmailContext | null> {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('get_outbox_email_context', { p_job_id: jobId, p_worker_id: workerId })
        .maybeSingle()
      if (error) transportError('getEmailContext', error)
      if (!data) return null
      const parsed = emailContextSchema.parse(data)
      return {
        jobId: parsed.job_id,
        notificationType: parsed.notification_type,
        recipientUserId: parsed.recipient_user_id,
        recipientEmail: parsed.recipient_email,
        recipientDisplayName: parsed.recipient_display_name,
        actorDisplayName: parsed.actor_display_name,
        targetType: parsed.target_type,
        targetId: parsed.target_id,
        idempotencyKey: parsed.idempotency_key,
        providerResultId: parsed.provider_result_id,
      }
    },

    async recordEmailProviderResult(jobId: number, workerId: string, providerResultId: string) {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('record_outbox_provider_result', {
          p_job_id: jobId,
          p_worker_id: workerId,
          p_provider_result_id: providerResultId,
        })
      if (error) transportError('recordEmailProviderResult', error)
      return z
        .enum([
          'recorded',
          'not_found',
          'lock_not_owned',
          'not_available',
          'invalid_input',
          'provider_conflict',
        ])
        .parse(data)
    },

    async runMaintenance(now: string, limit: number) {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('run_help_maintenance', { p_now: now, p_limit: limit })
        .single()
      if (error) transportError('runMaintenance', error)
      return z
        .object({
          reminders_sent: z.number().int().nonnegative(),
          asks_closed: z.number().int().nonnegative(),
          offers_closed: z.number().int().nonnegative(),
          helpers_paused: z.number().int().nonnegative(),
        })
        .strict()
        .parse(data)
    },

    async runSchoolMaintenance(now: string, limit: number) {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('run_school_maintenance', { p_now: now, p_limit: limit })
        .single()
      if (error) transportError('runSchoolMaintenance', error)
      return z
        .object({
          expired_offers: z.number().int().nonnegative(),
          opened_offers: z.number().int().nonnegative(),
        })
        .strict()
        .parse(data)
    },
  }
}

export type HelpWorkerRepository = ReturnType<typeof createHelpWorkerRepository>

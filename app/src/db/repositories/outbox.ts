import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database, Json } from '@/db/database.types'
import {
  type ClaimedOutboxJob,
  HELP_WORKER_JOB_TYPES,
  type HelpWorkerJobType,
} from '@/lib/outbox/contracts'

const outboxJobSchema = z.object({
  id: z.coerce.number().int().positive(),
  job_type: z.enum(HELP_WORKER_JOB_TYPES),
  payload: z.custom<Json>(),
  attempts: z.number().int().positive(),
  max_attempts: z.number().int().positive(),
  available_at: z.string(),
  locked_at: z.string(),
  locked_by: z.string(),
})

export type OutboxJob = ClaimedOutboxJob

export function parseOutboxJob(value: unknown): OutboxJob {
  const row = outboxJobSchema.parse(value)
  return {
    id: row.id,
    jobType: row.job_type,
    payload: row.payload satisfies Json,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    availableAt: row.available_at,
    lockedAt: row.locked_at,
    lockedBy: row.locked_by,
  }
}

export function createOutboxRepository(serviceClient: SupabaseClient<Database>) {
  return {
    async claim(
      workerId: string,
      allowedTypes: readonly HelpWorkerJobType[] = HELP_WORKER_JOB_TYPES,
      limit = 25,
    ) {
      const { data, error } = await serviceClient.schema('api').rpc('claim_outbox_jobs', {
        p_worker_id: workerId,
        p_limit: limit,
        p_allowed_types: Array.from(allowedTypes),
      })
      if (error) throw new Error(`claimOutboxJobs failed (${error.code})`)
      return (data ?? []).map(parseOutboxJob)
    },
    async complete(jobId: number, workerId: string) {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('complete_outbox_job', { p_job_id: jobId, p_worker_id: workerId })
      if (error) throw new Error(`completeOutboxJob failed (${error.code})`)
      const result = z.enum(['completed', 'already_completed']).parse(data)
      if (result !== 'completed' && result !== 'already_completed') throw new Error('unreachable')
    },
    async retry(jobId: number, workerId: string, errorMessage: string, availableAt: string) {
      const { data, error } = await serviceClient.schema('api').rpc('retry_outbox_job', {
        p_job_id: jobId,
        p_worker_id: workerId,
        p_error: errorMessage,
        p_available_at: availableAt,
      })
      if (error) throw new Error(`retryOutboxJob failed (${error.code})`)
      z.literal('pending').parse(data)
    },
    async fail(jobId: number, workerId: string, errorMessage: string) {
      const { data, error } = await serviceClient.schema('api').rpc('fail_outbox_job', {
        p_job_id: jobId,
        p_worker_id: workerId,
        p_error: errorMessage,
      })
      if (error) throw new Error(`failOutboxJob failed (${error.code})`)
      z.literal('failed').parse(data)
    },
  }
}

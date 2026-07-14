import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database, Json } from '@/db/database.types'

const outboxJobSchema = z.object({
  id: z.coerce.number().int().positive(),
  job_type: z.string(),
  payload: z.custom<Json>(),
  attempts: z.number().int().positive(),
  max_attempts: z.number().int().positive(),
  available_at: z.string(),
  locked_at: z.string(),
  locked_by: z.string(),
})

export type OutboxJob = {
  id: number
  jobType: string
  payload: Json
  attempts: number
  maxAttempts: number
  availableAt: string
  lockedAt: string
  lockedBy: string
}

export function parseOutboxJob(value: unknown): OutboxJob {
  const row = outboxJobSchema.parse(value)
  return {
    id: row.id,
    jobType: row.job_type,
    payload: row.payload,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    availableAt: row.available_at,
    lockedAt: row.locked_at,
    lockedBy: row.locked_by,
  }
}

export function createOutboxRepository(serviceClient: SupabaseClient<Database>) {
  return {
    async claim(workerId: string, limit = 25) {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('claim_outbox_jobs', { p_worker_id: workerId, p_limit: limit })
      if (error) throw new Error(`claimOutboxJobs: ${error.message}`)
      return (data ?? []).map(parseOutboxJob)
    },
    async complete(jobId: number, workerId: string) {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('complete_outbox_job', { p_job_id: jobId, p_worker_id: workerId })
      if (error) throw new Error(`completeOutboxJob: ${error.message}`)
      return z.string().parse(data)
    },
    async retry(jobId: number, workerId: string, errorMessage: string, availableAt: string) {
      const { data, error } = await serviceClient.schema('api').rpc('retry_outbox_job', {
        p_job_id: jobId,
        p_worker_id: workerId,
        p_error: errorMessage,
        p_available_at: availableAt,
      })
      if (error) throw new Error(`retryOutboxJob: ${error.message}`)
      return z.string().parse(data)
    },
    async fail(jobId: number, workerId: string, errorMessage: string) {
      const { data, error } = await serviceClient.schema('api').rpc('fail_outbox_job', {
        p_job_id: jobId,
        p_worker_id: workerId,
        p_error: errorMessage,
      })
      if (error) throw new Error(`failOutboxJob: ${error.message}`)
      return z.string().parse(data)
    },
  }
}

import { randomUUID } from 'node:crypto'
import { createAdminClient } from '@/db/admin'
import { createHelpWorkerRepository } from '@/db/repositories/help-worker'
import { createOutboxRepository } from '@/db/repositories/outbox'
import { createAnthropicHelpProviderFromEnvironment } from '@/integrations/ai/help-anthropic'
import { createVoyageHelpProviderFromEnvironment } from '@/integrations/ai/help-voyage'
import { OutboxJobError } from '@/lib/outbox/contracts'
import type { OutboxWorkerDependencies } from './contracts'
import { resendHelpEmailSender } from './email-sender'
import { createHelpOutboxHandlers } from './handlers'
import { reportHelpWorkerError } from './monitoring'
import { runOutboxBatch, runOutboxLoop } from './runner'

const MAINTENANCE_INTERVAL_MS = 60_000
export type HelpWorkerMode = 'continuous' | 'once' | 'drain'

export async function runHelpWorker(
  signal: AbortSignal,
  mode: HelpWorkerMode = 'continuous',
): Promise<void> {
  const serviceClient = createAdminClient()
  const queue = createOutboxRepository(serviceClient)
  const repository = createHelpWorkerRepository(serviceClient)
  const voyage = createVoyageHelpProviderFromEnvironment()
  const anthropic = createAnthropicHelpProviderFromEnvironment()
  const workerId = `help-${randomUUID()}`
  const sleep = abortableSleep
  const handlers = createHelpOutboxHandlers({
    repository,
    embeddings: voyage,
    reranker: voyage,
    profilePassages: anthropic,
    emailSender: resendHelpEmailSender,
    appBaseUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    profileIndexingEnabled: voyage !== null,
    pipelineVersion: 'help-hybrid-v1',
    modelVersion: voyage ? 'voyage-4+rerank-2.5' : 'deterministic-v1',
  })
  const options = {
    workerId,
    batchSize: boundedInteger(process.env.OUTBOX_BATCH_SIZE, 20, 1, 100),
    maxConcurrentHandlers: boundedInteger(process.env.OUTBOX_CONCURRENCY, 4, 1, 10),
    handlerTimeoutMs: boundedInteger(process.env.OUTBOX_HANDLER_TIMEOUT_MS, 30_000, 1_000, 120_000),
    idleDelayMs: boundedInteger(process.env.OUTBOX_IDLE_DELAY_MS, 1_000, 100, 60_000),
    maxIdleJitterMs: 500,
    maxRetryDelayMs: 15 * 60_000,
  }
  const dependencies: OutboxWorkerDependencies = {
    queue,
    handlers,
    report(error, context) {
      const errorCode = error instanceof OutboxJobError ? error.code : 'worker_failure'
      reportHelpWorkerError(errorCode, context)
      console.error('[help-worker] worker event', {
        errorCode,
        jobId: context.jobId,
        jobType: context.jobType,
      })
    },
    now: () => new Date(),
    random: Math.random,
    sleep,
  }

  if (mode === 'once') {
    reportBatch(await runOutboxBatch(options, dependencies, signal))
    await runMaintenanceOnce(repository)
    return
  }
  if (mode === 'drain') {
    while (!signal.aborted) {
      const result = await runOutboxBatch(options, dependencies, signal)
      reportBatch(result)
      if (result.claimed === 0) break
    }
    await runMaintenanceOnce(repository)
    return
  }

  await Promise.all([
    runOutboxLoop(options, dependencies, signal),
    runMaintenanceLoop(repository, signal, sleep),
  ])
}

async function runMaintenanceLoop(
  repository: ReturnType<typeof createHelpWorkerRepository>,
  signal: AbortSignal,
  sleep: (milliseconds: number, signal: AbortSignal) => Promise<void>,
) {
  while (!signal.aborted) {
    try {
      await runMaintenanceOnce(repository)
    } catch {
      reportHelpWorkerError('maintenance_failed')
      console.error('[help-worker] maintenance failed', { errorCode: 'maintenance_failed' })
    }
    try {
      await sleep(MAINTENANCE_INTERVAL_MS, signal)
    } catch {
      if (!signal.aborted) throw new Error('Help worker maintenance wait failed')
    }
  }
}

async function runMaintenanceOnce(repository: ReturnType<typeof createHelpWorkerRepository>) {
  const result = await repository.runMaintenance(new Date().toISOString(), 100)
  if (Object.values(result).some((count) => count > 0)) {
    console.info('[help-worker] maintenance', result)
  }
}

function reportBatch(result: {
  claimed: number
  completed: number
  retried: number
  failed: number
}) {
  if (result.claimed > 0) console.info('[help-worker] batch', result)
}

function abortableSleep(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error('aborted'))
      return
    }
    const abort = () => {
      clearTimeout(timer)
      reject(new Error('aborted'))
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort)
      resolve()
    }, milliseconds)
    signal.addEventListener('abort', abort, { once: true })
  })
}

function boundedInteger(
  raw: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  const value = Number(raw)
  if (!Number.isInteger(value)) return fallback
  return Math.min(maximum, Math.max(minimum, value))
}

import type { ClaimedOutboxJob } from '@/lib/outbox/contracts'
import { HELP_WORKER_JOB_TYPES, OutboxJobError } from '@/lib/outbox/contracts'
import type { OutboxWorkerDependencies, OutboxWorkerOptions } from './contracts'

export type OutboxBatchResult = {
  claimed: number
  completed: number
  retried: number
  failed: number
}

export async function runOutboxBatch(
  options: OutboxWorkerOptions,
  dependencies: OutboxWorkerDependencies,
  signal: AbortSignal,
): Promise<OutboxBatchResult> {
  if (signal.aborted) return { claimed: 0, completed: 0, retried: 0, failed: 0 }
  const jobs = await dependencies.queue.claim(
    options.workerId,
    HELP_WORKER_JOB_TYPES,
    options.batchSize,
  )
  const result: OutboxBatchResult = {
    claimed: jobs.length,
    completed: 0,
    retried: 0,
    failed: 0,
  }
  const concurrency = Math.max(1, options.maxConcurrentHandlers)
  for (let index = 0; index < jobs.length; index += concurrency) {
    const slice = jobs.slice(index, index + concurrency)
    const outcomes = await Promise.all(
      slice.map((job) => processJob(job, options, dependencies, signal)),
    )
    for (const outcome of outcomes) result[outcome] += 1
  }
  return result
}

export async function runOutboxLoop(
  options: OutboxWorkerOptions,
  dependencies: OutboxWorkerDependencies,
  signal: AbortSignal,
): Promise<void> {
  while (!signal.aborted) {
    let result: OutboxBatchResult
    try {
      result = await runOutboxBatch(options, dependencies, signal)
    } catch {
      await safelyReportLoopFailure(dependencies)
      if (signal.aborted) break
      await waitForNextCycle(options, dependencies, signal)
      continue
    }
    if (signal.aborted) break
    if (result.claimed === 0) {
      await waitForNextCycle(options, dependencies, signal)
    }
  }
}

async function waitForNextCycle(
  options: OutboxWorkerOptions,
  dependencies: OutboxWorkerDependencies,
  signal: AbortSignal,
) {
  const delay = options.idleDelayMs + dependencies.random() * options.maxIdleJitterMs
  try {
    await dependencies.sleep(delay, signal)
  } catch {
    if (!signal.aborted) throw new OutboxJobError('idle_wait_failed', false)
  }
}

async function processJob(
  job: ClaimedOutboxJob,
  options: OutboxWorkerOptions,
  dependencies: OutboxWorkerDependencies,
  workerSignal: AbortSignal,
): Promise<'completed' | 'retried' | 'failed'> {
  const controller = new AbortController()
  const abort = () => controller.abort(workerSignal.reason)
  workerSignal.addEventListener('abort', abort, { once: true })
  if (workerSignal.aborted) controller.abort(workerSignal.reason)
  let timer: ReturnType<typeof setTimeout> | null = null
  try {
    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => {
        controller.abort('handler_timeout')
        reject(new OutboxJobError('handler_timeout', false))
      }, options.handlerTimeoutMs)
    })
    await Promise.race([dependencies.handlers[job.jobType](job, controller.signal), timeout])
    await dependencies.queue.complete(job.id, options.workerId)
    return 'completed'
  } catch (error) {
    const jobError =
      error instanceof OutboxJobError ? error : new OutboxJobError('handler_failed', false)
    const terminal = jobError.terminal || job.attempts >= job.maxAttempts
    if (terminal) {
      await dependencies.queue.fail(job.id, options.workerId, jobError.code)
      await safelyReport(dependencies, job, jobError)
      return 'failed'
    }
    const availableAt = retryAt(job.attempts, options, dependencies)
    await dependencies.queue.retry(job.id, options.workerId, jobError.code, availableAt)
    return 'retried'
  } finally {
    if (timer) clearTimeout(timer)
    workerSignal.removeEventListener('abort', abort)
  }
}

function retryAt(
  attempts: number,
  options: OutboxWorkerOptions,
  dependencies: OutboxWorkerDependencies,
): string {
  const exponential = Math.min(options.maxRetryDelayMs, 60_000 * 2 ** Math.max(0, attempts - 1))
  const jitter = Math.floor(dependencies.random() * Math.min(30_000, exponential * 0.2))
  return new Date(dependencies.now().getTime() + exponential + jitter).toISOString()
}

async function safelyReport(
  dependencies: OutboxWorkerDependencies,
  job: ClaimedOutboxJob,
  error: Error,
) {
  try {
    await dependencies.report(error, { jobId: job.id, jobType: job.jobType })
  } catch {
    // Reporting cannot block terminal queue state or later jobs.
  }
}

async function safelyReportLoopFailure(dependencies: OutboxWorkerDependencies) {
  try {
    await dependencies.report(new OutboxJobError('queue_cycle_failed', false), {})
  } catch {
    // Reporting cannot turn a recoverable queue outage into a worker crash.
  }
}

import { describe, expect, it, vi } from 'vitest'
import type { ClaimedOutboxJob } from '@/lib/outbox/contracts'
import {
  type OutboxHandler,
  type OutboxHandlerRegistry,
  OutboxJobError,
} from '@/lib/outbox/contracts'
import type { OutboxWorkerDependencies, OutboxWorkerOptions } from './contracts'
import { runOutboxBatch, runOutboxLoop } from './runner'

const options: OutboxWorkerOptions = {
  workerId: 'worker-1',
  batchSize: 10,
  maxConcurrentHandlers: 2,
  handlerTimeoutMs: 1_000,
  idleDelayMs: 500,
  maxIdleJitterMs: 100,
  maxRetryDelayMs: 15 * 60_000,
}

function job(overrides: Partial<ClaimedOutboxJob> = {}): ClaimedOutboxJob {
  return {
    id: 1,
    jobType: 'create_notification',
    payload: {},
    attempts: 1,
    maxAttempts: 5,
    availableAt: '2026-07-15T01:00:00.000Z',
    lockedAt: '2026-07-15T01:00:00.000Z',
    lockedBy: 'worker-1',
    ...overrides,
  }
}

function fixture(
  jobs: ClaimedOutboxJob[],
  handler: OutboxHandler = vi.fn(async () => ({ outcome: 'completed' as const })),
) {
  const handlers: OutboxHandlerRegistry = {
    create_notification: handler,
    send_email: handler,
    run_ask_matching: handler,
    index_profile: handler,
  }
  const dependencies: OutboxWorkerDependencies = {
    queue: {
      claim: vi.fn(async () => jobs),
      complete: vi.fn(async () => undefined),
      retry: vi.fn(async () => undefined),
      fail: vi.fn(async () => undefined),
    },
    handlers,
    report: vi.fn(),
    now: () => new Date('2026-07-15T01:00:00.000Z'),
    random: () => 0,
    sleep: vi.fn(async () => undefined),
  }
  return dependencies
}

describe('outbox runner', () => {
  it('claims only the fixed registry and completes successful jobs', async () => {
    const dependencies = fixture([job()])
    await expect(
      runOutboxBatch(options, dependencies, new AbortController().signal),
    ).resolves.toEqual({ claimed: 1, completed: 1, retried: 0, failed: 0 })
    expect(dependencies.queue.claim).toHaveBeenCalledWith(
      'worker-1',
      ['create_notification', 'send_email', 'run_ask_matching', 'index_profile'],
      10,
    )
    expect(dependencies.queue.complete).toHaveBeenCalledWith(1, 'worker-1')
  })

  it('retries sanitized transient failures with bounded exponential backoff', async () => {
    const dependencies = fixture(
      [job({ attempts: 2 })],
      vi.fn(async () => {
        throw new Error('private payload must not escape')
      }),
    )
    await runOutboxBatch(options, dependencies, new AbortController().signal)
    expect(dependencies.queue.retry).toHaveBeenCalledWith(
      1,
      'worker-1',
      'handler_failed',
      '2026-07-15T01:02:00.000Z',
    )
  })

  it('fails terminal jobs, reports identifiers only, and continues later jobs', async () => {
    const handler = vi.fn(async (claimed: ClaimedOutboxJob) => {
      if (claimed.id === 1) throw new OutboxJobError('invalid_payload', true)
      return { outcome: 'completed' as const }
    })
    const dependencies = fixture([job(), job({ id: 2, jobType: 'send_email' })], handler)
    await expect(
      runOutboxBatch(options, dependencies, new AbortController().signal),
    ).resolves.toEqual({ claimed: 2, completed: 1, retried: 0, failed: 1 })
    expect(dependencies.queue.fail).toHaveBeenCalledWith(1, 'worker-1', 'invalid_payload')
    expect(dependencies.report).toHaveBeenCalledWith(expect.any(Error), {
      jobId: 1,
      jobType: 'create_notification',
    })
    expect(dependencies.queue.complete).toHaveBeenCalledWith(2, 'worker-1')
  })

  it('idles without a hot loop and exits when the drain signal aborts', async () => {
    const controller = new AbortController()
    const dependencies = fixture([])
    dependencies.sleep = vi.fn(async (_milliseconds, signal) => {
      controller.abort()
      if (signal.aborted) throw new Error('aborted')
    })
    await runOutboxLoop(options, dependencies, controller.signal)
    expect(dependencies.sleep).toHaveBeenCalledWith(500, controller.signal)
    expect(dependencies.queue.claim).toHaveBeenCalledOnce()
  })

  it('backs off and reports a sanitized code when a queue cycle fails', async () => {
    const controller = new AbortController()
    const dependencies = fixture([])
    dependencies.queue.claim = vi.fn(async () => {
      throw new Error('database details must not escape')
    })
    dependencies.sleep = vi.fn(async () => {
      controller.abort()
      throw new Error('aborted')
    })

    await expect(runOutboxLoop(options, dependencies, controller.signal)).resolves.toBeUndefined()
    expect(dependencies.report).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Outbox job failed: queue_cycle_failed' }),
      {},
    )
    expect(dependencies.sleep).toHaveBeenCalledWith(500, controller.signal)
  })
})

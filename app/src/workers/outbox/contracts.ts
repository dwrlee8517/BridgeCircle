import type {
  ClaimedOutboxJob,
  HelpWorkerJobType,
  OutboxHandlerRegistry,
} from '@/lib/outbox/contracts'

export type OutboxQueue = {
  claim(
    workerId: string,
    allowedTypes: readonly HelpWorkerJobType[],
    limit: number,
  ): Promise<ClaimedOutboxJob[]>
  complete(jobId: number, workerId: string): Promise<void>
  retry(jobId: number, workerId: string, errorCode: string, availableAt: string): Promise<void>
  fail(jobId: number, workerId: string, errorCode: string): Promise<void>
}

export type OutboxWorkerDependencies = {
  queue: OutboxQueue
  handlers: OutboxHandlerRegistry
  report(
    error: Error,
    context: { jobId?: number; jobType?: HelpWorkerJobType },
  ): void | Promise<void>
  now(): Date
  random(): number
  sleep(milliseconds: number, signal: AbortSignal): Promise<void>
}

export type OutboxWorkerOptions = {
  workerId: string
  batchSize: number
  maxConcurrentHandlers: number
  handlerTimeoutMs: number
  idleDelayMs: number
  maxIdleJitterMs: number
  maxRetryDelayMs: number
}

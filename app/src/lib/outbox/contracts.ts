export const HELP_WORKER_JOB_TYPES = [
  'create_notification',
  'send_email',
  'run_ask_matching',
  'index_profile',
  'send_invite_email',
  'generate_account_export',
  'process_account_deletion',
  'delete_storage_objects',
] as const

export type HelpWorkerJobType = (typeof HELP_WORKER_JOB_TYPES)[number]

export type ClaimedOutboxJob = {
  id: number
  jobType: HelpWorkerJobType
  payload: unknown
  attempts: number
  maxAttempts: number
  availableAt: string
  lockedAt: string
  lockedBy: string
}

export type OutboxHandlerResult = {
  outcome: 'completed' | 'already_applied' | 'skipped'
}

export type OutboxHandler = (
  job: ClaimedOutboxJob,
  signal: AbortSignal,
) => Promise<OutboxHandlerResult>

export type OutboxHandlerRegistry = Readonly<Record<HelpWorkerJobType, OutboxHandler>>

export class OutboxJobError extends Error {
  constructor(
    readonly code: string,
    readonly terminal: boolean,
  ) {
    super(`Outbox job failed: ${code}`)
    this.name = 'OutboxJobError'
  }
}

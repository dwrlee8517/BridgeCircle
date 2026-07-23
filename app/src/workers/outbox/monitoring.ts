import * as Sentry from '@sentry/nextjs'
import type { HelpWorkerJobType } from '@/lib/outbox/contracts'

const SENTRY_DSN =
  'https://5ba4657888cd18f9461740621b9bab4d@o4511277419134976.ingest.us.sentry.io/4511277428572160'

export function initializeHelpWorkerMonitoring() {
  const appEnvironment = process.env.APP_ENV ?? 'local'
  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: appEnvironment === 'dev' || appEnvironment === 'prod',
    environment: appEnvironment,
    sendDefaultPii: false,
    tracesSampleRate: 0,
  })
}

export function reportHelpWorkerError(
  errorCode: string,
  context: { jobId?: number; jobType?: HelpWorkerJobType } = {},
) {
  Sentry.withScope((scope) => {
    scope.setTag('worker', 'help-outbox')
    scope.setTag('error_code', errorCode)
    if (context.jobType) scope.setTag('job_type', context.jobType)
    if (context.jobId) scope.setExtra('job_id', context.jobId)
    Sentry.captureException(new Error(`Help worker failed: ${errorCode}`))
  })
}

export async function flushHelpWorkerMonitoring() {
  await Sentry.flush(2_000)
}

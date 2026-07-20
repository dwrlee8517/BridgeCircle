import { type HelpWorkerMode, runHelpWorker } from '../src/workers/outbox/main'
import {
  flushHelpWorkerMonitoring,
  initializeHelpWorkerMonitoring,
  reportHelpWorkerError,
} from '../src/workers/outbox/monitoring'

const controller = new AbortController()
let stopping = false

function stop() {
  if (stopping) return
  stopping = true
  controller.abort()
}

process.once('SIGTERM', stop)
process.once('SIGINT', stop)

const mode: HelpWorkerMode = process.argv.includes('--once')
  ? 'once'
  : process.argv.includes('--drain')
    ? 'drain'
    : 'continuous'

async function main() {
  initializeHelpWorkerMonitoring()
  try {
    await runHelpWorker(controller.signal, mode)
  } catch (error) {
    const errorCode = error instanceof Error ? error.name : 'unknown_error'
    reportHelpWorkerError('worker_fatal')
    console.error('[help-worker] fatal', { errorCode })
    process.exitCode = 1
  } finally {
    await flushHelpWorkerMonitoring()
  }
}

void main()

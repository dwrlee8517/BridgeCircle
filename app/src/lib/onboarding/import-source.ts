import { createHash } from 'node:crypto'

/** A stable, non-secret key lets identical resume retries share one proposal. */
export function resumeImportSourceKey(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

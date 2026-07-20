import 'server-only'
import type { AdminInviteRepository } from '@/db/repositories/invites'
import type { CsvRow } from './parseCsv'

export type BatchInviteOutcome = {
  email: string
  status: 'sent' | 'duplicate' | 'failed'
  detail?: string
}

export type BatchInviteResult = {
  sent: number
  duplicate: number
  failed: number
  outcomes: BatchInviteOutcome[]
}

export type IssueBatchInput = {
  organizationId: string
  rows: CsvRow[]
}

export async function issueInviteBatch(
  repository: AdminInviteRepository,
  input: IssueBatchInput,
): Promise<BatchInviteResult> {
  const outcomes: BatchInviteOutcome[] = []
  let sent = 0
  let duplicate = 0
  let failed = 0

  for (let i = 0; i < input.rows.length; i++) {
    const row = input.rows[i]
    const result = await repository.issue({
      organizationId: input.organizationId,
      email: row.email,
      fullName: row.fullName,
      graduationYear: row.graduationYear,
      requestId: crypto.randomUUID(),
    })

    if (result.ok) {
      if (result.result === 'already_pending') {
        duplicate++
        outcomes.push({ email: row.email, status: 'duplicate' })
      } else {
        sent++
        outcomes.push({ email: row.email, status: 'sent' })
      }
    } else {
      failed++
      outcomes.push({ email: row.email, status: 'failed', detail: result.error })
    }
  }

  return { sent, duplicate, failed, outcomes }
}

import 'server-only'
import type { CsvRow } from './parseCsv'
import { sendInvite } from './send'

export type BatchInviteOutcome = {
  email: string
  status: 'sent' | 'duplicate' | 'send_failed' | 'db_error' | 'org_not_found'
  detail?: string
}

export type BatchInviteResult = {
  sent: number
  duplicate: number
  failed: number
  outcomes: BatchInviteOutcome[]
}

// Resend's free tier is 2 req/sec. We send sequentially with a small spacer
// rather than parallel: simpler to reason about, easy to add a delay, and
// invite batches are O(class size) not O(thousands).
const SEND_SPACING_MS = 600

export type SendBatchInput = {
  organizationId: string
  sentBy: string
  rows: CsvRow[]
}

export async function sendInviteBatch(input: SendBatchInput): Promise<BatchInviteResult> {
  const outcomes: BatchInviteOutcome[] = []
  let sent = 0
  let duplicate = 0
  let failed = 0

  for (let i = 0; i < input.rows.length; i++) {
    const row = input.rows[i]
    const result = await sendInvite({
      organizationId: input.organizationId,
      email: row.email,
      fullName: row.fullName,
      graduationYear: row.graduationYear,
      sentBy: input.sentBy,
    })

    if (result.ok) {
      sent++
      outcomes.push({ email: row.email, status: 'sent' })
    } else if (result.error === 'duplicate') {
      duplicate++
      outcomes.push({ email: row.email, status: 'duplicate' })
    } else {
      failed++
      outcomes.push({ email: row.email, status: result.error, detail: result.detail })
    }

    if (i < input.rows.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, SEND_SPACING_MS))
    }
  }

  return { sent, duplicate, failed, outcomes }
}

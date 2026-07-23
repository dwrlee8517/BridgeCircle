'use server'

import { revalidatePath } from 'next/cache'
import { loadSchoolAdminContext } from '@/app/(admin)/admin/_lib/school-admin'
import { createAdminInviteRepository } from '@/db/repositories/invites'
import type { CsvRow } from '@/lib/invite/parseCsv'
import { type BatchInviteResult, issueInviteBatch } from '@/lib/invite/sendBatch'

export type CsvSubmitState = {
  result?: BatchInviteResult
  error?: string
}

const MAX_BATCH = 200

export async function submitCsvInvites(
  _prev: CsvSubmitState,
  formData: FormData,
): Promise<CsvSubmitState> {
  const { client, membership } = await loadSchoolAdminContext()

  const raw = formData.get('rows')
  if (typeof raw !== 'string' || raw.length === 0) {
    return { error: 'No rows to send. Upload a CSV first.' }
  }

  let rows: CsvRow[]
  try {
    rows = JSON.parse(raw) as CsvRow[]
  } catch {
    return { error: 'Could not read the row data. Re-upload the CSV.' }
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return { error: 'No rows to send.' }
  }
  if (rows.length > MAX_BATCH) {
    return { error: `Batches are capped at ${MAX_BATCH} rows. Split the file.` }
  }

  const result = await issueInviteBatch(createAdminInviteRepository(client), {
    organizationId: membership.organization.id,
    rows,
  })

  revalidatePath('/admin/invite')
  return { result }
}

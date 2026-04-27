'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/db/server'
import { requireAdmin } from '@/lib/auth/session'
import type { CsvRow } from '@/lib/invite/parseCsv'
import { type BatchInviteResult, sendInviteBatch } from '@/lib/invite/sendBatch'

export type CsvSubmitState = {
  result?: BatchInviteResult
  error?: string
}

const MAX_BATCH = 200

export async function submitCsvInvites(
  _prev: CsvSubmitState,
  formData: FormData,
): Promise<CsvSubmitState> {
  const session = await requireAdmin()

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

  const supabase = await createClient()
  const { data: roles } = await supabase
    .from('admin_role_assignments')
    .select('organization_id')
    .eq('user_id', session.userId)
    .in('role', ['super_admin', 'admin'])
    .limit(1)
  const orgId = roles?.[0]?.organization_id
  if (!orgId) return { error: 'No admin role found.' }

  const result = await sendInviteBatch({
    organizationId: orgId,
    sentBy: session.userId,
    rows,
  })

  revalidatePath('/admin/invite')
  revalidatePath('/admin/members')
  return { result }
}

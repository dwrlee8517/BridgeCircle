'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { loadSchoolAdminContext } from '@/app/(admin)/admin/_lib/school-admin'
import { createAdminModerationRepository } from '@/db/repositories/admin-moderation'
import { decideAdminReport } from '@/lib/admin/moderation'

const reportDecisionSchema = z.object({
  reportId: z.uuid(),
  decision: z.enum(['start_review', 'dismiss', 'mark_actioned']),
  note: z.string().nullable(),
})

export type ReportDecisionFormState = {
  ok?: boolean
  error?: string
  reportId?: string
  status?: 'reviewing' | 'dismissed' | 'actioned'
}

export async function decideReportAction(
  _previous: ReportDecisionFormState,
  formData: FormData,
): Promise<ReportDecisionFormState> {
  const parsed = reportDecisionSchema.safeParse({
    reportId: formData.get('reportId'),
    decision: formData.get('decision'),
    note: formData.get('note') || null,
  })
  if (!parsed.success) {
    return { error: 'Invalid request.' }
  }

  const { client, membership } = await loadSchoolAdminContext()

  try {
    const result = await decideAdminReport(createAdminModerationRepository(client), {
      membershipId: membership.membershipId,
      reportId: parsed.data.reportId,
      decision: parsed.data.decision,
      note: parsed.data.note,
    })

    if (!result.ok) {
      if (result.error === 'stale') {
        return { error: 'This report changed while you were reviewing it. Refresh and try again.' }
      }
      if (result.error === 'not_available') {
        return { error: 'This report is no longer available to you.' }
      }
      return {
        error: 'Add a private note between 1 and 10,000 characters before saving this decision.',
      }
    }

    revalidatePath('/admin/reports')
    return { ok: true, reportId: parsed.data.reportId, status: result.status }
  } catch {
    return { error: 'We couldn’t reach the server. Check your connection and try again.' }
  }
}

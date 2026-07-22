import type {
  AdminModerationRepository,
  AdminReport,
  AdminReportDecisionResult,
  AdminReportQueueFilter,
} from './contracts'

const MAX_EVIDENCE_CHARACTERS = 12_000

export function reportsForQueue(
  reports: readonly AdminReport[],
  filter: AdminReportQueueFilter,
): AdminReport[] {
  return reports.filter((report) =>
    filter === 'closed'
      ? report.status === 'actioned' || report.status === 'dismissed'
      : report.status === filter,
  )
}

export function formatReportEvidence(evidence: Record<string, unknown>): string {
  const serialized = JSON.stringify(evidence, null, 2)
  if (!serialized) return '{}'
  if (serialized.length <= MAX_EVIDENCE_CHARACTERS) return serialized
  return `${serialized.slice(0, MAX_EVIDENCE_CHARACTERS)}\n… Evidence shortened for display.`
}

export function decideAdminReport(
  repository: AdminModerationRepository,
  input: Parameters<AdminModerationRepository['decide']>[0],
): Promise<AdminReportDecisionResult> {
  const note = input.note?.trim() || null
  if ((input.decision !== 'start_review' && !note) || (note?.length ?? 0) > 10_000) {
    return Promise.resolve({ ok: false, error: 'invalid_input' })
  }

  return repository.decide({
    ...input,
    note: input.decision === 'start_review' ? null : note,
  })
}

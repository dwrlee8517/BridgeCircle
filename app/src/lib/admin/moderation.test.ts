import { describe, expect, it, vi } from 'vitest'
import type { AdminModerationRepository, AdminReport } from './contracts'
import { decideAdminReport, formatReportEvidence, reportsForQueue } from './moderation'

const REPORT: AdminReport = {
  id: '10000000-0000-4000-8000-000000000001',
  status: 'open',
  reason: 'harassment',
  note: 'Repeated unwanted messages',
  targetType: 'message',
  targetId: '42',
  reporterName: 'Jordan Lee',
  reportedName: 'Sam Park',
  evidence: { body: '<script>alert("no")</script>', messageId: 42 },
  assignedToUserId: null,
  resolvedAt: null,
  createdAt: '2026-07-21T18:00:00Z',
  updatedAt: '2026-07-21T18:00:00Z',
  latestAction: null,
}

describe('admin moderation operations', () => {
  it('groups terminal report statuses under the closed queue', () => {
    const reports = [
      REPORT,
      { ...REPORT, id: '10000000-0000-4000-8000-000000000002', status: 'reviewing' as const },
      { ...REPORT, id: '10000000-0000-4000-8000-000000000003', status: 'dismissed' as const },
      { ...REPORT, id: '10000000-0000-4000-8000-000000000004', status: 'actioned' as const },
    ]

    expect(reportsForQueue(reports, 'open').map((report) => report.id)).toEqual([REPORT.id])
    expect(reportsForQueue(reports, 'reviewing').map((report) => report.status)).toEqual([
      'reviewing',
    ])
    expect(reportsForQueue(reports, 'closed').map((report) => report.status)).toEqual([
      'dismissed',
      'actioned',
    ])
  })

  it('serializes untrusted evidence as inert display text and bounds its size', () => {
    expect(formatReportEvidence(REPORT.evidence)).toContain('<script>alert')
    expect(formatReportEvidence({ body: 'x'.repeat(13_000) })).toMatch(
      /Evidence shortened for display\.$/,
    )
  })

  it('trims private notes before crossing the repository boundary', async () => {
    const decide = vi.fn().mockResolvedValue({ ok: true, status: 'dismissed' })
    const repository = { decide } as unknown as AdminModerationRepository

    await decideAdminReport(repository, {
      membershipId: '10000000-0000-4000-8000-000000000010',
      reportId: REPORT.id,
      decision: 'dismiss',
      note: '  duplicate report  ',
    })

    expect(decide).toHaveBeenCalledWith(
      expect.objectContaining({ note: 'duplicate report', decision: 'dismiss' }),
    )
  })

  it('requires bounded notes for terminal decisions inside the domain operation', async () => {
    const decide = vi.fn()
    const repository = { decide } as unknown as AdminModerationRepository

    await expect(
      decideAdminReport(repository, {
        membershipId: '10000000-0000-4000-8000-000000000010',
        reportId: REPORT.id,
        decision: 'mark_actioned',
        note: '   ',
      }),
    ).resolves.toEqual({ ok: false, error: 'invalid_input' })
    expect(decide).not.toHaveBeenCalled()
  })
})

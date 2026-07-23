import { describe, expect, it } from 'vitest'
import { parseAdminReportDecision, parseAdminReportList } from './admin-moderation'

const ROW = {
  id: '10000000-0000-4000-8000-000000000001',
  status: 'open',
  reason: 'harassment',
  note: 'Repeated unwanted messages',
  targetType: 'message',
  targetId: '42',
  reporterName: 'Jordan Lee',
  reportedName: 'Sam Park',
  evidence: { body: 'Saved message' },
  assignedToUserId: null,
  resolvedAt: null,
  createdAt: '2026-07-21T18:00:00Z',
  updatedAt: '2026-07-21T18:00:00Z',
  latestAction: null,
}

describe('admin moderation repository parsing', () => {
  it('maps the exact report list contract', () => {
    expect(parseAdminReportList({ resultCode: 'ok', items: [ROW] })).toEqual({
      ok: true,
      items: [ROW],
    })
    expect(parseAdminReportList({ resultCode: 'not_available' })).toEqual({
      ok: false,
      error: 'not_available',
    })
  })

  it('rejects widened or malformed report rows', () => {
    expect(() =>
      parseAdminReportList({ resultCode: 'ok', items: [{ ...ROW, privateSecret: true }] }),
    ).toThrow()
    expect(() =>
      parseAdminReportList({ resultCode: 'ok', items: [{ ...ROW, status: 'suspended' }] }),
    ).toThrow()
  })

  it('keeps stale decisions distinct from successful terminal states', () => {
    expect(parseAdminReportDecision('actioned')).toEqual({ ok: true, status: 'actioned' })
    expect(parseAdminReportDecision('stale')).toEqual({ ok: false, error: 'stale' })
    expect(() => parseAdminReportDecision('suspended')).toThrow()
  })
})

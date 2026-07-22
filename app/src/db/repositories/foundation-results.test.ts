import { describe, expect, it } from 'vitest'
import { parseMembershipDecisionRow } from './memberships'
import { parseOutboxJob } from './outbox'

describe('Foundation command repository mapping', () => {
  it('maps durable membership decisions', () => {
    expect(
      parseMembershipDecisionRow({ result_code: 'approved', membership_status: 'active' }),
    ).toEqual({ ok: true, membershipStatus: 'active' })
    expect(
      parseMembershipDecisionRow({ result_code: 'not_authorized', membership_status: 'pending' }),
    ).toEqual({ ok: false, error: 'not_authorized', membershipStatus: 'pending' })
    expect(
      parseMembershipDecisionRow({ result_code: 'invalid_reason', membership_status: null }),
    ).toEqual({ ok: false, error: 'invalid_reason', membershipStatus: null })
    expect(() =>
      parseMembershipDecisionRow({
        result_code: 'rejected',
        membership_status: 'rejected',
        private_note: 'must not cross the boundary',
      }),
    ).toThrow()
  })

  it('maps claimed outbox jobs without widening payloads', () => {
    expect(
      parseOutboxJob({
        id: 1,
        job_type: 'send_email',
        payload: { template: 'membership_approved' },
        attempts: 1,
        max_attempts: 5,
        available_at: '2026-07-14T00:00:00Z',
        locked_at: '2026-07-14T00:00:00Z',
        locked_by: 'worker-1',
      }),
    ).toMatchObject({ id: 1, jobType: 'send_email', lockedBy: 'worker-1' })
  })
})

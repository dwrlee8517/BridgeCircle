import { describe, expect, it, vi } from 'vitest'
import type { MembershipDecisionRepository } from './contracts'
import { decideMembership } from './decideMembership'

describe('decideMembership', () => {
  it('keeps rejection reasons and private notes inside the admin repository command', async () => {
    const decide = vi.fn().mockResolvedValue({ ok: true, membershipStatus: 'rejected' })
    const repository = { decide } as MembershipDecisionRepository

    const result = await decideMembership(repository, {
      membershipId: '10000000-0000-4000-8000-000000000001',
      decision: 'reject',
      reasonCode: 'could_not_verify',
      privateNote: 'School record did not match.',
    })

    expect(result).toEqual({ ok: true, membershipStatus: 'rejected' })
    expect(decide).toHaveBeenCalledWith({
      membershipId: '10000000-0000-4000-8000-000000000001',
      decision: 'reject',
      reasonCode: 'could_not_verify',
      privateNote: 'School record did not match.',
    })
  })

  it('enforces rejection details before calling the repository', async () => {
    const decide = vi.fn()
    const repository = { decide } as MembershipDecisionRepository

    await expect(
      decideMembership(repository, {
        membershipId: '10000000-0000-4000-8000-000000000001',
        decision: 'reject',
        reasonCode: null,
      }),
    ).resolves.toEqual({ ok: false, error: 'invalid_reason', membershipStatus: null })
    await expect(
      decideMembership(repository, {
        membershipId: '10000000-0000-4000-8000-000000000001',
        decision: 'approve',
        reasonCode: 'other',
      }),
    ).resolves.toEqual({ ok: false, error: 'invalid_reason', membershipStatus: null })
    expect(decide).not.toHaveBeenCalled()
  })
})

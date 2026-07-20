import { describe, expect, it } from 'vitest'
import type { MemberContext } from '@/db/repositories/member-context'
import { memberDestination, selectedMembership } from './selection'

function context(overrides: Partial<MemberContext> = {}): MemberContext {
  return {
    accountState: 'active',
    onboardingCompletedAt: '2026-07-14T00:00:00Z',
    deleteScheduledFor: null,
    deleteInitiatedByAdmin: false,
    deletedAt: null,
    selectedMembershipId: '61000000-0000-4000-8000-000000000001',
    requiresCircleChoice: false,
    unreadNotificationCount: 0,
    messagesAttentionCount: 0,
    memberships: [
      {
        membershipId: '61000000-0000-4000-8000-000000000001',
        status: 'active',
        joinedAt: null,
        organization: {
          id: '60000000-0000-4000-8000-000000000001',
          slug: 'chadwick',
          name: 'Chadwick School',
          requiresAdminApproval: false,
        },
        profile: {
          displayName: 'Maren Lee',
          preferredName: null,
          avatarPath: null,
          graduationYear: 2022,
          bio: null,
        },
        roles: [],
      },
    ],
    ...overrides,
  }
}

describe('member context selection', () => {
  it('uses only the database-validated selected membership', () => {
    expect(selectedMembership(context())?.organization.slug).toBe('chadwick')
    expect(selectedMembership(context({ selectedMembershipId: null }))).toBeNull()
  })

  it('routes multiple circles to the chooser', () => {
    expect(
      memberDestination(context({ selectedMembershipId: null, requiresCircleChoice: true })),
    ).toBe('select-circle')
  })

  it('allows pending members to finish setup before the approval wait state', () => {
    const pending = context({
      onboardingCompletedAt: null,
      memberships: [{ ...context().memberships[0], status: 'pending' }],
    })
    expect(memberDestination(pending)).toBe('onboarding')
    expect(memberDestination({ ...pending, onboardingCompletedAt: '2026-07-14T00:00:00Z' })).toBe(
      'pending-approval',
    )
  })
})

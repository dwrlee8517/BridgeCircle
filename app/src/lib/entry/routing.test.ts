import { describe, expect, it } from 'vitest'
import type { MemberContext } from '@/db/repositories/member-context'
import { memberEntryPath, safeNextPath } from './routing'

function context(overrides: Partial<MemberContext> = {}): MemberContext {
  return {
    accountState: 'active',
    onboardingCompletedAt: '2026-07-15T00:00:00Z',
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

describe('safeNextPath', () => {
  it('keeps same-origin application paths', () => {
    expect(safeNextPath('/messages?thread=1#latest')).toBe('/messages?thread=1#latest')
  })

  it.each([
    'https://evil.test',
    '//evil.test',
    '/\\evil.test',
    '/\nadmin',
    'javascript:x',
  ])('rejects an unsafe redirect: %s', (value) => expect(safeNextPath(value)).toBe('/'))
})

describe('memberEntryPath', () => {
  it('sends completed pending members to the canonical wait screen', () => {
    expect(
      memberEntryPath(
        context({ memberships: [{ ...context().memberships[0], status: 'pending' }] }),
      ),
    ).toBe('/pending')
  })

  it('does not honor next until onboarding is complete', () => {
    expect(memberEntryPath(context({ onboardingCompletedAt: null }), '/messages')).toBe(
      '/onboarding',
    )
  })
})

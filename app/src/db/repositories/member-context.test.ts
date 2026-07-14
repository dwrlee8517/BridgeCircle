import { describe, expect, it } from 'vitest'
import { parseMemberContextRow } from './member-context'

describe('parseMemberContextRow', () => {
  it('maps the fixed database projection into the app contract', () => {
    expect(
      parseMemberContextRow({
        account_state: 'active',
        onboarding_completed_at: '2026-07-14T00:00:00Z',
        delete_scheduled_for: null,
        delete_initiated_by_admin: false,
        deleted_at: null,
        selected_membership_id: '61000000-0000-4000-8000-000000000001',
        requires_circle_choice: false,
        unread_notification_count: 3,
        memberships: [
          {
            membershipId: '61000000-0000-4000-8000-000000000001',
            status: 'active',
            joinedAt: '2026-07-14T00:00:00Z',
            organization: {
              id: '60000000-0000-4000-8000-000000000001',
              slug: 'chadwick',
              name: 'Chadwick School',
              requiresAdminApproval: false,
            },
            profile: {
              displayName: 'Maren Lee',
              preferredName: 'Maren',
              avatarPath: null,
              graduationYear: 2022,
              bio: null,
            },
            roles: ['admin'],
          },
        ],
      }),
    ).toMatchObject({
      accountState: 'active',
      selectedMembershipId: '61000000-0000-4000-8000-000000000001',
      unreadNotificationCount: 3,
      memberships: [{ roles: ['admin'] }],
    })
  })

  it('rejects a malformed nested membership instead of widening the type', () => {
    expect(() =>
      parseMemberContextRow({
        account_state: 'active',
        onboarding_completed_at: null,
        delete_scheduled_for: null,
        delete_initiated_by_admin: false,
        deleted_at: null,
        selected_membership_id: null,
        requires_circle_choice: false,
        unread_notification_count: 0,
        memberships: [{ membershipId: 'not-a-uuid' }],
      }),
    ).toThrow()
  })
})

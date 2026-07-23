import { describe, expect, it } from 'vitest'
import { type NotificationRow, notificationTargetUrl } from './types'

function row(overrides: Partial<NotificationRow>): NotificationRow {
  return {
    id: 1,
    type: 'ask_received',
    targetType: null,
    targetId: null,
    organizationId: null,
    actorUserId: null,
    readAt: null,
    createdAt: '2026-07-15T00:00:00.000Z',
    payload: {},
    ...overrides,
  }
}

describe('notificationTargetUrl', () => {
  it('routes Ask notifications to the v2 Help detail', () => {
    expect(
      notificationTargetUrl(
        row({ targetType: 'ask', targetId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }),
      ),
    ).toBe('/help/asks/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
  })

  it('prefers an accepted conversation over its Ask target', () => {
    expect(
      notificationTargetUrl(
        row({
          type: 'ask_accepted',
          targetType: 'conversation',
          targetId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        }),
      ),
    ).toBe('/messages/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')
  })

  it('routes a connection request to the actor profile without an Inbox dependency', () => {
    expect(
      notificationTargetUrl(
        row({
          type: 'connection_requested',
          targetType: 'connection_request',
          targetId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          actorUserId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        }),
      ),
    ).toBe('/profile/dddddddd-dddd-4ddd-8ddd-dddddddddddd')
  })
})

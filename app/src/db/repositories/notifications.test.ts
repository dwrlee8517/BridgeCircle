import { describe, expect, it } from 'vitest'
import { parseNotificationRow } from './notifications'

describe('notification repository mapping', () => {
  it('maps v2 bigint ids and recipient-safe fields', () => {
    expect(
      parseNotificationRow({
        id: 42,
        type: 'message_received',
        target_type: 'conversation',
        target_id: '70000000-0000-4000-8000-000000000001',
        organization_id: null,
        actor_user_id: null,
        read_at: null,
        created_at: '2026-07-14T00:00:00Z',
        payload: {},
      }),
    ).toMatchObject({ id: 42, type: 'message_received' })
  })

  it('quietly omits a future type until its renderer ships', () => {
    expect(
      parseNotificationRow({
        id: 43,
        type: 'future_type',
        target_type: null,
        target_id: null,
        organization_id: null,
        actor_user_id: null,
        read_at: null,
        created_at: '2026-07-14T00:00:00Z',
        payload: {},
      }),
    ).toBeNull()
  })
})

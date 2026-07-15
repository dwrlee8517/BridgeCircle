import { describe, expect, it } from 'vitest'
import {
  INITIAL_MEMBER_CONTROL_STATE,
  reconnectDelayMs,
  reduceMemberControl,
} from './member-control'

const conversationId = '50000000-0000-4000-8000-000000000001'

describe('member control state', () => {
  it('invalidates all authoritative domains after every subscription', () => {
    expect(reduceMemberControl(INITIAL_MEMBER_CONTROL_STATE, { type: 'subscribed' })).toMatchObject(
      {
        revision: 1,
        helpRevision: 1,
        messagesRevision: 1,
        connectionsRevision: 1,
      },
    )
  })

  it('routes owner events only to their dependent domains', () => {
    const help = reduceMemberControl(INITIAL_MEMBER_CONTROL_STATE, {
      type: 'event',
      event: {
        type: 'help.changed',
        id: '91000000-0000-4000-8000-000000000001',
        askId: '30000000-0000-4000-8000-000000000001',
      },
    })
    expect(help).toMatchObject({ helpRevision: 1, messagesRevision: 1, connectionsRevision: 0 })
    const connections = reduceMemberControl(help, {
      type: 'event',
      event: {
        type: 'connections.changed',
        id: '91000000-0000-4000-8000-000000000002',
        requestId: '30000000-0000-4000-8000-000000000002',
      },
    })
    expect(connections).toMatchObject({
      helpRevision: 1,
      messagesRevision: 2,
      connectionsRevision: 1,
    })
  })

  it('publishes only the latest monotonic conversation control callback', () => {
    const changed = reduceMemberControl(INITIAL_MEMBER_CONTROL_STATE, {
      type: 'event',
      event: {
        type: 'conversation.permissions_changed',
        id: '91000000-0000-4000-8000-000000000003',
        conversationId,
      },
    })
    const revoked = reduceMemberControl(changed, {
      type: 'event',
      event: {
        type: 'conversation.revoked',
        id: '91000000-0000-4000-8000-000000000004',
        conversationId,
      },
    })
    expect(revoked.conversationControl).toEqual({
      sequence: 2,
      type: 'conversation.revoked',
      conversationId,
    })
  })

  it('caps reconnect backoff without accepting negative attempts', () => {
    expect([-1, 0, 1, 2, 3, 4, 99].map(reconnectDelayMs)).toEqual([
      1_000, 1_000, 2_000, 5_000, 10_000, 30_000, 30_000,
    ])
  })
})

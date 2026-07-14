import type { SupabaseClient } from '@supabase/supabase-js'
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import type { Database } from '@/db/database.types'
import {
  type ConversationRealtimeCallbacks,
  type ConversationRealtimeChannel,
  type ConversationRealtimeClient,
  openConversationRealtime,
} from './conversation-channel'

const conversationId = '50000000-0000-4000-8000-000000000001'
const otherConversationId = '50000000-0000-4000-8000-000000000002'
const userId = '10000000-0000-4000-8000-000000000002'
const otherUserId = '10000000-0000-4000-8000-000000000004'

class MockChannel implements ConversationRealtimeChannel {
  private broadcastCallback: ((message: unknown) => void) | null = null
  private statusCallback:
    | ((status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR', error?: Error) => void)
    | null = null

  constructor(private readonly initialStatus: 'SUBSCRIBED' | 'CHANNEL_ERROR' = 'SUBSCRIBED') {}

  on(
    type: 'broadcast',
    filter: { event: string },
    callback: (message: unknown) => void,
  ): ConversationRealtimeChannel {
    expect(type).toBe('broadcast')
    expect(filter).toEqual({ event: '*' })
    this.broadcastCallback = callback
    return this
  }

  subscribe(
    callback: (
      status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR',
      error?: Error,
    ) => void,
  ): ConversationRealtimeChannel {
    this.statusCallback = callback
    callback(
      this.initialStatus,
      this.initialStatus === 'CHANNEL_ERROR' ? new Error('denied') : undefined,
    )
    return this
  }

  emitBroadcast(message: unknown) {
    this.broadcastCallback?.(message)
  }

  emitStatus(status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') {
    this.statusCallback?.(status)
  }
}

function callbacks(): ConversationRealtimeCallbacks {
  return {
    onRefetchAfterCursor: vi.fn(),
    onMessageCreated: vi.fn(),
    onReadAdvanced: vi.fn(),
    onPermissionsChanged: vi.fn(),
    onRevoked: vi.fn(),
    onTypingChanged: vi.fn(),
    onMalformedEvent: vi.fn(),
    onChannelError: vi.fn(),
  }
}

function setup(
  initialStatuses: Array<'SUBSCRIBED' | 'CHANNEL_ERROR'> = ['SUBSCRIBED', 'SUBSCRIBED'],
) {
  const channels = initialStatuses.map((status) => new MockChannel(status))
  const topics: Array<{ topic: string; options: { config: { private: true } } }> = []
  const callOrder: string[] = []
  const removeChannel = vi.fn(async () => 'ok')
  const client: ConversationRealtimeClient = {
    realtime: {
      setAuth: vi.fn(async () => {
        callOrder.push('setAuth')
      }),
    },
    channel(topic, options) {
      callOrder.push(`channel:${topic}`)
      topics.push({ topic, options })
      const channel = channels[topics.length - 1]
      if (!channel) throw new Error('unexpected channel')
      return channel
    },
    removeChannel,
  }
  return { client, channels, topics, callOrder, removeChannel }
}

function message(event: string, payload: Record<string, unknown>) {
  return { type: 'broadcast', event, payload }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('conversation Realtime adapter', () => {
  it('accepts the application Supabase client without a transport cast', () => {
    expectTypeOf<SupabaseClient<Database>>().toExtend<ConversationRealtimeClient>()
  })

  it('authenticates before opening the two private topics and refetches on reconnect', async () => {
    const fixture = setup()
    const handlers = callbacks()
    const handle = await openConversationRealtime({
      client: fixture.client,
      accessToken: 'member-token',
      conversationId,
      userId,
      callbacks: handlers,
    })

    expect(fixture.callOrder).toEqual([
      'setAuth',
      `channel:conversation:${conversationId}`,
      `channel:user:${userId}`,
    ])
    expect(fixture.topics).toEqual([
      { topic: `conversation:${conversationId}`, options: { config: { private: true } } },
      { topic: `user:${userId}`, options: { config: { private: true } } },
    ])
    expect(handlers.onRefetchAfterCursor).toHaveBeenCalledTimes(1)

    fixture.channels[0]?.emitStatus('SUBSCRIBED')
    expect(handlers.onRefetchAfterCursor).toHaveBeenCalledTimes(2)

    await handle.close()
    await handle.close()
    expect(fixture.removeChannel).toHaveBeenCalledTimes(2)
    expect(fixture.removeChannel).toHaveBeenNthCalledWith(1, fixture.channels[0])
    expect(fixture.removeChannel).toHaveBeenNthCalledWith(2, fixture.channels[1])
  })

  it('parses minimal events, deduplicates IDs, and rejects malformed or spoofed payloads', async () => {
    const fixture = setup()
    const handlers = callbacks()
    const handle = await openConversationRealtime({
      client: fixture.client,
      accessToken: 'member-token',
      conversationId,
      userId,
      callbacks: handlers,
    })
    const conversation = fixture.channels[0]
    const control = fixture.channels[1]

    conversation?.emitBroadcast(
      message('message.created', {
        id: '91000000-0000-4000-8000-000000000001',
        conversationId,
        messageId: '41',
      }),
    )
    conversation?.emitBroadcast(
      message('message.created', {
        id: '91000000-0000-4000-8000-000000000002',
        conversationId,
        messageId: '41',
      }),
    )
    expect(handlers.onMessageCreated).toHaveBeenCalledOnce()
    expect(handlers.onMessageCreated).toHaveBeenCalledWith({ conversationId, messageId: 41 })

    conversation?.emitBroadcast(
      message('read.advanced', {
        id: '91000000-0000-4000-8000-000000000003',
        conversationId,
        readerUserId: otherUserId,
        messageId: '41',
      }),
    )
    expect(handlers.onReadAdvanced).toHaveBeenCalledWith({
      conversationId,
      readerUserId: otherUserId,
      messageId: 41,
    })

    control?.emitBroadcast(
      message('conversation.permissions_changed', {
        id: '91000000-0000-4000-8000-000000000004',
        conversationId,
      }),
    )
    control?.emitBroadcast(
      message('conversation.revoked', {
        id: '91000000-0000-4000-8000-000000000005',
        conversationId,
      }),
    )
    expect(handlers.onPermissionsChanged).toHaveBeenCalledWith({ conversationId })
    expect(handlers.onRevoked).toHaveBeenCalledWith({ conversationId })

    conversation?.emitBroadcast(
      message('message.created', {
        id: '91000000-0000-4000-8000-000000000006',
        conversationId,
        messageId: '42',
        body: 'must be rejected',
      }),
    )
    control?.emitBroadcast(
      message('conversation.revoked', {
        id: '91000000-0000-4000-8000-000000000007',
        conversationId: otherConversationId,
      }),
    )
    conversation?.emitBroadcast(message('conversation.revoked', {}))
    conversation?.emitBroadcast({ malformed: true })

    expect(handlers.onMalformedEvent).toHaveBeenCalledWith({
      source: 'conversation',
      eventName: 'message.created',
      reason: 'malformed_payload',
    })
    expect(handlers.onMalformedEvent).toHaveBeenCalledWith({
      source: 'control',
      eventName: 'conversation.revoked',
      reason: 'conversation_mismatch',
    })
    expect(handlers.onMalformedEvent).toHaveBeenCalledWith({
      source: 'conversation',
      eventName: 'conversation.revoked',
      reason: 'unexpected_event',
    })
    expect(handlers.onMalformedEvent).toHaveBeenCalledWith({
      source: 'conversation',
      eventName: null,
      reason: 'malformed_envelope',
    })

    await handle.close()
  })

  it('expires typing locally and clears pending expiry on teardown', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-14T23:00:00.000Z'))
    const fixture = setup()
    const handlers = callbacks()
    const handle = await openConversationRealtime({
      client: fixture.client,
      accessToken: 'member-token',
      conversationId,
      userId,
      callbacks: handlers,
    })

    fixture.channels[0]?.emitBroadcast(
      message('typing.changed', {
        id: '91000000-0000-4000-8000-000000000008',
        conversationId,
        actorUserId: otherUserId,
        isTyping: true,
        expiresAt: '2026-07-14T23:00:03.000Z',
      }),
    )
    expect(handlers.onTypingChanged).toHaveBeenLastCalledWith({
      conversationId,
      actorUserId: otherUserId,
      isTyping: true,
      expiresAt: '2026-07-14T23:00:03.000Z',
    })

    await vi.advanceTimersByTimeAsync(3_000)
    expect(handlers.onTypingChanged).toHaveBeenLastCalledWith({
      conversationId,
      actorUserId: otherUserId,
      isTyping: false,
      expiresAt: '2026-07-14T23:00:03.000Z',
    })

    fixture.channels[0]?.emitBroadcast(
      message('typing.changed', {
        id: '91000000-0000-4000-8000-000000000009',
        conversationId,
        actorUserId: otherUserId,
        isTyping: true,
        expiresAt: '2026-07-14T23:00:06.000Z',
      }),
    )
    await handle.close()
    await vi.advanceTimersByTimeAsync(3_000)
    expect(handlers.onTypingChanged).toHaveBeenCalledTimes(3)
  })

  it('removes both channels when either initial subscription is denied', async () => {
    const fixture = setup(['SUBSCRIBED', 'CHANNEL_ERROR'])
    await expect(
      openConversationRealtime({
        client: fixture.client,
        accessToken: 'member-token',
        conversationId,
        userId,
        callbacks: callbacks(),
      }),
    ).rejects.toThrow('denied')
    expect(fixture.removeChannel).toHaveBeenCalledTimes(2)
  })
})

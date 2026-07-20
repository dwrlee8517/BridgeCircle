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

  emitBroadcast(event: string, payload: Record<string, unknown>) {
    this.broadcastCallback?.({ type: 'broadcast', event, payload })
  }

  emitMalformed(message: unknown) {
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
    onTypingChanged: vi.fn(),
    onMalformedEvent: vi.fn(),
    onChannelError: vi.fn(),
  }
}

function setup(initialStatus: 'SUBSCRIBED' | 'CHANNEL_ERROR' = 'SUBSCRIBED') {
  const channel = new MockChannel(initialStatus)
  const removeChannel = vi.fn(async () => 'ok')
  const client: ConversationRealtimeClient = {
    realtime: { setAuth: vi.fn(async () => undefined) },
    channel: vi.fn(() => channel),
    removeChannel,
  }
  return { channel, client, removeChannel }
}

afterEach(() => vi.useRealTimers())

describe('conversation Realtime adapter', () => {
  it('accepts the app client and owns only one private content topic', async () => {
    expectTypeOf<SupabaseClient<Database>>().toExtend<ConversationRealtimeClient>()
    const fixture = setup()
    const handlers = callbacks()
    const handle = await openConversationRealtime({
      client: fixture.client,
      accessToken: 'member-token',
      conversationId,
      callbacks: handlers,
    })
    expect(fixture.client.channel).toHaveBeenCalledOnce()
    expect(fixture.client.channel).toHaveBeenCalledWith(`conversation:${conversationId}`, {
      config: { private: true },
    })
    expect(handlers.onRefetchAfterCursor).toHaveBeenCalledOnce()
    fixture.channel.emitStatus('SUBSCRIBED')
    expect(handlers.onRefetchAfterCursor).toHaveBeenCalledTimes(2)
    await handle.close()
    await handle.close()
    expect(fixture.removeChannel).toHaveBeenCalledOnce()
  })

  it('does not declare the content channel ready before gap recovery completes', async () => {
    const fixture = setup()
    const recovery: { finish: () => void } = { finish() {} }
    const handlers = callbacks()
    handlers.onRefetchAfterCursor = vi.fn(
      () => new Promise<void>((resolve) => (recovery.finish = resolve)),
    )
    let opened = false
    const opening = openConversationRealtime({
      client: fixture.client,
      accessToken: 'member-token',
      conversationId,
      callbacks: handlers,
    }).then((handle) => {
      opened = true
      return handle
    })
    await Promise.resolve()
    expect(opened).toBe(false)
    recovery.finish()
    const handle = await opening
    expect(opened).toBe(true)
    await handle.close()
  })

  it('closes the content channel when initial gap recovery fails', async () => {
    const fixture = setup()
    const handlers = callbacks()
    handlers.onRefetchAfterCursor = vi.fn(async () => {
      throw new Error('gap failed')
    })
    await expect(
      openConversationRealtime({
        client: fixture.client,
        accessToken: 'member-token',
        conversationId,
        callbacks: handlers,
      }),
    ).rejects.toThrow('gap failed')
    expect(fixture.removeChannel).toHaveBeenCalledOnce()
  })

  it('parses minimal content events and rejects owner-control or mismatched payloads', async () => {
    const fixture = setup()
    const handlers = callbacks()
    const handle = await openConversationRealtime({
      client: fixture.client,
      accessToken: 'member-token',
      conversationId,
      callbacks: handlers,
    })
    fixture.channel.emitBroadcast('message.created', {
      id: '91000000-0000-4000-8000-000000000001',
      conversationId,
      messageId: '41',
    })
    fixture.channel.emitBroadcast('message.created', {
      id: '91000000-0000-4000-8000-000000000002',
      conversationId,
      messageId: '41',
    })
    expect(handlers.onMessageCreated).toHaveBeenCalledOnce()
    fixture.channel.emitBroadcast('read.advanced', {
      id: '91000000-0000-4000-8000-000000000003',
      conversationId,
      readerUserId: otherUserId,
      messageId: '41',
    })
    expect(handlers.onReadAdvanced).toHaveBeenCalledWith({
      conversationId,
      readerUserId: otherUserId,
      messageId: 41,
    })
    fixture.channel.emitBroadcast('conversation.revoked', {
      id: '91000000-0000-4000-8000-000000000004',
      conversationId,
    })
    fixture.channel.emitBroadcast('message.created', {
      id: '91000000-0000-4000-8000-000000000005',
      conversationId: otherConversationId,
      messageId: '42',
    })
    fixture.channel.emitMalformed({ malformed: true })
    expect(handlers.onMalformedEvent).toHaveBeenCalledWith({
      eventName: 'conversation.revoked',
      reason: 'unexpected_event',
    })
    expect(handlers.onMalformedEvent).toHaveBeenCalledWith({
      eventName: 'message.created',
      reason: 'conversation_mismatch',
    })
    expect(handlers.onMalformedEvent).toHaveBeenCalledWith({
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
      callbacks: handlers,
    })
    fixture.channel.emitBroadcast('typing.changed', {
      id: '91000000-0000-4000-8000-000000000006',
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
    fixture.channel.emitBroadcast('typing.changed', {
      id: '91000000-0000-4000-8000-000000000007',
      conversationId,
      actorUserId: otherUserId,
      isTyping: true,
      expiresAt: '2026-07-14T23:00:06.000Z',
    })
    await handle.close()
    await vi.advanceTimersByTimeAsync(3_000)
    expect(handlers.onTypingChanged).toHaveBeenCalledTimes(3)
  })

  it('removes the content channel when initial subscription is denied', async () => {
    const fixture = setup('CHANNEL_ERROR')
    await expect(
      openConversationRealtime({
        client: fixture.client,
        accessToken: 'member-token',
        conversationId,
        callbacks: callbacks(),
      }),
    ).rejects.toThrow('denied')
    expect(fixture.removeChannel).toHaveBeenCalledOnce()
  })
})

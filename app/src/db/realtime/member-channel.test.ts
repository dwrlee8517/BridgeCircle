import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import type { Database } from '@/db/database.types'
import {
  type MemberRealtimeCallbacks,
  type MemberRealtimeChannel,
  type MemberRealtimeClient,
  openMemberRealtime,
} from './member-channel'

const userId = '10000000-0000-4000-8000-000000000002'
const conversationId = '50000000-0000-4000-8000-000000000001'
const requestId = '30000000-0000-4000-8000-000000000001'
const askId = '30000000-0000-4000-8000-000000000002'

class MockChannel implements MemberRealtimeChannel {
  private broadcast: ((message: unknown) => void) | null = null
  private status:
    | ((status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => void)
    | null = null

  on(
    type: 'broadcast',
    filter: { event: string },
    callback: (message: unknown) => void,
  ): MemberRealtimeChannel {
    expect(type).toBe('broadcast')
    expect(filter).toEqual({ event: '*' })
    this.broadcast = callback
    return this
  }

  subscribe(
    callback: (status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => void,
  ): MemberRealtimeChannel {
    this.status = callback
    callback('SUBSCRIBED')
    return this
  }

  emit(event: string, payload: Record<string, unknown>) {
    this.broadcast?.({ type: 'broadcast', event, payload })
  }

  emitMalformed(message: unknown) {
    this.broadcast?.(message)
  }

  emitStatus(status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') {
    this.status?.(status)
  }
}

function callbacks(): MemberRealtimeCallbacks {
  return {
    onSubscribed: vi.fn(),
    onEvent: vi.fn(),
    onMalformedEvent: vi.fn(),
    onChannelError: vi.fn(),
  }
}

function setup() {
  const channel = new MockChannel()
  const removeChannel = vi.fn(async () => 'ok')
  const client: MemberRealtimeClient = {
    realtime: { setAuth: vi.fn(async () => undefined) },
    channel: vi.fn(() => channel),
    removeChannel,
  }
  return { channel, client, removeChannel }
}

describe('member Realtime adapter', () => {
  it('accepts the app client and owns one authenticated private user topic', async () => {
    expectTypeOf<SupabaseClient<Database>>().toExtend<MemberRealtimeClient>()
    const fixture = setup()
    const handlers = callbacks()
    const handle = await openMemberRealtime({
      client: fixture.client,
      accessToken: 'member-token',
      userId,
      callbacks: handlers,
    })
    expect(fixture.client.realtime.setAuth).toHaveBeenCalledWith('member-token')
    expect(fixture.client.channel).toHaveBeenCalledOnce()
    expect(fixture.client.channel).toHaveBeenCalledWith(`user:${userId}`, {
      config: { private: true },
    })
    expect(handlers.onSubscribed).toHaveBeenCalledOnce()
    fixture.channel.emitStatus('SUBSCRIBED')
    expect(handlers.onSubscribed).toHaveBeenCalledTimes(2)
    await handle.close()
    await handle.close()
    expect(fixture.removeChannel).toHaveBeenCalledOnce()
  })

  it('parses every IDs-only event and deduplicates generated event IDs', async () => {
    const fixture = setup()
    const handlers = callbacks()
    const handle = await openMemberRealtime({
      client: fixture.client,
      accessToken: 'member-token',
      userId,
      callbacks: handlers,
    })
    const events = [
      ['help.changed', { id: '91000000-0000-4000-8000-000000000001', askId }],
      ['messages.changed', { id: '91000000-0000-4000-8000-000000000002', conversationId }],
      [
        'connections.changed',
        { id: '91000000-0000-4000-8000-000000000003', requestId, conversationId },
      ],
      [
        'conversation.permissions_changed',
        { id: '91000000-0000-4000-8000-000000000004', conversationId },
      ],
      ['conversation.revoked', { id: '91000000-0000-4000-8000-000000000005', conversationId }],
    ] as const
    for (const [event, payload] of events) fixture.channel.emit(event, payload)
    fixture.channel.emit(events[0][0], events[0][1])
    expect(handlers.onEvent).toHaveBeenCalledTimes(5)
    expect(handlers.onEvent).toHaveBeenLastCalledWith({
      type: 'conversation.revoked',
      id: '91000000-0000-4000-8000-000000000005',
      conversationId,
    })
    await handle.close()
  })

  it('fails closed on content, extra fields, missing Connection IDs, and unknown events', async () => {
    const fixture = setup()
    const handlers = callbacks()
    const handle = await openMemberRealtime({
      client: fixture.client,
      accessToken: 'member-token',
      userId,
      callbacks: handlers,
    })
    fixture.channel.emit('messages.changed', {
      id: '91000000-0000-4000-8000-000000000006',
      conversationId,
      body: 'must not arrive',
    })
    fixture.channel.emit('connections.changed', {
      id: '91000000-0000-4000-8000-000000000007',
    })
    fixture.channel.emit('unknown.changed', {
      id: '91000000-0000-4000-8000-000000000008',
    })
    fixture.channel.emitMalformed({ malformed: true })
    expect(handlers.onEvent).not.toHaveBeenCalled()
    expect(handlers.onMalformedEvent).toHaveBeenCalledWith({
      eventName: 'messages.changed',
      reason: 'malformed_payload',
    })
    expect(handlers.onMalformedEvent).toHaveBeenCalledWith({
      eventName: 'connections.changed',
      reason: 'malformed_payload',
    })
    expect(handlers.onMalformedEvent).toHaveBeenCalledWith({
      eventName: 'unknown.changed',
      reason: 'unexpected_event',
    })
    expect(handlers.onMalformedEvent).toHaveBeenCalledWith({
      eventName: null,
      reason: 'malformed_envelope',
    })
    await handle.close()
  })

  it('surfaces post-subscription failure without leaking transport details', async () => {
    const fixture = setup()
    const handlers = callbacks()
    const handle = await openMemberRealtime({
      client: fixture.client,
      accessToken: 'member-token',
      userId,
      callbacks: handlers,
    })
    fixture.channel.emitStatus('CHANNEL_ERROR')
    expect(handlers.onChannelError).toHaveBeenCalledOnce()
    await handle.close()
  })
})

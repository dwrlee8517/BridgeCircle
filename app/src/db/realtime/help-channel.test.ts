import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import type { Database } from '@/db/database.types'
import {
  type HelpRealtimeCallbacks,
  type HelpRealtimeChannel,
  type HelpRealtimeClient,
  openHelpRealtime,
} from './help-channel'

const userId = '10000000-0000-4000-8000-000000000002'
const askId = '30000000-0000-4000-8000-000000000001'
const offerId = '40000000-0000-4000-8000-000000000001'

class MockChannel implements HelpRealtimeChannel {
  private broadcastCallback: ((message: unknown) => void) | null = null
  private statusCallback:
    | ((status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR', error?: Error) => void)
    | null = null

  constructor(private readonly initialStatus: 'SUBSCRIBED' | 'CHANNEL_ERROR' = 'SUBSCRIBED') {}

  on(
    type: 'broadcast',
    filter: { event: string },
    callback: (message: unknown) => void,
  ): HelpRealtimeChannel {
    expect(type).toBe('broadcast')
    expect(filter).toEqual({ event: 'help.changed' })
    this.broadcastCallback = callback
    return this
  }

  subscribe(
    callback: (
      status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR',
      error?: Error,
    ) => void,
  ): HelpRealtimeChannel {
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

function callbacks(): HelpRealtimeCallbacks {
  return {
    onRefetchAfterCursor: vi.fn(),
    onHelpChanged: vi.fn(),
    onMalformedEvent: vi.fn(),
    onChannelError: vi.fn(),
  }
}

function setup(initialStatus: 'SUBSCRIBED' | 'CHANNEL_ERROR' = 'SUBSCRIBED') {
  const channel = new MockChannel(initialStatus)
  const callOrder: string[] = []
  const removeChannel = vi.fn(async () => 'ok')
  const client: HelpRealtimeClient = {
    realtime: {
      setAuth: vi.fn(async () => {
        callOrder.push('setAuth')
      }),
    },
    channel(topic, options) {
      callOrder.push(`channel:${topic}`)
      expect(options).toEqual({ config: { private: true } })
      return channel
    },
    removeChannel,
  }
  return { channel, callOrder, client, removeChannel }
}

function message(event: string, payload: Record<string, unknown>) {
  return { type: 'broadcast', event, payload }
}

describe('Help Realtime adapter', () => {
  it('accepts the application Supabase client without a transport cast', () => {
    expectTypeOf<SupabaseClient<Database>>().toExtend<HelpRealtimeClient>()
  })

  it('authenticates before opening one private user topic and refetches after reconnect', async () => {
    const fixture = setup()
    const handlers = callbacks()
    const handle = await openHelpRealtime({
      client: fixture.client,
      accessToken: 'member-token',
      userId,
      callbacks: handlers,
    })

    expect(fixture.callOrder).toEqual(['setAuth', `channel:user:${userId}`])
    expect(handlers.onRefetchAfterCursor).toHaveBeenCalledTimes(1)
    fixture.channel.emitStatus('SUBSCRIBED')
    expect(handlers.onRefetchAfterCursor).toHaveBeenCalledTimes(2)

    await handle.close()
    await handle.close()
    expect(fixture.removeChannel).toHaveBeenCalledOnce()
    expect(fixture.removeChannel).toHaveBeenCalledWith(fixture.channel)
  })

  it('accepts only strict IDs-only events and deduplicates event IDs', async () => {
    const fixture = setup()
    const handlers = callbacks()
    const handle = await openHelpRealtime({
      client: fixture.client,
      accessToken: 'member-token',
      userId,
      callbacks: handlers,
    })
    const event = {
      id: '91000000-0000-4000-8000-000000000001',
      askId,
      offerId,
    }

    fixture.channel.emitBroadcast(message('help.changed', event))
    fixture.channel.emitBroadcast(message('help.changed', event))
    expect(handlers.onHelpChanged).toHaveBeenCalledOnce()
    expect(handlers.onHelpChanged).toHaveBeenCalledWith(event)

    fixture.channel.emitBroadcast(message('help.changed', { ...event, question: 'must not leak' }))
    fixture.channel.emitBroadcast(message('unexpected.event', event))
    fixture.channel.emitBroadcast({ malformed: true })
    expect(handlers.onMalformedEvent).toHaveBeenCalledWith({
      eventName: 'help.changed',
      reason: 'malformed_payload',
    })
    expect(handlers.onMalformedEvent).toHaveBeenCalledWith({
      eventName: 'unexpected.event',
      reason: 'unexpected_event',
    })
    expect(handlers.onMalformedEvent).toHaveBeenCalledWith({
      eventName: null,
      reason: 'malformed_envelope',
    })

    await handle.close()
  })

  it('cleans up a channel whose initial subscription is denied', async () => {
    const fixture = setup('CHANNEL_ERROR')
    await expect(
      openHelpRealtime({
        client: fixture.client,
        accessToken: 'member-token',
        userId,
        callbacks: callbacks(),
      }),
    ).rejects.toThrow('denied')
    expect(fixture.removeChannel).toHaveBeenCalledOnce()
  })
})

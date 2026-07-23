import { z } from 'zod'
import type { MemberControlEvent } from '@/lib/messages/member-control'

export type { MemberControlEvent } from '@/lib/messages/member-control'

type ChannelStatus = 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR'
type TimerHandle = ReturnType<typeof setTimeout>

export interface MemberRealtimeChannel {
  on(
    type: 'broadcast',
    filter: { event: string },
    callback: (message: unknown) => void,
  ): MemberRealtimeChannel
  subscribe(callback: (status: ChannelStatus, error?: Error) => void): MemberRealtimeChannel
}

export interface MemberRealtimeClient {
  realtime: { setAuth(accessToken: string): Promise<void> }
  channel(topic: string, options: { config: { private: true } }): MemberRealtimeChannel
  removeChannel(channel: MemberRealtimeChannel): Promise<unknown>
}

export interface MemberRealtimeCallbacks {
  onSubscribed(): void | Promise<void>
  onEvent(event: MemberControlEvent): void | Promise<void>
  onMalformedEvent(event: {
    eventName: string | null
    reason: 'malformed_envelope' | 'unexpected_event' | 'malformed_payload'
  }): void | Promise<void>
  onChannelError(error: Error): void | Promise<void>
}

export interface MemberRealtimeHandle {
  close(): Promise<void>
}

const openOptionsSchema = z.object({
  accessToken: z.string().min(1),
  userId: z.uuid(),
  subscribeTimeoutMs: z.number().int().positive().max(60_000),
})
const envelopeSchema = z.object({ event: z.string(), payload: z.unknown() }).passthrough()
const idSchema = z.uuid()
const helpChangedSchema = z
  .object({ id: idSchema, askId: z.uuid(), offerId: z.uuid().optional() })
  .strict()
const messagesChangedSchema = z.object({ id: idSchema, conversationId: z.uuid() }).strict()
const connectionsChangedSchema = z
  .object({
    id: idSchema,
    requestId: z.uuid().optional(),
    conversationId: z.uuid().optional(),
  })
  .strict()
  .refine((value) => Boolean(value.requestId || value.conversationId))
const conversationControlSchema = z.object({ id: idSchema, conversationId: z.uuid() }).strict()
const EVENT_NAMES = new Set([
  'help.changed',
  'messages.changed',
  'connections.changed',
  'conversation.permissions_changed',
  'conversation.revoked',
])

function remember(values: Set<string>, value: string, limit = 512): boolean {
  if (values.has(value)) return false
  values.add(value)
  if (values.size > limit) {
    const oldest = values.values().next().value
    if (oldest) values.delete(oldest)
  }
  return true
}

function normalizeError(value: unknown, fallback: string): Error {
  return value instanceof Error ? value : new Error(fallback)
}

function parseEvent(eventName: string, payload: unknown): MemberControlEvent | null {
  if (eventName === 'help.changed') {
    const parsed = helpChangedSchema.safeParse(payload)
    return parsed.success ? { type: eventName, ...parsed.data } : null
  }
  if (eventName === 'messages.changed') {
    const parsed = messagesChangedSchema.safeParse(payload)
    return parsed.success ? { type: eventName, ...parsed.data } : null
  }
  if (eventName === 'connections.changed') {
    const parsed = connectionsChangedSchema.safeParse(payload)
    return parsed.success ? { type: eventName, ...parsed.data } : null
  }
  if (eventName === 'conversation.permissions_changed' || eventName === 'conversation.revoked') {
    const parsed = conversationControlSchema.safeParse(payload)
    return parsed.success ? { type: eventName, ...parsed.data } : null
  }
  return null
}

export async function openMemberRealtime(options: {
  client: MemberRealtimeClient
  accessToken: string
  userId: string
  callbacks: MemberRealtimeCallbacks
  subscribeTimeoutMs?: number
}): Promise<MemberRealtimeHandle> {
  const parsed = openOptionsSchema.parse({
    accessToken: options.accessToken,
    userId: options.userId,
    subscribeTimeoutMs: options.subscribeTimeoutMs ?? 10_000,
  })
  const { client, callbacks } = options
  const seenEventIds = new Set<string>()
  const subscriptionTimers = new Set<TimerHandle>()
  let closed = false
  let closePromise: Promise<void> | null = null

  function reportError(value: unknown, fallback: string) {
    const error = normalizeError(value, fallback)
    try {
      void Promise.resolve(callbacks.onChannelError(error)).catch(() => undefined)
    } catch {
      // A reporting callback cannot interrupt channel cleanup.
    }
  }

  function invoke(callback: () => void | Promise<void>) {
    try {
      void Promise.resolve(callback()).catch((error) =>
        reportError(error, 'Member callback failed'),
      )
    } catch (error) {
      reportError(error, 'Member callback failed')
    }
  }

  function malformed(
    eventName: string | null,
    reason: Parameters<MemberRealtimeCallbacks['onMalformedEvent']>[0]['reason'],
  ) {
    invoke(() => callbacks.onMalformedEvent({ eventName, reason }))
  }

  function handleBroadcast(message: unknown) {
    if (closed) return
    const envelope = envelopeSchema.safeParse(message)
    if (!envelope.success) {
      malformed(null, 'malformed_envelope')
      return
    }
    if (!EVENT_NAMES.has(envelope.data.event)) {
      malformed(envelope.data.event, 'unexpected_event')
      return
    }
    const event = parseEvent(envelope.data.event, envelope.data.payload)
    if (!event) {
      malformed(envelope.data.event, 'malformed_payload')
      return
    }
    if (!remember(seenEventIds, event.id)) return
    invoke(() => callbacks.onEvent(event))
  }

  await client.realtime.setAuth(parsed.accessToken)
  const channel = client.channel(`user:${parsed.userId}`, { config: { private: true } })
  channel.on('broadcast', { event: '*' }, handleBroadcast)

  async function close(): Promise<void> {
    if (closePromise) return closePromise
    closed = true
    for (const timer of subscriptionTimers) clearTimeout(timer)
    subscriptionTimers.clear()
    closePromise = Promise.resolve(client.removeChannel(channel)).then(() => undefined)
    return closePromise
  }

  function subscribe(): Promise<void> {
    return new Promise((resolve, reject) => {
      let ready = false
      const timer = setTimeout(() => {
        subscriptionTimers.delete(timer)
        reject(new Error('Timed out subscribing to member Realtime channel'))
      }, parsed.subscribeTimeoutMs)
      subscriptionTimers.add(timer)

      channel.subscribe((status, error) => {
        if (closed) return
        if (status === 'SUBSCRIBED') {
          invoke(() => callbacks.onSubscribed())
          if (!ready) {
            ready = true
            clearTimeout(timer)
            subscriptionTimers.delete(timer)
            resolve()
          }
          return
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          const statusError = normalizeError(error, `Member Realtime channel ${status}`)
          if (!ready) {
            ready = true
            clearTimeout(timer)
            subscriptionTimers.delete(timer)
            reject(statusError)
          } else {
            reportError(statusError, 'Member Realtime channel failed')
          }
        }
      })
    })
  }

  try {
    await subscribe()
  } catch (error) {
    await close()
    throw error
  }
  return { close }
}

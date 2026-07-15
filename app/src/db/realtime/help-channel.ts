import { z } from 'zod'

type ChannelStatus = 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR'
type TimerHandle = ReturnType<typeof setTimeout>

export interface HelpRealtimeChannel {
  on(
    type: 'broadcast',
    filter: { event: string },
    callback: (message: unknown) => void,
  ): HelpRealtimeChannel
  subscribe(callback: (status: ChannelStatus, error?: Error) => void): HelpRealtimeChannel
}

export interface HelpRealtimeClient {
  realtime: {
    setAuth(accessToken: string): Promise<void>
  }
  channel(topic: string, options: { config: { private: true } }): HelpRealtimeChannel
  removeChannel(channel: HelpRealtimeChannel): Promise<unknown>
}

export interface HelpRealtimeCallbacks {
  onRefetchAfterCursor(): void | Promise<void>
  onHelpChanged(event: { id: string; askId: string; offerId?: string }): void | Promise<void>
  onMalformedEvent(event: {
    eventName: string | null
    reason: 'malformed_envelope' | 'unexpected_event' | 'malformed_payload'
  }): void | Promise<void>
  onChannelError(error: Error): void | Promise<void>
}

export interface OpenHelpRealtimeOptions {
  client: HelpRealtimeClient
  accessToken: string
  userId: string
  callbacks: HelpRealtimeCallbacks
  subscribeTimeoutMs?: number
}

export interface HelpRealtimeHandle {
  close(): Promise<void>
}

const openOptionsSchema = z.object({
  accessToken: z.string().min(1),
  userId: z.uuid(),
  subscribeTimeoutMs: z.number().int().positive().max(60_000),
})

const envelopeSchema = z
  .object({
    event: z.string(),
    payload: z.unknown(),
  })
  .passthrough()

const helpChangedSchema = z
  .object({
    id: z.uuid(),
    askId: z.uuid(),
    offerId: z.uuid().optional(),
  })
  .strict()

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

export async function openHelpRealtime(
  options: OpenHelpRealtimeOptions,
): Promise<HelpRealtimeHandle> {
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
      // A reporting callback cannot be allowed to break channel cleanup.
    }
  }

  function invoke(callback: () => void | Promise<void>) {
    try {
      void Promise.resolve(callback()).catch((error) => reportError(error, 'Help callback failed'))
    } catch (error) {
      reportError(error, 'Help callback failed')
    }
  }

  function malformed(
    eventName: string | null,
    reason: Parameters<HelpRealtimeCallbacks['onMalformedEvent']>[0]['reason'],
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
    if (envelope.data.event !== 'help.changed') {
      malformed(envelope.data.event, 'unexpected_event')
      return
    }
    const event = helpChangedSchema.safeParse(envelope.data.payload)
    if (!event.success) {
      malformed(envelope.data.event, 'malformed_payload')
      return
    }
    if (!remember(seenEventIds, event.data.id)) return
    invoke(() => callbacks.onHelpChanged(event.data))
  }

  await client.realtime.setAuth(parsed.accessToken)
  const channel = client.channel(`user:${parsed.userId}`, { config: { private: true } })
  channel.on('broadcast', { event: 'help.changed' }, handleBroadcast)

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
        reject(new Error('Timed out subscribing to Help Realtime channel'))
      }, parsed.subscribeTimeoutMs)
      subscriptionTimers.add(timer)

      channel.subscribe((status, error) => {
        if (closed) return
        if (status === 'SUBSCRIBED') {
          invoke(() => callbacks.onRefetchAfterCursor())
          if (!ready) {
            ready = true
            clearTimeout(timer)
            subscriptionTimers.delete(timer)
            resolve()
          }
          return
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          const statusError = normalizeError(error, `Help Realtime channel ${status}`)
          if (!ready) {
            ready = true
            clearTimeout(timer)
            subscriptionTimers.delete(timer)
            reject(statusError)
          } else {
            reportError(statusError, 'Help Realtime channel failed')
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

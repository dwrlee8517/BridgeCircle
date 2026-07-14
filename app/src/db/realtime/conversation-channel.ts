import { z } from 'zod'

type ChannelStatus = 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR'
type EventSource = 'conversation' | 'control'
type TimerHandle = ReturnType<typeof setTimeout>

export interface ConversationRealtimeChannel {
  on(
    type: 'broadcast',
    filter: { event: string },
    callback: (message: unknown) => void,
  ): ConversationRealtimeChannel
  subscribe(callback: (status: ChannelStatus, error?: Error) => void): ConversationRealtimeChannel
}

export interface ConversationRealtimeClient {
  realtime: {
    setAuth(accessToken: string): Promise<void>
  }
  channel(topic: string, options: { config: { private: true } }): ConversationRealtimeChannel
  removeChannel(channel: ConversationRealtimeChannel): Promise<unknown>
}

export interface ConversationRealtimeCallbacks {
  onRefetchAfterCursor(): void | Promise<void>
  onMessageCreated(event: { conversationId: string; messageId: number }): void | Promise<void>
  onReadAdvanced(event: {
    conversationId: string
    readerUserId: string
    messageId: number
  }): void | Promise<void>
  onPermissionsChanged(event: { conversationId: string }): void | Promise<void>
  onRevoked(event: { conversationId: string }): void | Promise<void>
  onTypingChanged(event: {
    conversationId: string
    actorUserId: string
    isTyping: boolean
    expiresAt: string
  }): void | Promise<void>
  onMalformedEvent(event: {
    source: EventSource
    eventName: string | null
    reason:
      | 'malformed_envelope'
      | 'unexpected_event'
      | 'malformed_payload'
      | 'conversation_mismatch'
  }): void | Promise<void>
  onChannelError(error: Error): void | Promise<void>
}

export interface OpenConversationRealtimeOptions {
  client: ConversationRealtimeClient
  accessToken: string
  conversationId: string
  userId: string
  callbacks: ConversationRealtimeCallbacks
  subscribeTimeoutMs?: number
}

export interface ConversationRealtimeHandle {
  close(): Promise<void>
}

const openOptionsSchema = z.object({
  accessToken: z.string().min(1),
  conversationId: z.uuid(),
  userId: z.uuid(),
  subscribeTimeoutMs: z.number().int().positive().max(60_000),
})

const envelopeSchema = z
  .object({
    event: z.string(),
    payload: z.unknown(),
  })
  .passthrough()

const eventIdSchema = z.uuid()
const conversationIdSchema = z.uuid()
const messageIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .refine((value) => Number.isSafeInteger(value))
const timestampSchema = z.string().refine((value) => Number.isFinite(Date.parse(value)))

const messageCreatedSchema = z
  .object({
    id: eventIdSchema,
    conversationId: conversationIdSchema,
    messageId: messageIdSchema,
  })
  .strict()

const readAdvancedSchema = z
  .object({
    id: eventIdSchema,
    conversationId: conversationIdSchema,
    readerUserId: z.uuid(),
    messageId: messageIdSchema,
  })
  .strict()

const conversationControlSchema = z
  .object({
    id: eventIdSchema,
    conversationId: conversationIdSchema,
  })
  .strict()

const typingChangedSchema = z
  .object({
    id: eventIdSchema,
    conversationId: conversationIdSchema,
    actorUserId: z.uuid(),
    isTyping: z.boolean(),
    expiresAt: timestampSchema,
  })
  .strict()

const conversationEvents = new Set(['message.created', 'read.advanced', 'typing.changed'])
const controlEvents = new Set(['conversation.permissions_changed', 'conversation.revoked'])

function remember<T>(values: Set<T>, value: T, limit = 512): boolean {
  if (values.has(value)) return false
  values.add(value)
  if (values.size > limit) {
    const oldest = values.values().next().value
    if (oldest) values.delete(oldest)
  }
  return true
}

function normalizeError(value: unknown, fallback: string): Error {
  if (value instanceof Error) return value
  return new Error(fallback)
}

export async function openConversationRealtime(
  options: OpenConversationRealtimeOptions,
): Promise<ConversationRealtimeHandle> {
  const parsed = openOptionsSchema.parse({
    accessToken: options.accessToken,
    conversationId: options.conversationId,
    userId: options.userId,
    subscribeTimeoutMs: options.subscribeTimeoutMs ?? 10_000,
  })
  const { client, callbacks } = options
  const seenEventIds = new Set<string>()
  const seenMessageIds = new Set<number>()
  const typingTimers = new Map<string, TimerHandle>()
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
      void Promise.resolve(callback()).catch((error) =>
        reportError(error, 'Realtime callback failed'),
      )
    } catch (error) {
      reportError(error, 'Realtime callback failed')
    }
  }

  function malformed(
    source: EventSource,
    eventName: string | null,
    reason: Parameters<ConversationRealtimeCallbacks['onMalformedEvent']>[0]['reason'],
  ) {
    invoke(() => callbacks.onMalformedEvent({ source, eventName, reason }))
  }

  function clearTypingTimer(actorUserId: string) {
    const timer = typingTimers.get(actorUserId)
    if (timer) clearTimeout(timer)
    typingTimers.delete(actorUserId)
  }

  function handleBroadcast(source: EventSource, message: unknown) {
    if (closed) return
    const envelope = envelopeSchema.safeParse(message)
    if (!envelope.success) {
      malformed(source, null, 'malformed_envelope')
      return
    }

    const { event: eventName, payload } = envelope.data
    const allowed = source === 'conversation' ? conversationEvents : controlEvents
    if (!allowed.has(eventName)) {
      malformed(source, eventName, 'unexpected_event')
      return
    }

    if (eventName === 'message.created') {
      const result = messageCreatedSchema.safeParse(payload)
      if (!result.success) {
        malformed(source, eventName, 'malformed_payload')
        return
      }
      const created = result.data
      if (created.conversationId !== parsed.conversationId) {
        malformed(source, eventName, 'conversation_mismatch')
        return
      }
      if (!remember(seenEventIds, created.id)) return
      if (!remember(seenMessageIds, created.messageId)) return
      invoke(() =>
        callbacks.onMessageCreated({
          conversationId: created.conversationId,
          messageId: created.messageId,
        }),
      )
      return
    }
    if (eventName === 'read.advanced') {
      const result = readAdvancedSchema.safeParse(payload)
      if (!result.success) {
        malformed(source, eventName, 'malformed_payload')
        return
      }
      const read = result.data
      if (read.conversationId !== parsed.conversationId) {
        malformed(source, eventName, 'conversation_mismatch')
        return
      }
      if (!remember(seenEventIds, read.id)) return
      invoke(() =>
        callbacks.onReadAdvanced({
          conversationId: read.conversationId,
          readerUserId: read.readerUserId,
          messageId: read.messageId,
        }),
      )
      return
    }
    if (eventName === 'typing.changed') {
      const result = typingChangedSchema.safeParse(payload)
      if (!result.success) {
        malformed(source, eventName, 'malformed_payload')
        return
      }
      const typing = result.data
      if (typing.conversationId !== parsed.conversationId) {
        malformed(source, eventName, 'conversation_mismatch')
        return
      }
      if (!remember(seenEventIds, typing.id)) return
      clearTypingTimer(typing.actorUserId)
      const typingEvent = {
        conversationId: typing.conversationId,
        actorUserId: typing.actorUserId,
        isTyping: typing.isTyping,
        expiresAt: typing.expiresAt,
      }
      invoke(() => callbacks.onTypingChanged(typingEvent))
      if (typing.isTyping) {
        const timer = setTimeout(
          () => {
            typingTimers.delete(typing.actorUserId)
            if (closed) return
            invoke(() => callbacks.onTypingChanged({ ...typingEvent, isTyping: false }))
          },
          Math.max(0, Date.parse(typing.expiresAt) - Date.now()),
        )
        typingTimers.set(typing.actorUserId, timer)
      }
      return
    }

    const result = conversationControlSchema.safeParse(payload)
    if (!result.success) {
      malformed(source, eventName, 'malformed_payload')
      return
    }
    const control = result.data
    if (control.conversationId !== parsed.conversationId) {
      malformed(source, eventName, 'conversation_mismatch')
      return
    }
    if (!remember(seenEventIds, control.id)) return
    if (eventName === 'conversation.permissions_changed') {
      invoke(() => callbacks.onPermissionsChanged({ conversationId: control.conversationId }))
    } else {
      invoke(() => callbacks.onRevoked({ conversationId: control.conversationId }))
    }
  }

  await client.realtime.setAuth(parsed.accessToken)
  const conversationChannel = client.channel(`conversation:${parsed.conversationId}`, {
    config: { private: true },
  })
  const controlChannel = client.channel(`user:${parsed.userId}`, {
    config: { private: true },
  })

  conversationChannel.on('broadcast', { event: '*' }, (message) =>
    handleBroadcast('conversation', message),
  )
  controlChannel.on('broadcast', { event: '*' }, (message) => handleBroadcast('control', message))

  async function close(): Promise<void> {
    if (closePromise) return closePromise
    closed = true
    for (const timer of typingTimers.values()) clearTimeout(timer)
    typingTimers.clear()
    for (const timer of subscriptionTimers) clearTimeout(timer)
    subscriptionTimers.clear()
    closePromise = Promise.all([
      client.removeChannel(conversationChannel),
      client.removeChannel(controlChannel),
    ]).then(() => undefined)
    return closePromise
  }

  function subscribe(channel: ConversationRealtimeChannel, source: EventSource): Promise<void> {
    return new Promise((resolve, reject) => {
      let ready = false
      const timer = setTimeout(() => {
        subscriptionTimers.delete(timer)
        reject(new Error(`Timed out subscribing to ${source} Realtime channel`))
      }, parsed.subscribeTimeoutMs)
      subscriptionTimers.add(timer)

      channel.subscribe((status, error) => {
        if (closed) return
        if (status === 'SUBSCRIBED') {
          if (source === 'conversation') invoke(() => callbacks.onRefetchAfterCursor())
          if (!ready) {
            ready = true
            clearTimeout(timer)
            subscriptionTimers.delete(timer)
            resolve()
          }
          return
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          const statusError = normalizeError(error, `${source} Realtime channel ${status}`)
          if (!ready) {
            ready = true
            clearTimeout(timer)
            subscriptionTimers.delete(timer)
            reject(statusError)
          } else {
            reportError(statusError, `${source} Realtime channel failed`)
          }
        }
      })
    })
  }

  try {
    await Promise.all([
      subscribe(conversationChannel, 'conversation'),
      subscribe(controlChannel, 'control'),
    ])
  } catch (error) {
    await close()
    throw error
  }

  return { close }
}

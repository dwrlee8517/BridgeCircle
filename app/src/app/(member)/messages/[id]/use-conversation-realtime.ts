'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/db/client'
import { openConversationRealtime } from '@/db/realtime/conversation-channel'
import { conversationReconnectDelayMs } from '@/lib/messages/thread-state'

type Callbacks = {
  recoverAfterCursor(): Promise<boolean>
  onReadAdvanced(readerUserId: string, messageId: number): void
  onTypingChanged(actorUserId: string, isTyping: boolean): void
}

export function useConversationRealtime({
  conversationId,
  viewerUserId,
  callbacks,
}: {
  conversationId: string
  viewerUserId: string
  callbacks: Callbacks
}) {
  const callbacksRef = useRef(callbacks)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    callbacksRef.current = callbacks
  }, [callbacks])

  useEffect(() => {
    let active = true
    let connecting = false
    let isPaused = false
    let attempt = 0
    let retryTimer: ReturnType<typeof setTimeout> | null = null
    let handle: Awaited<ReturnType<typeof openConversationRealtime>> | null = null
    let closing: Promise<void> | null = null
    const client = createClient()

    async function closeCurrent() {
      if (closing) await closing
      const current = handle
      handle = null
      if (!current) return
      closing = current.close()
      try {
        await closing
      } finally {
        closing = null
      }
    }

    function clearRetryTimer() {
      if (retryTimer) clearTimeout(retryTimer)
      retryTimer = null
    }

    function scheduleReconnect(immediate: boolean) {
      if (!active) return
      isPaused = true
      setPaused(true)
      clearRetryTimer()
      const delay = immediate ? 0 : conversationReconnectDelayMs(attempt++)
      retryTimer = setTimeout(() => {
        retryTimer = null
        void connect()
      }, delay)
      void closeCurrent()
    }

    async function connect() {
      if (!active || connecting) return
      connecting = true
      clearRetryTimer()
      await closeCurrent()
      try {
        const { data } = await client.auth.getSession()
        const accessToken = data.session?.access_token
        if (!accessToken) throw new Error('Conversation session unavailable')
        const nextHandle = await openConversationRealtime({
          client,
          accessToken,
          conversationId,
          callbacks: {
            async onRefetchAfterCursor() {
              if (!(await callbacksRef.current.recoverAfterCursor())) {
                throw new Error('Conversation gap recovery failed')
              }
            },
            async onMessageCreated() {
              if (!(await callbacksRef.current.recoverAfterCursor())) {
                throw new Error('Conversation message recovery failed')
              }
            },
            onReadAdvanced(event) {
              if (event.readerUserId !== viewerUserId) {
                callbacksRef.current.onReadAdvanced(event.readerUserId, event.messageId)
              }
            },
            onTypingChanged(event) {
              if (event.actorUserId !== viewerUserId) {
                callbacksRef.current.onTypingChanged(event.actorUserId, event.isTyping)
              }
            },
            onMalformedEvent() {},
            onChannelError() {
              scheduleReconnect(false)
            },
          },
        })
        if (!active) {
          await nextHandle.close()
          return
        }
        handle = nextHandle
        attempt = 0
        isPaused = false
        setPaused(false)
      } catch {
        if (active) scheduleReconnect(false)
      } finally {
        connecting = false
      }
    }

    function retryWhenAvailable() {
      if (!active || !isPaused) return
      scheduleReconnect(true)
    }

    function retryWhenVisible() {
      if (document.visibilityState === 'visible') retryWhenAvailable()
    }

    window.addEventListener('online', retryWhenAvailable)
    window.addEventListener('focus', retryWhenAvailable)
    document.addEventListener('visibilitychange', retryWhenVisible)
    void connect()

    return () => {
      active = false
      clearRetryTimer()
      window.removeEventListener('online', retryWhenAvailable)
      window.removeEventListener('focus', retryWhenAvailable)
      document.removeEventListener('visibilitychange', retryWhenVisible)
      void closeCurrent()
    }
  }, [conversationId, viewerUserId])

  return { paused }
}

'use client'

import * as Sentry from '@sentry/nextjs'
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import { createClient } from '@/db/client'
import { type MemberRealtimeHandle, openMemberRealtime } from '@/db/realtime/member-channel'
import {
  INITIAL_MEMBER_CONTROL_STATE,
  type MemberControlState,
  reconnectDelayMs,
  reduceMemberControl,
} from '@/lib/messages/member-control'

type UserControlValue = MemberControlState & {
  status: 'connecting' | 'live' | 'paused'
  messagesAttentionCount: number
}

const UserControlContext = createContext<UserControlValue | null>(null)

export function UserControlProvider({
  userId,
  initialMessagesAttentionCount,
  children,
}: {
  userId: string
  initialMessagesAttentionCount: number
  children: ReactNode
}) {
  const [control, dispatch] = useReducer(reduceMemberControl, INITIAL_MEMBER_CONTROL_STATE)
  const [status, setStatus] = useState<UserControlValue['status']>('connecting')
  const [messagesAttentionCount, setMessagesAttentionCount] = useState(
    initialMessagesAttentionCount,
  )
  const countsSequence = useRef(0)

  useEffect(() => {
    let disposed = false
    let connecting = false
    let recovering = false
    let healthy = false
    let attempt = 0
    let handle: MemberRealtimeHandle | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    const client = createClient()

    function clearReconnectTimer() {
      if (reconnectTimer) clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    async function closeCurrent() {
      const current = handle
      handle = null
      if (current) await current.close()
    }

    function scheduleReconnect(immediate = false) {
      if (disposed || reconnectTimer) return
      const delay = immediate ? 0 : reconnectDelayMs(attempt)
      if (!immediate) attempt += 1
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null
        void connect()
      }, delay)
    }

    async function recover(immediate = false) {
      if (disposed || recovering) return
      recovering = true
      healthy = false
      setStatus('paused')
      clearReconnectTimer()
      try {
        await closeCurrent()
      } finally {
        recovering = false
        scheduleReconnect(immediate)
      }
    }

    async function connect() {
      if (disposed || connecting || recovering) return
      connecting = true
      setStatus('connecting')
      try {
        const { data, error } = await client.auth.getSession()
        const accessToken = data.session?.access_token
        if (error || !accessToken) throw new Error('Member session unavailable')
        const nextHandle = await openMemberRealtime({
          client,
          accessToken,
          userId,
          callbacks: {
            onSubscribed() {
              if (disposed) return
              healthy = true
              attempt = 0
              setStatus('live')
              dispatch({ type: 'subscribed' })
            },
            onEvent(event) {
              if (!disposed) dispatch({ type: 'event', event })
            },
            onMalformedEvent(event) {
              Sentry.captureMessage('Ignored malformed member Realtime event', {
                level: 'warning',
                tags: { scope: 'member-realtime', reason: event.reason },
              })
            },
            onChannelError() {
              Sentry.captureMessage('Member Realtime channel became unavailable', {
                level: 'warning',
                tags: { scope: 'member-realtime' },
              })
              window.setTimeout(() => void recover(), 0)
            },
          },
        })
        if (disposed) {
          await nextHandle.close()
          return
        }
        handle = nextHandle
      } catch {
        if (!disposed) {
          healthy = false
          setStatus('paused')
          scheduleReconnect()
        }
      } finally {
        connecting = false
      }
    }

    function retryWhenAvailable() {
      if (document.visibilityState === 'hidden' || healthy || connecting || recovering) return
      void recover(true)
    }

    void connect()
    window.addEventListener('online', retryWhenAvailable)
    document.addEventListener('visibilitychange', retryWhenAvailable)
    return () => {
      disposed = true
      clearReconnectTimer()
      window.removeEventListener('online', retryWhenAvailable)
      document.removeEventListener('visibilitychange', retryWhenAvailable)
      void closeCurrent()
    }
  }, [userId])

  useEffect(() => {
    if (control.revision === 0) return
    const sequence = ++countsSequence.current
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/messages/counts', {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!response.ok) return
        const payload: unknown = await response.json()
        if (
          sequence === countsSequence.current &&
          payload &&
          typeof payload === 'object' &&
          'attention' in payload &&
          typeof payload.attention === 'number' &&
          Number.isSafeInteger(payload.attention) &&
          payload.attention >= 0
        ) {
          setMessagesAttentionCount(payload.attention)
        }
      } catch {
        // Keep the last authoritative value; a later event/focus retries.
      }
    }, 150)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [control.revision])

  const value = useMemo(
    () => ({ ...control, status, messagesAttentionCount }),
    [control, messagesAttentionCount, status],
  )
  return <UserControlContext.Provider value={value}>{children}</UserControlContext.Provider>
}

export function useUserControl() {
  const value = useContext(UserControlContext)
  if (!value) throw new Error('User control hooks must be used inside UserControlProvider')
  return value
}

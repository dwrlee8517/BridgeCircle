'use client'

import * as Sentry from '@sentry/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { createClient } from '@/db/client'
import { type HelpRealtimeHandle, openHelpRealtime } from '@/db/realtime/help-channel'

export function useHelpRealtimeRefresh({ userId, askId }: { userId: string; askId?: string }) {
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    let handle: HelpRealtimeHandle | null = null

    async function subscribe() {
      const client = createClient()
      const { data, error } = await client.auth.getSession()
      if (error || !data.session?.access_token || cancelled) return

      const nextHandle = await openHelpRealtime({
        client,
        accessToken: data.session.access_token,
        userId,
        callbacks: {
          onRefetchAfterCursor: () => router.refresh(),
          onHelpChanged: (event) => {
            if (!askId || event.askId === askId) router.refresh()
          },
          onMalformedEvent: (event) => {
            Sentry.captureMessage('Ignored malformed Help Realtime event', {
              level: 'warning',
              tags: { scope: 'help-realtime', reason: event.reason },
            })
          },
          onChannelError: () => {
            Sentry.captureMessage('Help Realtime channel became unavailable', {
              level: 'warning',
              tags: { scope: 'help-realtime' },
            })
          },
        },
      })
      if (cancelled) {
        await nextHandle.close()
        return
      }
      handle = nextHandle
    }

    void subscribe().catch(() => {
      Sentry.captureMessage('Help Realtime subscription failed', {
        level: 'warning',
        tags: { scope: 'help-realtime' },
      })
    })

    return () => {
      cancelled = true
      if (handle) void handle.close()
    }
  }, [askId, router, userId])
}

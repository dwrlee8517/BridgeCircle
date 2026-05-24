'use client'

import { format } from 'date-fns'
import { useSyncExternalStore } from 'react'

/**
 * Renders an ISO timestamp formatted in the viewer's local timezone.
 *
 * Server-rendered date-fns calls inherit the Node runtime timezone (usually
 * UTC on Railway), which produced "Wed, May 27 · 2:25 AM" for SF events.
 * This client-side render uses the browser timezone so the time the user
 * sees is the time they would actually need to show up.
 *
 * `iso` is rendered as the server fallback so SEO/no-JS still see a
 * coherent value; hydration replaces it with the local-time version.
 */
export function EventTime({
  iso,
  pattern = 'EEE, MMM d · h:mm a',
  fallback,
}: {
  iso: string
  pattern?: string
  fallback?: string
}) {
  const mounted = useSyncExternalStore(
    subscribeAfterHydration,
    getClientSnapshot,
    getServerSnapshot,
  )

  if (!mounted) {
    return <span suppressHydrationWarning>{fallback ?? iso}</span>
  }

  return <span suppressHydrationWarning>{format(new Date(iso), pattern)}</span>
}

function subscribeAfterHydration(onStoreChange: () => void) {
  const id = window.setTimeout(onStoreChange, 0)
  return () => window.clearTimeout(id)
}

function getClientSnapshot() {
  return true
}

function getServerSnapshot() {
  return false
}

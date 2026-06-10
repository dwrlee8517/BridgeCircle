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
  withZone = false,
}: {
  iso: string
  pattern?: string
  fallback?: string
  /**
   * Append the viewer's short timezone ("PT", "KST"). Use on event times —
   * the community spans Palos Verdes and Songdo, so a bare clock time is
   * ambiguous (voice guidelines § format rules).
   */
  withZone?: boolean
}) {
  const mounted = useSyncExternalStore(
    subscribeAfterHydration,
    getClientSnapshot,
    getServerSnapshot,
  )

  if (!mounted) {
    return <span suppressHydrationWarning>{fallback ?? iso}</span>
  }

  const date = new Date(iso)
  // Voice format rule: lowercase meridiem with no space — "6:00pm", not "6:00 PM".
  const text = format(date, pattern).replace(/\s(AM|PM)\b/g, (_, m: string) => m.toLowerCase())
  return <span suppressHydrationWarning>{withZone ? `${text} ${shortZone(date)}` : text}</span>
}

function shortZone(date: Date): string {
  const part = new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' })
    .formatToParts(date)
    .find((p) => p.type === 'timeZoneName')
  return part?.value ?? ''
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

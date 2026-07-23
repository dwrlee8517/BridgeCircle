'use client'

import { useSyncExternalStore } from 'react'
import type { SchoolEventCard } from '@/lib/school/contracts'
import { campusTimeLabel, formatEventDate, formatEventTimeRange } from '@/lib/school/time'

export function EventTime({ event }: { event: SchoolEventCard }) {
  const localZone = useSyncExternalStore(
    subscribeToTimeZone,
    readLocalTimeZone,
    () => event.timeZone,
  )

  const local = `${formatEventDate(event.startsAt, localZone)} · ${formatEventTimeRange(event.startsAt, event.endsAt, localZone)}`
  const campus = `${formatEventDate(event.startsAt, event.timeZone)} · ${formatEventTimeRange(event.startsAt, event.endsAt, event.timeZone)}`

  return (
    <span className="block">
      <span className="block">{local}</span>
      {localZone !== event.timeZone ? (
        <span className="mt-0.5 block text-fine font-medium text-surface-ink-muted">
          {campus} · {campusTimeLabel(event)}
        </span>
      ) : (
        <span className="mt-0.5 block text-fine font-medium text-surface-ink-muted">
          {campusTimeLabel(event)}
        </span>
      )}
    </span>
  )
}

function subscribeToTimeZone() {
  return () => undefined
}

function readLocalTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

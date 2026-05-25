'use client'

import { Check } from 'lucide-react'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { rsvpAction } from './actions'

type Props = {
  eventId: string
  current: 'going' | 'not_going' | 'waitlisted' | null
  /** True when the event is at capacity AND viewer isn't already going. */
  isFull: boolean
  className?: string
}

/**
 * Single-button RSVP toggle for the events list right-rail. Submits 'going'
 * on first click; subsequent clicks while in 'going'/'waitlisted' toggle to
 * 'not_going'. Server resolves to 'waitlisted' when capacity is hit.
 *
 * Used alongside the dedicated /events/[id] page (which has the full
 * Going/Not going toggle); this is the in-context one-click flow.
 */
export function RsvpQuickButton({ eventId, current, isFull, className }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isGoing = current === 'going' || current === 'waitlisted'
  let label: string
  if (current === 'going') label = 'Going'
  else if (current === 'waitlisted') label = 'On waitlist'
  else if (isFull) label = 'Join waitlist'
  else label = 'RSVP'

  function submit() {
    const fd = new FormData()
    fd.set('eventId', eventId)
    fd.set('status', isGoing ? 'not_going' : 'going')
    setError(null)
    startTransition(async () => {
      const result = await rsvpAction(fd)
      if (!result.ok) setError(result.error)
    })
  }

  return (
    <div className={className}>
      <Button
        type="button"
        size="lg"
        variant={isGoing ? 'secondary' : 'default'}
        onClick={submit}
        disabled={pending}
        className="w-full rounded-lg"
      >
        {isGoing ? <Check className="size-4" strokeWidth={1.5} /> : null}
        {label}
      </Button>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { rsvpAction } from './actions'

type Props = {
  eventId: string
  current: 'going' | 'not_going' | 'waitlisted' | null
  /** True when the event is at capacity AND viewer isn't already going. The
   * "Going" button changes copy to "Join waitlist" so users know what they're
   * signing up for. */
  isFull: boolean
}

/**
 * Three-state RSVP control. The user always submits 'going' or 'not_going';
 * the server resolves to 'waitlisted' if the event is at capacity. The
 * button copy adapts to the resolved state on the next render.
 *
 * UI states:
 *   current=going       → "✓ Going" (filled)
 *   current=waitlisted  → "On waitlist" (secondary fill)
 *   current=not_going   → "Going" / "Not going" buttons, "Not going" highlighted
 *   current=null + full → "Join waitlist" / "Not going"
 *   current=null        → "Going" / "Not going"
 *
 * Errors from the server action surface inline below the buttons so the user
 * (and we!) know when something went wrong instead of staring at an
 * unchanged button. Common cause: migration not yet applied to dev DB.
 */
export function RsvpButtons({ eventId, current, isFull }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit(status: 'going' | 'not_going') {
    const fd = new FormData()
    fd.set('eventId', eventId)
    fd.set('status', status)
    setError(null)
    startTransition(async () => {
      const result = await rsvpAction(fd)
      if (!result.ok) setError(result.error)
    })
  }

  // Going button label adapts to context.
  let goingLabel: string
  let goingVariant: 'default' | 'outline' | 'secondary'
  if (current === 'going') {
    goingLabel = '✓ Going'
    goingVariant = 'default'
  } else if (current === 'waitlisted') {
    goingLabel = 'On waitlist'
    goingVariant = 'secondary'
  } else if (isFull) {
    goingLabel = 'Join waitlist'
    goingVariant = 'outline'
  } else {
    goingLabel = 'Going'
    goingVariant = 'outline'
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={goingVariant}
          onClick={() => submit('going')}
          disabled={pending}
        >
          {goingLabel}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={current === 'not_going' ? 'secondary' : 'ghost'}
          onClick={() => submit('not_going')}
          disabled={pending}
        >
          Not going
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

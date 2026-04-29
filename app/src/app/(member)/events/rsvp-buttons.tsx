'use client'

import { Check, X } from 'lucide-react'
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

  // Going button label + variant adapts to context. The visual rule:
  //   active state  → filled with primary color (clear "you picked this")
  //   inactive      → outline (clear "you can pick this")
  // Previously both states used the same neutral-feeling chips, which made
  // the buttons read as inactive tabs rather than toggle states.
  let goingLabel: string
  const goingActive = current === 'going' || current === 'waitlisted'
  if (current === 'going') {
    goingLabel = 'Going'
  } else if (current === 'waitlisted') {
    goingLabel = 'On waitlist'
  } else if (isFull) {
    goingLabel = 'Join waitlist'
  } else {
    goingLabel = 'Going'
  }

  const notGoingActive = current === 'not_going'

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={goingActive ? 'default' : 'outline'}
          onClick={() => submit('going')}
          disabled={pending}
        >
          {goingActive ? <Check className="size-3.5" /> : null}
          {goingLabel}
        </Button>
        <Button
          type="button"
          variant={notGoingActive ? 'default' : 'outline'}
          onClick={() => submit('not_going')}
          disabled={pending}
        >
          {notGoingActive ? <X className="size-3.5" /> : null}
          Not going
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

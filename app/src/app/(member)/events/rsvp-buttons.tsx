'use client'

import { Check } from 'lucide-react'
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
  /** Match the size of any sibling buttons in the row (e.g. "Add to calendar")
   * so the CTA cluster reads as one group. Defaults to 'default'. */
  size?: 'default' | 'sm'
}

/**
 * Single-action RSVP control. The user always submits 'going' or 'not_going';
 * the server resolves to 'waitlisted' if the event is at capacity. The
 * button copy adapts to the resolved state on the next render.
 *
 * UI states:
 *   current=going       → "You're going" (sage, clicking cancels)
 *   current=waitlisted  → "On waitlist" (sage, clicking leaves waitlist)
 *   current=null/full   → amber commit action
 *
 * Errors from the server action surface inline below the buttons so the user
 * (and we!) know when something went wrong instead of staring at an
 * unchanged button. Common cause: migration not yet applied to dev DB.
 */
export function RsvpButtons({ eventId, current, isFull, size = 'default' }: Props) {
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

  let label: string
  const active = current === 'going' || current === 'waitlisted'
  if (current === 'going') {
    label = "You're going"
  } else if (current === 'waitlisted') {
    label = 'On waitlist'
  } else if (isFull) {
    label = 'Join waitlist'
  } else {
    label = "RSVP - I'm going"
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        type="button"
        size={size}
        variant={active ? 'offer' : 'cta'}
        onClick={() => submit(active ? 'not_going' : 'going')}
        disabled={pending}
        className="w-full"
      >
        {active ? <Check className="size-4" strokeWidth={1.7} /> : null}
        {pending ? 'Saving...' : label}
      </Button>
      {active ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Select again if your plans change.
        </p>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

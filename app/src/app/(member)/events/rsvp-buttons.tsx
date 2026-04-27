'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { rsvpAction } from './actions'

type Props = {
  eventId: string
  current: 'going' | 'not_going' | null
}

export function RsvpButtons({ eventId, current }: Props) {
  const [pending, startTransition] = useTransition()

  function submit(status: 'going' | 'not_going') {
    const fd = new FormData()
    fd.set('eventId', eventId)
    fd.set('status', status)
    startTransition(() => {
      rsvpAction(fd)
    })
  }

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        size="sm"
        variant={current === 'going' ? 'default' : 'outline'}
        onClick={() => submit('going')}
        disabled={pending}
      >
        {current === 'going' ? '✓ Going' : 'Going'}
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
  )
}

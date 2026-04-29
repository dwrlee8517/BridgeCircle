'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { type CancelSelfState, cancelSelfDeletionAction } from './actions'

const INITIAL: CancelSelfState = {}

export function CancelForm() {
  const [state, action, pending] = useActionState(cancelSelfDeletionAction, INITIAL)

  return (
    <form action={action} className="space-y-3">
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Restoring your account…' : 'Cancel deletion and restore access'}
      </Button>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
    </form>
  )
}

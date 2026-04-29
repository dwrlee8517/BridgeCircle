'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { type ReactivateState, reactivateSelfAction } from './actions'

const INITIAL: ReactivateState = {}

export function ReactivateForm() {
  const [state, action, pending] = useActionState(reactivateSelfAction, INITIAL)

  return (
    <form action={action} className="space-y-3">
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Reactivating…' : 'Reactivate my account'}
      </Button>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
    </form>
  )
}

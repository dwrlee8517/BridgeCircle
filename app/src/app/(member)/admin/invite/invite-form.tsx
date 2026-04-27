'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { inviteFromForm, type InviteFormState } from './actions'

const initialState: InviteFormState = {}

export function InviteForm() {
  const [state, action, pending] = useActionState(inviteFromForm, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success && formRef.current) {
      formRef.current.reset()
    }
  }, [state.success, state.emailJustSent])

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required placeholder="alumnus@example.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="graduationYear">Grad year</Label>
          <Input
            id="graduationYear"
            name="graduationYear"
            inputMode="numeric"
            pattern="\d{4}"
            placeholder="2018"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Full name (optional)</Label>
        <Input id="fullName" name="fullName" placeholder="Alex Alumnus" />
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-green-700 dark:text-green-400">
          Invite sent to {state.emailJustSent}.
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? 'Sending…' : 'Send invite'}
      </Button>
    </form>
  )
}

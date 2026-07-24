'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type InviteFormState, inviteFromForm } from './actions'

const initialState: InviteFormState = {}

export function InviteForm() {
  const [state, action, pending] = useActionState(inviteFromForm, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const errorId = state.error ? 'invite-form-error' : undefined

  useEffect(() => {
    if (state.success && formRef.current) {
      formRef.current.reset()
    }
  }, [state.success])

  useEffect(() => {
    if (state.error) emailRef.current?.focus()
  }, [state.error])

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            ref={emailRef}
            name="email"
            type="email"
            required
            placeholder="alumnus@example.com"
            aria-invalid={state.error ? true : undefined}
            aria-describedby={errorId}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="graduationYear">Grad year</Label>
          <Input
            id="graduationYear"
            name="graduationYear"
            inputMode="numeric"
            pattern="\d{4}"
            placeholder="2018"
            aria-invalid={state.error ? true : undefined}
            aria-describedby={errorId}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Full name (optional)</Label>
        <Input id="fullName" name="fullName" placeholder="Alex Alumnus" />
      </div>

      {state.error ? (
        <FormMessage tone="error" id={errorId}>
          {state.error}
        </FormMessage>
      ) : null}
      {state.success ? (
        <FormMessage tone="success">Invite sent to {state.emailJustSent}.</FormMessage>
      ) : null}

      <Button type="submit" disabled={pending} aria-busy={pending}>
        {pending ? 'Sending…' : 'Send invite'}
      </Button>
    </form>
  )
}

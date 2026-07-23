'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/form-message'
import { FormSubmitButton } from '@/components/ui/form-submit-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type JoinState, signUpWithPassword, startGoogleSignup } from './actions'

const initialState: JoinState = {}

type Props = {
  token: string
  email: string
  fullName: string | null
  organizationName: string
}

export function JoinForm({ token, email, fullName, organizationName }: Props) {
  const [state, action, pending] = useActionState(signUpWithPassword, initialState)
  const passwordRef = useRef<HTMLInputElement>(null)
  const errorId = state.error ? 'join-password-error' : undefined

  useEffect(() => {
    if (state.error) passwordRef.current?.focus()
  }, [state.error])

  return (
    <div className="space-y-5 text-base">
      <div className="space-y-1">
        {fullName ? <p className="text-sm text-muted-foreground">{fullName} —</p> : null}
        <p className="text-kicker font-semibold uppercase tracking-hero text-primary">
          You&apos;re invited to
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight">{organizationName}</h1>
        <p className="text-sm text-muted-foreground">on BridgeCircle</p>
      </div>

      <form action={startGoogleSignup}>
        <input type="hidden" name="token" value={token} />
        <FormSubmitButton
          variant="outline"
          className="h-11 w-full text-base"
          pendingLabel="Opening Google…"
        >
          Sign up with Google
        </FormSubmitButton>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">or use a password</span>
        </div>
      </div>

      <form action={action} className="space-y-4">
        <input type="hidden" name="token" value={token} />
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            disabled
            readOnly
            className="h-11 text-base md:text-base"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm">
            Choose a password
          </Label>
          <Input
            id="password"
            ref={passwordRef}
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="At least 8 characters"
            aria-invalid={state.error ? true : undefined}
            aria-describedby={errorId}
            className="h-11 text-base md:text-base"
          />
        </div>
        <FieldError id={errorId} error={state.error} className="text-sm" />
        <Button
          type="submit"
          className="h-11 w-full text-base"
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </div>
  )
}

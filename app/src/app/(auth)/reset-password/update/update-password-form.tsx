'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldError } from '@/components/ui/form-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type UpdatePasswordState, updatePassword } from '../actions'

const initialState: UpdatePasswordState = {}

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, initialState)
  const passwordRef = useRef<HTMLInputElement>(null)
  const errorId = state.error ? 'update-password-error' : undefined

  useEffect(() => {
    if (state.error) passwordRef.current?.focus()
  }, [state.error])

  return (
    <Card className="text-base shadow-card-hover">
      <CardHeader className="pt-7 pb-2">
        <CardTitle className="font-heading text-3xl font-bold tracking-tight">
          Choose a new password
        </CardTitle>
        <CardDescription className="text-base">
          You&rsquo;re signed in — set a new password to keep going.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pb-6">
        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm">
              New password
            </Label>
            <Input
              id="password"
              ref={passwordRef}
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              aria-invalid={state.error ? true : undefined}
              aria-describedby={
                errorId ? `${errorId} password-requirements` : 'password-requirements'
              }
              className="h-11 text-base md:text-base"
            />
            <p id="password-requirements" className="text-xs text-muted-foreground">
              At least 8 characters.
            </p>
          </div>
          <FieldError id={errorId} error={state.error} className="text-sm" />
          <Button
            type="submit"
            className="h-11 w-full text-base"
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? 'Saving…' : 'Save new password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

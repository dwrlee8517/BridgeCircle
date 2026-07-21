'use client'

import Link from 'next/link'
import { useActionState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldError } from '@/components/ui/form-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type ResetRequestState, requestPasswordReset } from './actions'

const initialState: ResetRequestState = {}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initialState)
  const emailRef = useRef<HTMLInputElement>(null)
  const errorId = state.error ? 'reset-password-email-error' : undefined

  useEffect(() => {
    if (state.error) emailRef.current?.focus()
  }, [state.error])

  return (
    <Card className="text-base shadow-card-hover">
      <CardHeader className="pt-7 pb-2">
        <CardTitle className="font-heading text-3xl font-bold tracking-tight">
          Reset your password
        </CardTitle>
        <CardDescription className="text-base">
          Enter your email and we&rsquo;ll send a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pb-6">
        {state.done ? (
          <div
            role="status"
            className="rounded-md border border-border bg-surface-panel p-4 text-sm leading-relaxed text-foreground"
          >
            If that email is in the circle, a reset link is on its way. It may take a minute.
          </div>
        ) : (
          <form action={action} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm">
                Email
              </Label>
              <Input
                id="email"
                ref={emailRef}
                name="email"
                type="email"
                autoComplete="email"
                required
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
              {pending ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
        )}

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/sign-in" className="font-medium text-link hover:text-link-hover">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

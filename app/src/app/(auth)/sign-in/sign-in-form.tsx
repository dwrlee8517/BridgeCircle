'use client'

import Link from 'next/link'
import { useActionState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldError, FormMessage } from '@/components/ui/form-message'
import { FormSubmitButton } from '@/components/ui/form-submit-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type SignInState, signInWithGoogle, signInWithPassword } from './actions'

const initialState: SignInState = {}

export function SignInForm({
  next,
  initialError,
}: {
  next: string | null
  initialError: string | null
}) {
  const [state, action, pending] = useActionState(signInWithPassword, initialState)
  const emailRef = useRef<HTMLInputElement>(null)
  const formErrorId = state.error ? 'sign-in-error' : undefined

  useEffect(() => {
    if (state.error) emailRef.current?.focus()
  }, [state.error])

  return (
    <Card className="text-base shadow-card-hover">
      <CardHeader className="pt-7 pb-2">
        {/* No mini-wordmark kicker — the auth panel already carries the lockup. */}
        <CardTitle className="font-heading text-3xl font-bold tracking-tight">
          Welcome back
        </CardTitle>
        <CardDescription className="text-base">
          Sign in to your verified school circle.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pb-6">
        {initialError ? (
          <FormMessage tone="error" className="rounded-md bg-destructive/10 p-3">
            {initialError}
          </FormMessage>
        ) : null}
        <form action={signInWithGoogle}>
          {next ? <input type="hidden" name="next" value={next} /> : null}
          <FormSubmitButton
            variant="outline"
            className="h-11 w-full text-base"
            pendingLabel="Opening Google…"
          >
            Sign in with Google
          </FormSubmitButton>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <form action={action} className="space-y-4">
          {next ? <input type="hidden" name="next" value={next} /> : null}
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
              aria-describedby={formErrorId}
              className="h-11 text-base md:text-base"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm">
                Password
              </Label>
              <Link
                href="/reset-password"
                className="text-xs font-medium text-link hover:text-link-hover"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              aria-invalid={state.error ? true : undefined}
              aria-describedby={formErrorId}
              className="h-11 text-base md:text-base"
            />
          </div>
          <FieldError id={formErrorId} error={state.error} className="text-sm" />
          <Button type="submit" className="h-11 w-full text-base" disabled={pending}>
            {pending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="border-t border-border pt-4 text-center text-xs leading-relaxed text-muted-foreground">
          New here? BridgeCircle is invite-only — your school sends the invitation email.
        </p>
      </CardContent>
    </Card>
  )
}

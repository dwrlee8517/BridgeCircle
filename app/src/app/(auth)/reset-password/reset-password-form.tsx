'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type ResetRequestState, requestPasswordReset } from './actions'

const initialState: ResetRequestState = {}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initialState)

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
          <div className="rounded-md border border-border bg-surface-panel p-4 text-sm leading-relaxed text-foreground">
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
                name="email"
                type="email"
                autoComplete="email"
                required
                className="h-11 text-base md:text-base"
              />
            </div>
            {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
            <Button type="submit" className="h-11 w-full text-base" disabled={pending}>
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

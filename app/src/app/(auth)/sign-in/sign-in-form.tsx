'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

  return (
    <Card className="text-base shadow-card-hover">
      <CardHeader className="pt-7 pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          BridgeCircle
        </p>
        <CardTitle className="font-heading text-3xl font-bold tracking-[-0.02em]">
          Welcome back
        </CardTitle>
        <CardDescription className="text-base">
          Sign in to your verified alumni network.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pb-6">
        {initialError ? (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {initialError}
          </div>
        ) : null}
        <form action={signInWithGoogle}>
          {next ? <input type="hidden" name="next" value={next} /> : null}
          <Button type="submit" variant="outline" className="h-11 w-full text-base">
            Sign in with Google
          </Button>
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
              name="email"
              type="email"
              autoComplete="email"
              required
              className="h-11 text-base md:text-base"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="h-11 text-base md:text-base"
            />
          </div>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" className="h-11 w-full text-base" disabled={pending}>
            {pending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

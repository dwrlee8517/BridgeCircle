'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signUpWithPassword, startGoogleSignup, type JoinState } from './actions'

const initialState: JoinState = {}

type Props = {
  token: string
  email: string
  fullName: string | null
  organizationName: string
}

export function JoinForm({ token, email, fullName, organizationName }: Props) {
  const [state, action, pending] = useActionState(signUpWithPassword, initialState)

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          {fullName ? `${fullName} —` : ''} you're invited to
        </p>
        <h1 className="text-xl font-semibold">{organizationName}</h1>
        <p className="text-sm text-muted-foreground">on BridgeCircle</p>
      </div>

      <form action={startGoogleSignup}>
        <input type="hidden" name="token" value={token} />
        <Button type="submit" variant="outline" className="w-full">
          Sign up with Google
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">or use a password</span>
        </div>
      </div>

      <form action={action} className="space-y-3">
        <input type="hidden" name="token" value={token} />
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" value={email} disabled readOnly />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Choose a password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="At least 8 characters"
          />
        </div>
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </div>
  )
}

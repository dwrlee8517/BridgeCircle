'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type UpdatePasswordState, updatePassword } from '../actions'

const initialState: UpdatePasswordState = {}

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, initialState)

  return (
    <Card className="text-base shadow-card-hover">
      <CardHeader className="pt-7 pb-2">
        <CardTitle className="font-heading text-3xl font-bold tracking-[-0.02em]">
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
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className="h-11 text-base md:text-base"
            />
            <p className="text-xs text-muted-foreground">At least 8 characters.</p>
          </div>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" className="h-11 w-full text-base" disabled={pending}>
            {pending ? 'Saving…' : 'Save new password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

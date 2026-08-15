'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormMessage } from '@/components/ui/form-message'
import { FormSubmitButton } from '@/components/ui/form-submit-button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { DEMO_WINDOW_DURATION_MINUTES } from '@/lib/demo/windows'
import { armDemo, closeDemo, type DemoArmState } from './actions'

function durationLabel(minutes: number): string {
  return minutes < 60 ? `${minutes} minutes` : `${minutes / 60} hours`
}

const DURATIONS = DEMO_WINDOW_DURATION_MINUTES.map((minutes) => ({
  value: String(minutes),
  label: durationLabel(minutes),
}))

const initialState: DemoArmState = {}

function formatUntil(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function ArmForm({ activeWindowExpiresAt }: { activeWindowExpiresAt: string | null }) {
  const [state, action] = useActionState(armDemo, initialState)
  const [closeState, closeAction] = useActionState(closeDemo, initialState)
  const [copied, setCopied] = useState(false)

  const expiresAt = state.expiresAt ?? activeWindowExpiresAt

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight">Demo access</CardTitle>
        <CardDescription>
          Arming opens the demo link for a set time. The previous link stops working and anyone
          still inside is signed out.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {expiresAt ? (
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <p className="font-medium">Armed until {formatUntil(expiresAt)}</p>
            {state.link ? null : (
              <p className="mt-1 text-muted-foreground">
                The link was shown when this window was armed. Arm again for a fresh one.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">The door is closed.</p>
        )}

        {state.link ? (
          <div className="space-y-2 rounded-md border p-3">
            <Label className="text-sm">Share this link — it is shown once</Label>
            <p className="break-all font-mono text-sm">{state.link}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(state.link ?? '')
                setCopied(true)
              }}
            >
              {copied ? 'Copied' : 'Copy link'}
            </Button>
          </div>
        ) : null}

        {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
        {closeState.error ? <FormMessage tone="error">{closeState.error}</FormMessage> : null}

        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Open for</Label>
            <RadioGroup name="duration" defaultValue="120" className="flex gap-4">
              {DURATIONS.map((duration) => (
                <div key={duration.value} className="flex items-center gap-1.5">
                  <RadioGroupItem value={duration.value} id={`duration-${duration.value}`} />
                  <Label htmlFor={`duration-${duration.value}`} className="text-sm font-normal">
                    {duration.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <FormSubmitButton className="w-full" pendingLabel="Arming…">
            {expiresAt ? 'Arm a fresh window' : 'Arm the door'}
          </FormSubmitButton>
        </form>

        {expiresAt ? (
          <form action={closeAction}>
            <FormSubmitButton variant="outline" className="w-full" pendingLabel="Closing…">
              Close now
            </FormSubmitButton>
          </form>
        ) : null}
      </CardContent>
    </Card>
  )
}

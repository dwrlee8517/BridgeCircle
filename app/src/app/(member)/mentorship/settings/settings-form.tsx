'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { type SettingsFormState, saveMentorSettings } from './actions'

const initialState: SettingsFormState = {}

type Props = {
  defaults: {
    isOpen: boolean
    topics: string
    screeningPrompt: string
    maxActiveMentees: number
    maxPendingRequests: number
  }
  activeMenteeCount: number
  pendingRequestCount: number
}

export function SettingsForm({ defaults, activeMenteeCount, pendingRequestCount }: Props) {
  const [state, action, pending] = useActionState(saveMentorSettings, initialState)
  const fe = state.fieldErrors ?? {}

  return (
    <form action={action} className="space-y-6">
      {/* Step #1 keeps the legacy single-toggle UI; openToAdvice defaults on
          and is preserved across saves via this hidden input. The next step
          (mentor settings UI redesign) replaces this with proper per-type
          checkboxes. */}
      <input type="hidden" name="openToAdvice" value="on" />
      <div className="flex items-start gap-3 rounded-md border p-4">
        <Checkbox id="isOpen" name="isOpen" defaultChecked={defaults.isOpen} />
        <div className="space-y-1">
          <Label htmlFor="isOpen" className="text-base">
            I&apos;m open to mentoring
          </Label>
          <p className="text-xs text-muted-foreground">
            When off, mentees can&apos;t send you new requests. Existing threads stay active.
          </p>
        </div>
      </div>

      <Field
        id="topics"
        label="Topics you can help with"
        hint="Comma-separated. Helps mentees find you in search."
        error={fe.topics}
      >
        <Input
          id="topics"
          name="topics"
          placeholder="e.g. consulting, business school, returning to Korea"
          defaultValue={defaults.topics}
        />
      </Field>

      <Field
        id="screeningPrompt"
        label="Screening question (optional)"
        hint="One sentence. Mentees answer before sending a request."
        error={fe.screeningPrompt}
      >
        <Textarea
          id="screeningPrompt"
          name="screeningPrompt"
          rows={2}
          maxLength={280}
          placeholder="e.g. What specifically are you hoping to get out of this conversation?"
          defaultValue={defaults.screeningPrompt}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="maxActiveMentees"
          label="Max active mentees"
          hint={`Currently ${activeMenteeCount} active.`}
          error={fe.maxActiveMentees}
        >
          <Input
            id="maxActiveMentees"
            name="maxActiveMentees"
            type="number"
            min={1}
            max={100}
            defaultValue={defaults.maxActiveMentees}
            required
          />
        </Field>
        <Field
          id="maxPendingRequests"
          label="Max pending requests"
          hint={`Currently ${pendingRequestCount} pending.`}
          error={fe.maxPendingRequests}
        >
          <Input
            id="maxPendingRequests"
            name="maxPendingRequests"
            type="number"
            min={1}
            max={100}
            defaultValue={defaults.maxPendingRequests}
            required
          />
        </Field>
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-emerald-600">Saved.</p> : null}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? 'Saving…' : 'Save settings'}
      </Button>
    </form>
  )
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

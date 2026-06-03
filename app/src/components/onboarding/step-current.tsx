'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { OnboardingImportOptions } from './step-education'
import { useSubmitterTracker } from './use-form-has-content'

export type StepCurrentState = {
  error?: string
  fieldErrors?: Record<string, string>
  skipped?: boolean
}

const initialState: StepCurrentState = {}

type Props = {
  defaults: {
    currentEmployer: string
    currentTitle: string
    city: string
    headline: string
    linkedinUrl: string
  }
  action: (state: StepCurrentState, formData: FormData) => Promise<StepCurrentState>
}

/**
 * Step 3 of 5 — Where you are now. Skippable.
 *
 * All fields optional. Most members will fill at least employer + title +
 * city; LinkedIn is a useful shortcut for the rest of the network to
 * verify, but plenty of members won't include it.
 *
 * No requirement to have a current job — students, retirees, parents at
 * home, between roles. Empty values are stored as null.
 */
export function StepCurrent({ defaults, action }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const fe = state.fieldErrors ?? {}
  const { submittingKind, onSaveClick, onSkipClick } = useSubmitterTracker(pending)

  return (
    <form action={formAction} className="space-y-5">
      <OnboardingImportOptions step={3} />
      <div className="space-y-1.5">
        <Label htmlFor="currentEmployer">Current employer</Label>
        <Input
          id="currentEmployer"
          name="currentEmployer"
          defaultValue={defaults.currentEmployer}
          placeholder="Where you work today (skip if between roles)"
        />
        {fe.currentEmployer ? (
          <p className="text-xs text-destructive">{fe.currentEmployer}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="currentTitle">Current title</Label>
        <Input
          id="currentTitle"
          name="currentTitle"
          defaultValue={defaults.currentTitle}
          placeholder="What you do"
        />
        {fe.currentTitle ? <p className="text-xs text-destructive">{fe.currentTitle}</p> : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          name="city"
          defaultValue={defaults.city}
          placeholder="Where you're based"
          autoComplete="address-level2"
        />
        {fe.city ? <p className="text-xs text-destructive">{fe.city}</p> : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="headline" className="flex items-baseline gap-2">
          Headline
          <span className="text-xs font-normal text-muted-foreground">Optional</span>
        </Label>
        <Input
          id="headline"
          name="headline"
          defaultValue={defaults.headline}
          placeholder="One line, e.g. Senior PM, formerly at Stripe"
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground">Shows under your name on profile cards.</p>
        {fe.headline ? <p className="text-xs text-destructive">{fe.headline}</p> : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="linkedinUrl" className="flex items-baseline gap-2">
          LinkedIn URL
          <span className="text-xs font-normal text-muted-foreground">Optional</span>
        </Label>
        <Input
          id="linkedinUrl"
          name="linkedinUrl"
          type="url"
          defaultValue={defaults.linkedinUrl}
          placeholder="https://linkedin.com/in/…"
        />
        {fe.linkedinUrl ? <p className="text-xs text-destructive">{fe.linkedinUrl}</p> : null}
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <div className="flex flex-col gap-2 pt-2 sm:flex-row-reverse">
        <Button type="submit" onClick={onSaveClick} disabled={pending} className="sm:flex-1">
          {pending && submittingKind === 'save' ? 'Saving…' : 'Save and continue'}
        </Button>
        <Button
          type="submit"
          name="skip"
          value="1"
          onClick={onSkipClick}
          variant="outline"
          disabled={pending}
          className="sm:flex-1"
        >
          {pending && submittingKind === 'skip' ? 'Skipping…' : 'Skip for now'}
        </Button>
      </div>
    </form>
  )
}

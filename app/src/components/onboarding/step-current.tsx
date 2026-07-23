'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { FieldError, FormMessage } from '@/components/ui/form-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    industry: string
  }
  action: (state: StepCurrentState, formData: FormData) => Promise<StepCurrentState>
}

/**
 * Step 4 of 7 — Where you are now. Skippable.
 *
 * All fields optional. Most members will fill at least employer + title +
 * city and industry. Empty values are stored as null.
 *
 * No requirement to have a current job — students, retirees, parents at
 * home, between roles. Empty values are stored as null.
 */
export function StepCurrent({ defaults, action }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const fe = state.fieldErrors ?? {}
  const { submittingKind, onSaveClick, onSkipClick } = useSubmitterTracker(pending)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.error || state.fieldErrors) {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    }
  }, [state.error, state.fieldErrors])

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="currentEmployer">Current employer</Label>
        <Input
          id="currentEmployer"
          name="currentEmployer"
          defaultValue={defaults.currentEmployer}
          placeholder="Where you work today (skip if between roles)"
          aria-invalid={fe.currentEmployer ? true : undefined}
          aria-describedby={fe.currentEmployer ? 'currentEmployer-error' : undefined}
        />
        <FieldError id="currentEmployer-error" error={fe.currentEmployer} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="currentTitle">Current title</Label>
        <Input
          id="currentTitle"
          name="currentTitle"
          defaultValue={defaults.currentTitle}
          placeholder="What you do"
          aria-invalid={fe.currentTitle ? true : undefined}
          aria-describedby={fe.currentTitle ? 'currentTitle-error' : undefined}
        />
        <FieldError id="currentTitle-error" error={fe.currentTitle} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          name="city"
          defaultValue={defaults.city}
          placeholder="Where you're based"
          autoComplete="address-level2"
          aria-invalid={fe.city ? true : undefined}
          aria-describedby={fe.city ? 'city-error' : undefined}
        />
        <FieldError id="city-error" error={fe.city} />
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
          aria-invalid={fe.headline ? true : undefined}
          aria-describedby={fe.headline ? 'headline-hint headline-error' : 'headline-hint'}
        />
        <p id="headline-hint" className="text-xs text-muted-foreground">
          Shows under your name on profile cards.
        </p>
        <FieldError id="headline-error" error={fe.headline} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="industry" className="flex items-baseline gap-2">
          Industry
          <span className="text-xs font-normal text-muted-foreground">Optional</span>
        </Label>
        <Input
          id="industry"
          name="industry"
          defaultValue={defaults.industry}
          placeholder="e.g. Climate investing"
          maxLength={120}
          aria-invalid={fe.industry ? true : undefined}
          aria-describedby={fe.industry ? 'industry-error' : undefined}
        />
        <FieldError id="industry-error" error={fe.industry} />
      </div>

      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}

      <div className="flex flex-col gap-2 pt-2 sm:flex-row-reverse">
        <Button
          type="submit"
          onClick={onSaveClick}
          disabled={pending}
          aria-busy={pending && submittingKind === 'save'}
          className="sm:flex-1"
        >
          {pending && submittingKind === 'save' ? 'Saving…' : 'Save and continue'}
        </Button>
        <Button
          type="submit"
          name="skip"
          value="1"
          onClick={onSkipClick}
          variant="outline"
          disabled={pending}
          aria-busy={pending && submittingKind === 'skip'}
          className="sm:flex-1"
        >
          {pending && submittingKind === 'skip' ? 'Skipping…' : 'Skip for now'}
        </Button>
      </div>
    </form>
  )
}

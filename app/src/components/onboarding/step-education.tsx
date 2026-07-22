'use client'

import { useActionState, useEffect, useRef } from 'react'
import {
  type EducationEntryInput,
  EducationHistoryField,
} from '@/components/profile-history-fields'
import { Button } from '@/components/ui/button'
import { FieldError, FormMessage } from '@/components/ui/form-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSubmitterTracker } from './use-form-has-content'

export type StepEducationState = {
  error?: string
  fieldErrors?: Record<string, string>
  /** When true, the action was a "skip" — the form should advance without
   * having validated/saved anything. Wired by the action: the Skip button
   * submits with a `skip=1` field which the action handler honors. */
  skipped?: boolean
}

const initialState: StepEducationState = {}

type Props = {
  defaults: {
    university: string
    major: string
    educationHistory: EducationEntryInput[]
  }
  action: (state: StepEducationState, formData: FormData) => Promise<StepEducationState>
}

/**
 * Step 3 of 7 — Education. Skippable.
 *
 * University and major are typed in the Basics row. Education history is
 * a separate dynamic editor; it starts empty and the user opens it via
 * "+ Add school" only if they want to record additional schools beyond
 * their alumni org.
 *
 * The Skip button submits the same form with a hidden `skip=1` field so
 * the action knows to advance without writing anything.
 */
export function StepEducation({ defaults, action }: Props) {
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
        <Label htmlFor="university">University</Label>
        <Input
          id="university"
          name="university"
          defaultValue={defaults.university}
          placeholder="Where you studied"
          aria-invalid={fe.university ? true : undefined}
          aria-describedby={fe.university ? 'university-error' : undefined}
        />
        <FieldError id="university-error" error={fe.university} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="major">Major</Label>
        <Input
          id="major"
          name="major"
          defaultValue={defaults.major}
          placeholder="What you studied"
          aria-invalid={fe.major ? true : undefined}
          aria-describedby={fe.major ? 'major-error' : undefined}
        />
        <FieldError id="major-error" error={fe.major} />
      </div>

      <fieldset
        className="rounded-lg border bg-muted/30 p-4"
        aria-invalid={fe.educationHistory ? true : undefined}
        aria-describedby={fe.educationHistory ? 'educationHistory-error' : undefined}
        tabIndex={fe.educationHistory ? -1 : undefined}
      >
        <legend className="sr-only">Education history</legend>
        <EducationHistoryField initial={defaults.educationHistory} />
        <FieldError id="educationHistory-error" error={fe.educationHistory} className="mt-2" />
      </fieldset>

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

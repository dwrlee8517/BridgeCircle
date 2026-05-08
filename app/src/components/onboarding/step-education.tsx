'use client'

import { useActionState } from 'react'
import {
  type EducationEntryInput,
  EducationHistoryField,
} from '@/components/profile-history-fields'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { anyHasContent, useFormHasContent, useSubmitterTracker } from './use-form-has-content'

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
 * Step 2 of 5 — Education. Skippable.
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
  const initial =
    anyHasContent(defaults.university, defaults.major) || defaults.educationHistory.length > 0
  const { hasContent, onFormChange } = useFormHasContent(initial)
  const { submittingKind, onSaveClick, onSkipClick } = useSubmitterTracker(pending)

  return (
    <form action={formAction} className="space-y-5" onChange={onFormChange}>
      <div className="space-y-1.5">
        <Label htmlFor="university">University</Label>
        <Input
          id="university"
          name="university"
          defaultValue={defaults.university}
          placeholder="Where you studied"
        />
        {fe.university ? <p className="text-xs text-destructive">{fe.university}</p> : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="major">Major</Label>
        <Input
          id="major"
          name="major"
          defaultValue={defaults.major}
          placeholder="What you studied"
        />
        {fe.major ? <p className="text-xs text-destructive">{fe.major}</p> : null}
      </div>

      <div className="rounded-lg border bg-muted/30 p-4">
        <EducationHistoryField initial={defaults.educationHistory} />
        {fe.educationHistory ? (
          <p className="mt-2 text-xs text-destructive">{fe.educationHistory}</p>
        ) : null}
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <div className="flex flex-col gap-2 pt-2 sm:flex-row-reverse">
        <Button
          type="submit"
          onClick={onSaveClick}
          disabled={pending || !hasContent}
          className="sm:flex-1"
          title={hasContent ? undefined : 'Add at least one field, or use Skip for now.'}
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
          className="sm:flex-1"
        >
          {pending && submittingKind === 'skip' ? 'Skipping…' : 'Skip for now'}
        </Button>
      </div>
    </form>
  )
}

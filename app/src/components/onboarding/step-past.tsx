'use client'

import { useActionState, useEffect, useRef } from 'react'
import {
  type CareerEntryInput,
  CareerHistoryField,
  SkillsField,
} from '@/components/profile-history-fields'
import { Button } from '@/components/ui/button'
import { FieldError, FormMessage } from '@/components/ui/form-message'
import { useSubmitterTracker } from './use-form-has-content'

export type StepPastState = {
  error?: string
  fieldErrors?: Record<string, string>
  skipped?: boolean
}

const initialState: StepPastState = {}

type Props = {
  defaults: {
    careerHistory: CareerEntryInput[]
    skills: string[]
  }
  action: (state: StepPastState, formData: FormData) => Promise<StepPastState>
}

/**
 * Step 5 of 7 — Where you've been. Skippable but argued for.
 *
 * This is the strategic step: past roles are what make NL search work for
 * the harder questions ("someone who used to work in fintech before
 * teaching"). Without career history, members are invisible to
 * past-experience searches — and we know from research that adding this
 * later, after onboarding, has much lower completion rates than during.
 *
 * Layout puts the resume-import path *first and primary*. Manual entry
 * is the secondary fallback. Skip is honest: "you can add this later"
 * without guilt nag, but the lede above the form makes the value clear.
 */
export function StepPast({ defaults, action }: Props) {
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
      {/* Manual editor — secondary path, but still always visible. */}
      <fieldset
        className="rounded-lg border bg-muted/30 p-4"
        aria-invalid={fe.careerHistory ? true : undefined}
        aria-describedby={fe.careerHistory ? 'careerHistory-error' : undefined}
        tabIndex={fe.careerHistory ? -1 : undefined}
      >
        <legend className="sr-only">Career history</legend>
        <CareerHistoryField initial={defaults.careerHistory} />
        <FieldError id="careerHistory-error" error={fe.careerHistory} className="mt-2" />
      </fieldset>

      <fieldset
        className="rounded-lg border bg-muted/30 p-4"
        aria-invalid={fe.skills ? true : undefined}
        aria-describedby={fe.skills ? 'skills-error' : undefined}
        tabIndex={fe.skills ? -1 : undefined}
      >
        <legend className="sr-only">Skills</legend>
        <SkillsField initial={defaults.skills} />
        <FieldError id="skills-error" error={fe.skills} className="mt-2" />
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

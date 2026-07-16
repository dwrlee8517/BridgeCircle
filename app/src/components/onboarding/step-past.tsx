'use client'

import { useActionState } from 'react'
import {
  type CareerEntryInput,
  CareerHistoryField,
  SkillsField,
} from '@/components/profile-history-fields'
import { Button } from '@/components/ui/button'
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

  return (
    <form action={formAction} className="space-y-5">
      {/* Manual editor — secondary path, but still always visible. */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <CareerHistoryField initial={defaults.careerHistory} />
        {fe.careerHistory ? (
          <p className="mt-2 text-xs text-destructive">{fe.careerHistory}</p>
        ) : null}
      </div>

      <div className="rounded-lg border bg-muted/30 p-4">
        <SkillsField initial={defaults.skills} />
        {fe.skills ? <p className="mt-2 text-xs text-destructive">{fe.skills}</p> : null}
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

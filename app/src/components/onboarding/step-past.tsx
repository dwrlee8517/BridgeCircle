'use client'

import { Sparkles, Upload } from 'lucide-react'
import Link from 'next/link'
import { useActionState } from 'react'
import {
  type CareerEntryInput,
  CareerHistoryField,
  SkillsField,
} from '@/components/profile-history-fields'
import { Button } from '@/components/ui/button'
import { LinkedInImportLink } from './step-education'
import { useFormHasContent, useSubmitterTracker } from './use-form-has-content'

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
  /** Where /profile/import returns to. The page builds this with the
   * proper step query so the user lands back on step 4 with the imported
   * data already populated. */
  importReturnTo: string
}

/**
 * Step 4 of 5 — Where you've been. Skippable but argued for.
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
export function StepPast({ defaults, action, importReturnTo }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const fe = state.fieldErrors ?? {}

  const hasImported = defaults.careerHistory.length > 0
  const initial = hasImported || defaults.skills.length > 0
  const { hasContent, onFormChange } = useFormHasContent(initial)
  const { submittingKind, onSaveClick, onSkipClick } = useSubmitterTracker(pending)

  return (
    <form action={formAction} className="space-y-5" onChange={onFormChange}>
      <LinkedInImportLink step={4} />
      {/* Resume import — primary path, big block at the top. */}
      <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Upload className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="font-semibold">
              {hasImported ? 'Resume imported' : 'Import from resume'}
            </p>
            <p className="text-sm text-muted-foreground">
              {hasImported
                ? `${defaults.careerHistory.length} role${defaults.careerHistory.length === 1 ? '' : 's'} added below. Edit anything that's off, then continue.`
                : 'PDF or DOCX. We extract employers, titles, and dates. You review every line before saving.'}
            </p>
            <div>
              <Button asChild variant={hasImported ? 'outline' : 'default'} size="sm">
                <Link href={importReturnTo}>
                  <Sparkles className="size-3.5 mr-1.5" />
                  {hasImported ? 'Re-import or replace' : 'Import from resume'}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

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
        <Button
          type="submit"
          onClick={onSaveClick}
          disabled={pending || !hasContent}
          className="sm:flex-1"
          title={hasContent ? undefined : 'Import a resume or add a role, or use Skip for now.'}
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

'use client'

import { FileText, Link2 } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { useActionState } from 'react'
import {
  type EducationEntryInput,
  EducationHistoryField,
} from '@/components/profile-history-fields'
import { Button } from '@/components/ui/button'
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
  const { submittingKind, onSaveClick, onSkipClick } = useSubmitterTracker(pending)

  return (
    <form action={formAction} className="space-y-5">
      <OnboardingImportOptions step={2} />
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

/**
 * Inline import prompt for Steps 2/3/4. A single import fills education,
 * current role, career history, and skills — so once a user accepts the
 * import, the steps that follow are pre-filled.
 *
 * `step` controls where the user lands after the import confirm step.
 */
export function OnboardingImportOptions({
  step,
  resumeRoleCount,
}: {
  step: 2 | 3 | 4
  resumeRoleCount?: number
}) {
  const returnTo = `/onboarding?step=${step}`
  const linkedinHref = onboardingImportHref(returnTo, 'linkedin')
  const resumeHref = onboardingImportHref(returnTo, 'resume')
  const hasImportedResume = typeof resumeRoleCount === 'number' && resumeRoleCount > 0

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
      <div className="flex items-start gap-2.5">
        <Link2 className="size-4 mt-0.5 text-primary" aria-hidden />
        <div className="min-w-0 flex-1 space-y-2.5">
          <p className="font-medium text-foreground">Want to fill this faster?</p>
          <p className="text-xs text-muted-foreground">
            Import once to pre-fill education, current role, career history, and skills. You review
            every field before anything is saved.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <ImportOption href={linkedinHref} icon={<Link2 className="size-3.5" aria-hidden />}>
              Import from LinkedIn
            </ImportOption>
            <ImportOption href={resumeHref} icon={<FileText className="size-3.5" aria-hidden />}>
              {hasImportedResume
                ? `Re-import resume/CV (${resumeRoleCount} role${resumeRoleCount === 1 ? '' : 's'})`
                : 'Upload resume/CV'}
            </ImportOption>
          </div>
        </div>
      </div>
    </div>
  )
}

function ImportOption({
  href,
  icon,
  children,
}: {
  href: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-md border border-primary/20 bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:border-primary/35 hover:bg-primary-tint"
    >
      {icon}
      {children}
    </Link>
  )
}

function onboardingImportHref(returnTo: string, source: 'linkedin' | 'resume') {
  return `/onboarding/import?source=${source}&return=${encodeURIComponent(returnTo)}`
}

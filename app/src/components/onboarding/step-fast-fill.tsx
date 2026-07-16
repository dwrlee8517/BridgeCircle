'use client'

import { FileText, Link2, LoaderCircle, Upload, X } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { useActionState, useRef, useState } from 'react'
import type { ImportStartState } from '@/app/onboarding/import/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
  skipAction: () => Promise<void>
  linkedInAction: (previous: ImportStartState, formData: FormData) => Promise<ImportStartState>
  resumeAction: (previous: ImportStartState, formData: FormData) => Promise<ImportStartState>
  linkedinRequestId: string
  resumeRequestId: string
  savedLinkedinUrl: string | null
  pendingProposalId: string | null
}

export function StepFastFill({
  skipAction,
  linkedInAction,
  resumeAction,
  linkedinRequestId,
  resumeRequestId,
  savedLinkedinUrl,
  pendingProposalId,
}: Props) {
  const [mode, setMode] = useState<'linkedin' | 'resume'>('linkedin')
  const [linkedInState, linkedInFormAction, linkedInPending] = useActionState(linkedInAction, {})
  const [resumeState, resumeFormAction, resumePending] = useActionState(resumeAction, {})
  const pending = linkedInPending || resumePending

  if (pendingProposalId) {
    return (
      <div className="space-y-4">
        <div className="rounded-[var(--radius-card-xl)] bg-surface-card-elevated p-6 shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary">
              <FileText className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">Your import is ready to review</p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                Nothing has been added to your profile yet. Choose what to keep, edit anything that
                needs context, then apply it once.
              </p>
            </div>
          </div>
          <Button asChild variant="cta" className="mt-5 w-full">
            <Link href={`/onboarding/import/${pendingProposalId}`}>Review imported details</Link>
          </Button>
        </div>
        <form action={skipAction}>
          <Button type="submit" variant="ghost" className="w-full">
            Continue without applying
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius-card-xl)] bg-surface-card-elevated p-6 shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)] sm:p-7">
        {mode === 'linkedin' ? (
          <form action={linkedInFormAction} className="space-y-4" aria-busy={linkedInPending}>
            <input type="hidden" name="clientRequestId" value={linkedinRequestId} />
            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn profile URL</Label>
              <div className="relative">
                <Link2
                  className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-text-faint"
                  aria-hidden
                />
                <Input
                  id="linkedinUrl"
                  name="linkedinUrl"
                  defaultValue={savedLinkedinUrl ?? ''}
                  placeholder="linkedin.com/in/yourname"
                  className="h-12 pl-10"
                  autoCapitalize="none"
                  autoCorrect="off"
                  disabled={pending}
                  required
                />
              </div>
            </div>
            {linkedInState.error ? <ErrorMessage>{linkedInState.error}</ErrorMessage> : null}
            <Button type="submit" variant="cta" size="lg" className="w-full" disabled={pending}>
              {linkedInPending ? (
                <LoaderCircle className="animate-spin" aria-hidden />
              ) : (
                <Link2 aria-hidden />
              )}
              {linkedInPending ? 'Looking up your profile…' : 'Import from LinkedIn'}
            </Button>
            {linkedInPending ? <LoadingNote /> : null}
            <button
              type="button"
              onClick={() => setMode('resume')}
              className="mx-auto flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-link outline-none hover:text-link-hover focus-visible:outline-2 focus-visible:outline-focus-ring"
            >
              <Upload className="size-4" aria-hidden />
              Or upload a résumé instead · PDF or Word
            </button>
          </form>
        ) : (
          <ResumeForm
            action={resumeFormAction}
            requestId={resumeRequestId}
            pending={resumePending}
            disabled={pending}
            error={resumeState.error}
            onBack={() => setMode('linkedin')}
          />
        )}
      </div>

      <div className="flex items-start gap-2 rounded-[var(--radius-box)] bg-surface-subtle px-4 py-3 text-xs leading-relaxed text-[var(--text-secondary)]">
        <span className="mt-0.5 text-primary" aria-hidden>
          ✓
        </span>
        <p>Nothing publishes automatically. You review every field before it joins your profile.</p>
      </div>

      <form action={skipAction}>
        <Button type="submit" variant="ghost" className="w-full" disabled={pending}>
          Skip this step
        </Button>
      </form>
    </div>
  )
}

function ResumeForm({
  action,
  requestId,
  pending,
  disabled,
  error,
  onBack,
}: {
  action: (formData: FormData) => void
  requestId: string
  pending: boolean
  disabled: boolean
  error?: string
  onBack: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  return (
    <form action={action} className="space-y-4" aria-busy={pending}>
      <input type="hidden" name="clientRequestId" value={requestId} />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">Upload a résumé</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            PDF or Word (.docx), up to 5 MB
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          disabled={disabled}
          className="flex size-10 items-center justify-center rounded-full text-text-secondary hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-focus-ring"
          aria-label="Use LinkedIn instead"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-[var(--radius-box)] border border-dashed border-border bg-surface-card px-5 text-center transition-colors hover:bg-surface-subtle focus-within:outline-2 focus-within:outline-focus-ring">
        <FileText className="size-7 text-primary" aria-hidden />
        <span className="mt-3 text-sm font-semibold text-foreground">
          {name || 'Choose a résumé from your computer'}
        </span>
        <span className="mt-1 text-xs text-[var(--text-secondary)]">
          We keep the source file private.
        </span>
        <input
          ref={inputRef}
          name="file"
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          required
          disabled={disabled}
          onChange={(event) => setName(event.target.files?.[0]?.name ?? '')}
        />
      </label>
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      <Button type="submit" variant="cta" size="lg" className="w-full" disabled={disabled || !name}>
        {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Upload aria-hidden />}
        {pending ? 'Reading your résumé…' : 'Upload résumé'}
      </Button>
      {pending ? <LoadingNote /> : null}
    </form>
  )
}

function LoadingNote() {
  return (
    <p role="status" className="text-center text-xs font-medium text-[var(--text-secondary)]">
      Usually a few seconds — nothing publishes without your review.
    </p>
  )
}

function ErrorMessage({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-[var(--radius-box)] bg-danger-tint px-3 py-2.5 text-sm text-state-danger"
    >
      {children}
    </p>
  )
}

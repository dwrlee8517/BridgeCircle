'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  type ApplyState,
  applyExtractedAction,
  type ExtractState,
  extractFromLinkedInAction,
  extractFromUploadAction,
} from './actions'
import { ConfirmStep, type CurrentProfile } from './confirm-step'

export type ImportSource = 'resume' | 'linkedin'

export type { CurrentProfile }

type Props = {
  current: CurrentProfile
  returnTo: string
  source: ImportSource
}

export function ImportFlow({ current, returnTo, source }: Props) {
  // Two server actions, two upload UIs — same ExtractState shape downstream,
  // so the ConfirmStep below doesn't have to know which source produced the
  // ExtractedProfile.
  const action = source === 'linkedin' ? extractFromLinkedInAction : extractFromUploadAction
  const [extractState, extractAction, extractPending] = useActionState<ExtractState, FormData>(
    action,
    {},
  )

  const [applyState, applyAction, applyPending] = useActionState<ApplyState, FormData>(
    applyExtractedAction,
    {},
  )

  const profile = extractState.profile ?? null

  if (!profile) {
    return source === 'linkedin' ? (
      <LinkedInStep
        action={extractAction}
        pending={extractPending}
        error={extractState.error}
        returnTo={returnTo}
        savedUrl={current.linkedinUrl}
      />
    ) : (
      <UploadStep
        action={extractAction}
        pending={extractPending}
        error={extractState.error}
        returnTo={returnTo}
      />
    )
  }

  return (
    <ConfirmStep
      profile={profile}
      current={current}
      action={applyAction}
      pending={applyPending}
      error={applyState.error}
      cancelHref={returnTo}
      hiddenFields={{ return: returnTo }}
      newBadgeLabel={source === 'linkedin' ? 'from LinkedIn' : 'from resume'}
    />
  )
}

function UploadStep({
  action,
  pending,
  error,
  returnTo,
}: {
  action: (formData: FormData) => void
  pending: boolean
  error?: string
  returnTo: string
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="file">Upload your resume</Label>
        <Input
          id="file"
          name="file"
          type="file"
          accept=".pdf,.docx,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png"
          required
          disabled={pending}
        />
        <p className="text-xs text-muted-foreground">
          PDF, DOCX, or PNG, up to 5MB. We&apos;ll extract your career history, education, and
          skills, then let you confirm before saving anything.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Extracting…' : 'Upload and extract'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={returnTo}>Cancel</Link>
        </Button>
      </div>

      {pending ? (
        <p className="text-xs text-muted-foreground">
          Reading your resume — this usually takes 5–15 seconds.
        </p>
      ) : null}
    </form>
  )
}

function LinkedInStep({
  action,
  pending,
  error,
  returnTo,
  savedUrl,
}: {
  action: (formData: FormData) => void
  pending: boolean
  error?: string
  returnTo: string
  savedUrl: string | null
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="linkedinUrl">Your LinkedIn URL</Label>
        <Input
          id="linkedinUrl"
          name="linkedinUrl"
          type="url"
          defaultValue={savedUrl ?? ''}
          placeholder="https://linkedin.com/in/your-username"
          required
          disabled={pending}
        />
        <p className="text-xs text-muted-foreground">
          We pull current role, career history, education, and skills, then let you confirm before
          anything is saved. Only your own URL — never anyone else&apos;s.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Importing…' : 'Import from LinkedIn'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={returnTo}>Cancel</Link>
        </Button>
      </div>

      {pending ? (
        <p className="text-xs text-muted-foreground">
          Looking up your profile — this usually takes 5–10 seconds.
        </p>
      ) : null}
    </form>
  )
}

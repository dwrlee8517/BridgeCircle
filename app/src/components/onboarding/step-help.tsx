'use client'

import { useActionState, useState } from 'react'
import { AvatarUploader } from '@/components/avatar-uploader'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { anyHasContent, useFormHasContent, useSubmitterTracker } from './use-form-has-content'

export type StepHelpState = {
  error?: string
  fieldErrors?: Record<string, string>
  skipped?: boolean
}

const initialState: StepHelpState = {}

type Props = {
  defaults: {
    avatarUrl: string
    bio: string
    openToMentor: boolean
    mentoringTopics: string
  }
  /** Used by AvatarUploader's fallback initial. */
  name: string
  action: (state: StepHelpState, formData: FormData) => Promise<StepHelpState>
}

/**
 * Step 5 of 5 — How you can help. Skippable.
 *
 * Last step holds: avatar upload (kept here per the spec to keep step 1
 * lightest), short bio, and the mentoring opt-in. Avatar uploads are
 * persisted *immediately* via uploadAvatarAction — independent of the
 * step's main submit — so the user's photo is saved even if they bail
 * before clicking Finish.
 *
 * openToMentor defaults to UNCHECKED. A brand-new alumnus shouldn't be
 * defaulted to "yes, mentor me right away" without explicit opt-in. The
 * helper-preferences page later lets them flip it on with full caps + a
 * caveat tour.
 *
 * The mentoringTopics input is dim/disabled when openToMentor is off,
 * since topics only make sense when you're actually open. Both still
 * submit; the action handles them either way.
 */
export function StepHelp({ defaults, name, action }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const fe = state.fieldErrors ?? {}
  const [openToMentor, setOpenToMentor] = useState(defaults.openToMentor)
  const initial =
    defaults.openToMentor ||
    anyHasContent(defaults.bio, defaults.mentoringTopics, defaults.avatarUrl)
  const { hasContent, onFormChange } = useFormHasContent(initial)
  const { submittingKind, onSaveClick, onSkipClick } = useSubmitterTracker(pending)

  return (
    <form action={formAction} className="space-y-6" onChange={onFormChange}>
      <div className="space-y-2">
        <Label className="text-sm">Profile photo</Label>
        <p className="text-xs text-muted-foreground">
          Optional, but adds warmth — most members include one.
        </p>
        <AvatarUploader initialAvatarUrl={defaults.avatarUrl || null} initialName={name} />
        {/* Hidden input mirrors the current avatar URL so the action can
            read it. The AvatarUploader has already saved the URL to
            base_profiles.avatar_url itself, so this is mostly belt-and-
            suspenders for the form-data path. */}
        <input type="hidden" name="avatarUrl" defaultValue={defaults.avatarUrl} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio" className="flex items-baseline gap-2">
          Short bio
          <span className="text-xs font-normal text-muted-foreground">Optional</span>
        </Label>
        <Textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={defaults.bio}
          placeholder="A few lines about who you are and what you're up to."
          maxLength={1000}
        />
        {fe.bio ? <p className="text-xs text-destructive">{fe.bio}</p> : null}
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="openToMentor"
            name="openToMentor"
            checked={openToMentor}
            onCheckedChange={(v) => setOpenToMentor(v === true)}
          />
          <div className="space-y-1">
            <Label htmlFor="openToMentor">I&rsquo;m open to mentoring fellow alumni</Label>
            <p className="text-xs text-muted-foreground">
              Members can ask you for advice or ongoing mentorship. You can pause or change this
              any time from Helper preferences.
            </p>
          </div>
        </div>

        <div className={`space-y-1.5 ${openToMentor ? '' : 'opacity-50'}`}>
          <Label
            htmlFor="mentoringTopics"
            className={openToMentor ? '' : 'pointer-events-none'}
          >
            Topics you can help with
          </Label>
          <Input
            id="mentoringTopics"
            name="mentoringTopics"
            defaultValue={defaults.mentoringTopics}
            placeholder="e.g. consulting, business school, returning to Korea"
            disabled={!openToMentor}
          />
          <p className="text-xs text-muted-foreground">
            Comma-separated. Helps mentees find you in search.
          </p>
          {fe.mentoringTopics ? (
            <p className="text-xs text-destructive">{fe.mentoringTopics}</p>
          ) : null}
        </div>
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <div className="flex flex-col gap-2 pt-2 sm:flex-row-reverse">
        <Button
          type="submit"
          onClick={onSaveClick}
          disabled={pending || !hasContent}
          className="sm:flex-1"
          title={hasContent ? undefined : 'Add a photo, bio, or opt in to mentoring; or use Skip for now.'}
        >
          {pending && submittingKind === 'save' ? 'Saving…' : 'Save and finish'}
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

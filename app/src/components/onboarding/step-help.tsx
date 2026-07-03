'use client'

import { useActionState, useState } from 'react'
import { AvatarUploader } from '@/components/avatar-uploader'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useSubmitterTracker } from './use-form-has-content'

export type StepHelpState = {
  error?: string
  fieldErrors?: Record<string, string>
  skipped?: boolean
}

const initialState: StepHelpState = {}

export type FreshnessPolicy = 'manual_only' | 'review_before_update' | 'auto_apply_and_notify'

type Props = {
  defaults: {
    avatarUrl: string
    bio: string
    openToMentor: boolean
    mentoringTopics: string
    freshnessPolicy: FreshnessPolicy
    /** True when the user has already imported from LinkedIn (a settings row
     * exists). The freshness consent UI tones down when no URL is on file —
     * the sweep can't act on it anyway, but we still record the preference
     * so it's there if they add a URL later. */
    hasLinkedinUrl: boolean
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
 * since topics only make sense when you're actually open.
 */
export function StepHelp({ defaults, name, action }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const fe = state.fieldErrors ?? {}
  const [openToMentor, setOpenToMentor] = useState(defaults.openToMentor)
  const [freshnessPolicy, setFreshnessPolicy] = useState<FreshnessPolicy>(defaults.freshnessPolicy)
  const { submittingKind, onSaveClick, onSkipClick } = useSubmitterTracker(pending)

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label className="text-sm">Profile photo</Label>
        <p className="text-xs text-muted-foreground">
          Optional, but adds warmth — most members include one.
        </p>
        <AvatarUploader initialAvatarUrl={defaults.avatarUrl || null} initialName={name} />
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
            <Label htmlFor="openToMentor">I&rsquo;m open to helping fellow alumni</Label>
            <p className="text-xs text-muted-foreground">
              Members can ask you a quick question or ask for ongoing help. You can pause or change
              this any time from Help settings.
            </p>
          </div>
        </div>

        <div className={`space-y-1.5 ${openToMentor ? '' : 'opacity-50'}`}>
          <Label htmlFor="mentoringTopics" className={openToMentor ? '' : 'pointer-events-none'}>
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
            Comma-separated. Helps members find you in search.
          </p>
          {fe.mentoringTopics ? (
            <p className="text-xs text-destructive">{fe.mentoringTopics}</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
        <div className="space-y-1">
          <Label className="text-sm">Keep my profile fresh</Label>
          <p className="text-xs text-muted-foreground">
            {defaults.hasLinkedinUrl
              ? 'How should we handle LinkedIn changes after you join?'
              : "If you add a LinkedIn URL later, here's how we'll handle updates."}
          </p>
        </div>
        {/* Hidden input mirrors the radio state so server actions receive the
            selected value via FormData. */}
        <input type="hidden" name="freshnessPolicy" value={freshnessPolicy} />
        <div className="space-y-2">
          <PolicyOption
            value="review_before_update"
            current={freshnessPolicy}
            onChange={setFreshnessPolicy}
            title="Email me proposed changes (recommended)"
            description="Once a month we check LinkedIn for updates and email you anything that changed. You confirm before it lands on your profile."
          />
          <PolicyOption
            value="auto_apply_and_notify"
            current={freshnessPolicy}
            onChange={setFreshnessPolicy}
            title="Apply automatically, then email me"
            description="High-confidence updates (new role, new title) apply without asking. We send a summary email with an Undo link."
          />
          <PolicyOption
            value="manual_only"
            current={freshnessPolicy}
            onChange={setFreshnessPolicy}
            title="Don't check automatically"
            description="No emails. You can still click Update from LinkedIn on your profile any time."
          />
        </div>
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <div className="flex flex-col gap-2 pt-2 sm:flex-row-reverse">
        <Button type="submit" onClick={onSaveClick} disabled={pending} className="sm:flex-1">
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

function PolicyOption({
  value,
  current,
  onChange,
  title,
  description,
}: {
  value: FreshnessPolicy
  current: FreshnessPolicy
  onChange: (v: FreshnessPolicy) => void
  title: string
  description: string
}) {
  const selected = current === value
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`w-full rounded-md border p-3 text-left transition ${
        selected
          ? 'border-foreground bg-background ring-2 ring-foreground/10'
          : 'border-muted-foreground/20 bg-background hover:border-foreground/30'
      }`}
      aria-pressed={selected}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={`mt-0.5 size-4 shrink-0 rounded-full border-2 ${
            selected ? 'border-foreground bg-foreground' : 'border-muted-foreground/40'
          }`}
        />
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </button>
  )
}

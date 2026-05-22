'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  effectiveTier,
  PRIVACY_DEFAULTS,
  type PrivacySection,
  type PrivacySettings,
  type PrivacyTier,
} from '@/lib/profile/privacy'
import { type PrivacyFormState, savePrivacySettingsAction } from './actions'

const SECTIONS: Array<{
  key: PrivacySection
  label: string
  description: string
}> = [
  {
    key: 'contact_links',
    label: 'Contact links',
    description: 'LinkedIn URL.',
  },
  {
    key: 'career_history',
    label: 'Career history',
    description: 'Past roles and employers beyond your current job.',
  },
  {
    key: 'education_history',
    label: 'Education history',
    description: 'Schools and degrees beyond your current/most-recent one.',
  },
  {
    key: 'bio',
    label: 'Bio & mentoring topics',
    description: "Your free-text bio and the mentoring topics you've listed.",
  },
  {
    key: 'skills',
    label: 'Skills',
    description: 'Skill tags imported from your resume.',
  },
]

const TIER_LABELS: Record<PrivacyTier, string> = {
  org: 'Org-visible',
  friends: 'Friends only',
  self: 'Only me',
}

const TIER_DESCRIPTIONS: Record<PrivacyTier, string> = {
  org: 'Any active member of your organization can see this.',
  friends: 'Only people you have accepted as friends.',
  self: "Hidden from everyone but you. You'll still see it on your own profile.",
}

export function PrivacyForm({ initial }: { initial: PrivacySettings }) {
  const [state, dispatch, pending] = useActionState<PrivacyFormState, FormData>(
    savePrivacySettingsAction,
    null,
  )

  return (
    <form action={dispatch} className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Directory fields (name, graduation year, city, employer, title, university, major) are
        always visible to your organization. Choose visibility for the rest.
      </p>

      <div className="space-y-4">
        {SECTIONS.map((s) => {
          const current = effectiveTier(initial, s.key)
          return (
            <div key={s.key} className="space-y-1.5 rounded-lg border p-3">
              <div className="flex items-baseline justify-between gap-3">
                <Label htmlFor={s.key} className="text-sm font-medium">
                  {s.label}
                </Label>
                <span className="text-xs text-muted-foreground">
                  Default: {TIER_LABELS[PRIVACY_DEFAULTS[s.key]]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{s.description}</p>
              <select
                id={s.key}
                name={s.key}
                defaultValue={current}
                className="w-full rounded-md border bg-background px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {(['org', 'friends', 'self'] as const).map((tier) => (
                  <option key={tier} value={tier}>
                    {TIER_LABELS[tier]} — {TIER_DESCRIPTIONS[tier]}
                  </option>
                ))}
              </select>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save privacy'}
        </Button>
        {state ? (
          <span className={`text-xs ${state.ok ? 'text-accent-sage' : 'text-destructive'}`}>
            {state.message}
          </span>
        ) : null}
      </div>
    </form>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { type SettingsFormState, saveMentorSettings } from './actions'

const initialState: SettingsFormState = {}

type Props = {
  defaults: {
    openToAdvice: boolean
    openToMentorship: boolean
    topics: string
    screeningPrompt: string
    maxActiveMentees: number
    maxPendingRequests: number
  }
  activeMenteeCount: number
  pendingRequestCount: number
}

export function SettingsForm({ defaults, activeMenteeCount, pendingRequestCount }: Props) {
  const router = useRouter()
  const [state, action, pending] = useActionState(saveMentorSettings, initialState)
  const fe = state.fieldErrors ?? {}

  // Client-side state drives the conditional caveat + dim of mentorship-only
  // fields. Both still submit normally via their input names.
  const [advice, setAdvice] = useState(defaults.openToAdvice)
  const [mentorship, setMentorship] = useState(defaults.openToMentorship)

  // After a successful save, force the server component to re-fetch so new
  // defaults arrive. revalidatePath() alone wasn't reliably refreshing the
  // page in dev — the form would show "Saved." but the checkbox visually
  // reverted to the pre-toggle state until the user navigated away and back.
  // router.refresh() explicitly invalidates the route's RSC cache.
  useEffect(() => {
    if (state.ok) router.refresh()
  }, [state.ok, router])

  // Sync controlled state when fresh server defaults arrive (post-save
  // revalidation). React's canonical "adjust state when a prop changes"
  // pattern — track the previous prop value via useState, compare during
  // render, and call setState during render when it differs. React
  // detects setState during render, bails out, and re-runs with the new
  // state. No useEffect, no rule suppression, no ref access in render.
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevAdviceDefault, setPrevAdviceDefault] = useState(defaults.openToAdvice)
  const [prevMentorshipDefault, setPrevMentorshipDefault] = useState(defaults.openToMentorship)
  if (
    prevAdviceDefault !== defaults.openToAdvice ||
    prevMentorshipDefault !== defaults.openToMentorship
  ) {
    setPrevAdviceDefault(defaults.openToAdvice)
    setPrevMentorshipDefault(defaults.openToMentorship)
    setAdvice(defaults.openToAdvice)
    setMentorship(defaults.openToMentorship)
  }

  return (
    <form action={action} className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-md border p-4">
          <Checkbox
            id="openToAdvice"
            name="openToAdvice"
            checked={advice}
            onCheckedChange={(v) => setAdvice(v === true)}
          />
          <div className="space-y-1">
            <Label htmlFor="openToAdvice" className="text-base">
              Open to one-off advice
            </Label>
            <p className="text-xs text-muted-foreground">
              Members can ask you a single question. Lower commitment, no caps.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-md border p-4">
          <Checkbox
            id="openToMentorship"
            name="openToMentorship"
            checked={mentorship}
            onCheckedChange={(v) => setMentorship(v === true)}
          />
          <div className="space-y-1">
            <Label htmlFor="openToMentorship" className="text-base">
              Open to ongoing mentorship
            </Label>
            <p className="text-xs text-muted-foreground">
              Members can request you as a mentor for an ongoing relationship. Subject to the caps
              below.
            </p>
          </div>
        </div>

        {/* Friendly caveat shown inline when mentorship is unchecked. Names
            the value to younger alumni, points at the caps as a way to keep
            it light, and ends on a soft "want to keep it on?" without
            blocking the user. Brand voice rule: warm, not pressuring. */}
        {!mentorship ? (
          <div className="rounded-md border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900">
            <p>
              Younger alumni often search specifically for someone open to ongoing mentorship —
              it&apos;s where the most lasting connections come from. If the worry is time, you can
              set the caps below as low as one active mentee and one pending request. Want to keep
              it on?
            </p>
          </div>
        ) : null}
      </div>

      {/* Mentorship-specific fields. They stay visible (so the user knows
          they exist) but dim and disable when mentorship is off — clearer
          than hiding because it shows the cap-as-alternative path. */}
      <fieldset
        disabled={!mentorship}
        className={`space-y-6 ${!mentorship ? 'opacity-50' : ''}`}
        aria-disabled={!mentorship}
      >
        <Field
          id="topics"
          label="Topics you can mentor on"
          hint="Comma-separated. Helps mentees find you in search."
          error={fe.topics}
        >
          <Input
            id="topics"
            name="topics"
            placeholder="e.g. consulting, business school, returning to Korea"
            defaultValue={defaults.topics}
          />
        </Field>

        <Field
          id="screeningPrompt"
          label="Screening question (optional)"
          hint="One sentence. Mentees answer before sending a request."
          error={fe.screeningPrompt}
        >
          <Textarea
            id="screeningPrompt"
            name="screeningPrompt"
            rows={2}
            maxLength={280}
            placeholder="e.g. What specifically are you hoping to get out of this conversation?"
            defaultValue={defaults.screeningPrompt}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="maxActiveMentees"
            label="Max active mentees"
            hint={`Currently ${activeMenteeCount} active.`}
            error={fe.maxActiveMentees}
          >
            <Input
              id="maxActiveMentees"
              name="maxActiveMentees"
              type="number"
              min={1}
              max={100}
              defaultValue={defaults.maxActiveMentees}
              required
            />
          </Field>
          <Field
            id="maxPendingRequests"
            label="Max pending requests"
            hint={`Currently ${pendingRequestCount} pending.`}
            error={fe.maxPendingRequests}
          >
            <Input
              id="maxPendingRequests"
              name="maxPendingRequests"
              type="number"
              min={1}
              max={100}
              defaultValue={defaults.maxPendingRequests}
              required
            />
          </Field>
        </div>
      </fieldset>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-emerald-600">Saved.</p> : null}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? 'Saving…' : 'Save settings'}
      </Button>
    </form>
  )
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

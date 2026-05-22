'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CapacityIndicatorGauge } from '@/components/ui/capacity-gauge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/ui/status-badge'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
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
  const [maxActiveMentees, setMaxActiveMentees] = useState(defaults.maxActiveMentees)
  const [maxPendingRequests, setMaxPendingRequests] = useState(defaults.maxPendingRequests)
  const [screeningPrompt, setScreeningPrompt] = useState(defaults.screeningPrompt)

  // After a successful save, force the server component to re-fetch so new
  // defaults arrive. revalidatePath() alone wasn't reliably refreshing the
  // page in dev — the form would show "Saved." but the checkbox visually
  // reverted to the pre-toggle state until the user navigated away and back.
  // router.refresh() explicitly invalidates the route's RSC cache.
  useEffect(() => {
    if (state.ok) router.refresh()
  }, [state.ok, router])

  // Sync controlled state when fresh server defaults arrive (post-save
  // revalidation).
  const [prevAdviceDefault, setPrevAdviceDefault] = useState(defaults.openToAdvice)
  const [prevMentorshipDefault, setPrevMentorshipDefault] = useState(defaults.openToMentorship)
  const [prevMaxActiveDefault, setPrevMaxActiveDefault] = useState(defaults.maxActiveMentees)
  const [prevMaxPendingDefault, setPrevMaxPendingDefault] = useState(defaults.maxPendingRequests)
  const [prevScreeningDefault, setPrevScreeningDefault] = useState(defaults.screeningPrompt)
  if (
    prevAdviceDefault !== defaults.openToAdvice ||
    prevMentorshipDefault !== defaults.openToMentorship ||
    prevMaxActiveDefault !== defaults.maxActiveMentees ||
    prevMaxPendingDefault !== defaults.maxPendingRequests ||
    prevScreeningDefault !== defaults.screeningPrompt
  ) {
    setPrevAdviceDefault(defaults.openToAdvice)
    setPrevMentorshipDefault(defaults.openToMentorship)
    setPrevMaxActiveDefault(defaults.maxActiveMentees)
    setPrevMaxPendingDefault(defaults.maxPendingRequests)
    setPrevScreeningDefault(defaults.screeningPrompt)
    setAdvice(defaults.openToAdvice)
    setMentorship(defaults.openToMentorship)
    setMaxActiveMentees(defaults.maxActiveMentees)
    setMaxPendingRequests(defaults.maxPendingRequests)
    setScreeningPrompt(defaults.screeningPrompt)
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
          <div className="rounded-md border border-accent-ochre/25 bg-accent-ochre/10 p-3 text-xs text-foreground">
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
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8">
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
              value={screeningPrompt}
              onChange={(e) => setScreeningPrompt(e.target.value)}
            />
          </Field>

          <div className="space-y-5">
            <Field
              id="maxActiveMentees"
              label="Max active mentees"
              hint={`Currently ${activeMenteeCount} active.`}
              error={fe.maxActiveMentees}
            >
              <div className="flex items-center gap-4">
                <input
                  id="maxActiveMentees"
                  name="maxActiveMentees"
                  type="range"
                  min={1}
                  max={20}
                  onChange={(e) => setMaxActiveMentees(parseInt(e.target.value, 10))}
                  className="flex-1 accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
                  required
                />
                <span className="font-mono text-xs text-primary min-w-[75px] text-right font-semibold">
                  {maxActiveMentees} {maxActiveMentees === 1 ? 'mentee' : 'mentees'}
                </span>
              </div>
            </Field>

            <Field
              id="maxPendingRequests"
              label="Max pending requests"
              hint={`Currently ${pendingRequestCount} pending.`}
              error={fe.maxPendingRequests}
            >
              <div className="flex items-center gap-4">
                <input
                  id="maxPendingRequests"
                  name="maxPendingRequests"
                  type="range"
                  min={1}
                  max={30}
                  value={maxPendingRequests}
                  onChange={(e) => setMaxPendingRequests(parseInt(e.target.value, 10))}
                  className="flex-1 accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
                  required
                />
                <span className="font-mono text-xs text-primary min-w-[75px] text-right font-semibold">
                  {maxPendingRequests} {maxPendingRequests === 1 ? 'request' : 'requests'}
                </span>
              </div>
            </Field>
          </div>
        </fieldset>

        {/* Live Card Preview */}
        <div
          className={cn(
            'flex flex-col gap-3 justify-start lg:pt-1 transition-opacity duration-300',
            !mentorship && 'opacity-30 select-none pointer-events-none',
          )}
        >
          <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
            Live Card Preview
          </span>
          <div className="rounded-[6px] border border-border bg-card p-5 flex flex-col gap-4 shadow-sm max-w-sm">
            <div className="flex gap-3.5 items-center">
              <div className="relative size-11 shrink-0 overflow-hidden rounded-[6px] bg-foreground text-background flex items-center justify-center font-heading text-base font-bold">
                PV
              </div>
              <div className="min-w-0">
                <h4 className="font-heading text-sm font-semibold text-foreground">
                  Your Profile (Preview)
                </h4>
                <StatusBadge tone="open" dot size="sm" className="mt-0.5">
                  Open to Mentor
                </StatusBadge>
              </div>
            </div>

            <CapacityIndicatorGauge
              activeCount={activeMenteeCount}
              maxActive={maxActiveMentees}
              pendingCount={pendingRequestCount}
              maxPending={maxPendingRequests}
            />

            {screeningPrompt ? (
              <div className="text-[10px] text-muted-foreground font-mono mt-1 leading-relaxed border-t border-border/40 pt-3">
                <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">
                  Screening Question
                </span>
                &ldquo;{screeningPrompt}&rdquo;
              </div>
            ) : null}

            <Button
              type="button"
              disabled
              variant="outline"
              size="sm"
              className="mt-1 w-full text-xs"
            >
              Request Mentorship
            </Button>
          </div>
        </div>
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-accent-sage">Saved.</p> : null}

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

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
const ACTIVE_MENTEE_OPTIONS = [1, 2, 3, 5, 10, 20] as const
const PENDING_REQUEST_OPTIONS = [1, 3, 5, 10, 20, 30] as const

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

  const [advice, setAdvice] = useState(defaults.openToAdvice)
  const [mentorship, setMentorship] = useState(defaults.openToMentorship)
  const [maxActiveMentees, setMaxActiveMentees] = useState(defaults.maxActiveMentees)
  const [maxPendingRequests, setMaxPendingRequests] = useState(defaults.maxPendingRequests)
  const [screeningPrompt, setScreeningPrompt] = useState(defaults.screeningPrompt)

  useEffect(() => {
    if (state.ok) router.refresh()
  }, [state.ok, router])

  return (
    <form action={action} className="space-y-5">
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
        <SettingRow
          title="One-off advice"
          description="Members can ask you a single question. Lower commitment, no caps."
          control={
            <Checkbox
              id="openToAdvice"
              name="openToAdvice"
              checked={advice}
              onCheckedChange={(value) => setAdvice(value === true)}
              aria-label="Open to one-off advice"
            />
          }
        />

        <SettingRow
          title="Ongoing mentorship"
          description="Members can request a longer-running relationship, bounded by the caps below."
          control={
            <Checkbox
              id="openToMentorship"
              name="openToMentorship"
              checked={mentorship}
              onCheckedChange={(value) => setMentorship(value === true)}
              aria-label="Open to ongoing mentorship"
            />
          }
        />

        {!mentorship ? (
          <div className="border-b border-border bg-warning-tint px-5 py-4 text-sm leading-6 text-foreground">
            Younger alumni often search specifically for ongoing mentorship. If time is the worry,
            keep mentorship on and set the caps as low as one active mentee and one pending request.
          </div>
        ) : null}

        <SettingRow
          title="Mentoring topics"
          description="Comma-separated topics help mentees find you in search."
          disabled={!mentorship}
          control={
            <div className="w-full min-w-0 sm:max-w-md">
              <Input
                id="topics"
                name="topics"
                placeholder="consulting, business school, returning to Korea"
                defaultValue={defaults.topics}
                disabled={!mentorship}
                aria-invalid={!!fe.topics}
              />
              <FieldError error={fe.topics} />
            </div>
          }
        />

        <SettingRow
          title="Screening question"
          description="Optional. Mentees answer this before sending a request."
          disabled={!mentorship}
          align="start"
          control={
            <div className="w-full min-w-0 sm:max-w-md">
              <Textarea
                id="screeningPrompt"
                name="screeningPrompt"
                rows={2}
                maxLength={280}
                placeholder="What specifically are you hoping to get out of this conversation?"
                value={screeningPrompt}
                onChange={(event) => setScreeningPrompt(event.target.value)}
                disabled={!mentorship}
                aria-invalid={!!fe.screeningPrompt}
              />
              <FieldError error={fe.screeningPrompt} />
            </div>
          }
        />

        <SettingRow
          title="Active mentee capacity"
          description={`Currently ${activeMenteeCount} active.`}
          disabled={!mentorship}
          control={
            <CapacityChoices
              name="maxActiveMentees"
              value={maxActiveMentees}
              options={withCurrent(ACTIVE_MENTEE_OPTIONS, maxActiveMentees)}
              unit="mentees"
              disabled={!mentorship}
              onChange={setMaxActiveMentees}
            />
          }
        />

        <SettingRow
          title="Pending request cap"
          description={`Currently ${pendingRequestCount} pending.`}
          disabled={!mentorship}
          control={
            <CapacityChoices
              name="maxPendingRequests"
              value={maxPendingRequests}
              options={withCurrent(PENDING_REQUEST_OPTIONS, maxPendingRequests)}
              unit="requests"
              disabled={!mentorship}
              onChange={setMaxPendingRequests}
            />
          }
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="rounded-lg border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Current availability
              </p>
              <h2 className="mt-1 font-heading text-lg font-semibold text-foreground">
                Your helper card
              </h2>
            </div>
            <StatusBadge tone={mentorship || advice ? 'open' : 'muted'} dot>
              {mentorship || advice ? 'Visible' : 'Off'}
            </StatusBadge>
          </div>
          <div className="mt-5">
            <CapacityIndicatorGauge
              activeCount={activeMenteeCount}
              maxActive={maxActiveMentees}
              pendingCount={pendingRequestCount}
              maxPending={maxPendingRequests}
            />
          </div>
          {screeningPrompt ? (
            <div className="mt-4 border-t border-border pt-4">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Screening question
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                &ldquo;{screeningPrompt}&rdquo;
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col justify-end gap-3">
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          {state.ok ? <p className="text-sm text-accent-sage">Saved.</p> : null}
          <Button type="submit" variant="cta" disabled={pending} className="w-full">
            {pending ? 'Saving...' : 'Save settings'}
          </Button>
        </div>
      </div>
    </form>
  )
}

function SettingRow({
  title,
  description,
  control,
  disabled = false,
  align = 'center',
}: {
  title: string
  description: string
  control: React.ReactNode
  disabled?: boolean
  align?: 'center' | 'start'
}) {
  return (
    <div
      className={cn(
        'grid gap-4 border-b border-border px-5 py-5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(220px,auto)]',
        align === 'start' ? 'sm:items-start' : 'sm:items-center',
        disabled && 'bg-surface-panel/45 text-muted-foreground',
      )}
    >
      <div>
        <Label className="text-base font-semibold text-foreground">{title}</Label>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="flex justify-start sm:justify-end">{control}</div>
    </div>
  )
}

function CapacityChoices({
  name,
  value,
  options,
  unit,
  disabled,
  onChange,
}: {
  name: string
  value: number
  options: number[]
  unit: string
  disabled: boolean
  onChange: (value: number) => void
}) {
  return (
    <div className="w-full sm:w-auto">
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={unit}>
        {options.map((option) => {
          const active = option === value
          return (
            <label
              key={option}
              className={cn(
                'bc-motion-control inline-flex h-9 cursor-pointer items-center rounded-sm border px-3 font-mono text-xs font-semibold has-disabled:cursor-not-allowed has-disabled:opacity-45',
                active
                  ? 'border-primary bg-primary-tint text-primary'
                  : 'border-border bg-card text-muted-foreground hover:bg-surface-subtle hover:text-foreground',
              )}
            >
              <input
                type="radio"
                name={name}
                value={option}
                checked={active}
                disabled={disabled}
                onChange={() => onChange(option)}
                className="sr-only"
              />
              <span
                className={cn(
                  'inline-flex items-center',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {option}
              </span>
            </label>
          )
        })}
      </div>
      <p className="mt-2 text-right text-xs text-muted-foreground">
        {value} {value === 1 ? unit.replace(/s$/, '') : unit}
      </p>
    </div>
  )
}

function FieldError({ error }: { error?: string }) {
  return error ? <p className="mt-1.5 text-xs text-destructive">{error}</p> : null
}

function withCurrent(options: readonly number[], current: number): number[] {
  return Array.from(new Set([...options, current])).sort((a, b) => a - b)
}

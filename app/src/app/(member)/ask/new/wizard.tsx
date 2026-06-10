'use client'

import { AlertCircle, Check } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CapacityIndicatorGauge } from '@/components/ui/capacity-gauge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { AskGenre, AskType, DraftVariant } from '@/lib/asks/schemas'
import type { SignalCandidate } from '@/lib/asks/signals'
import { cn } from '@/lib/utils'
import { type RequestFormState, submitRequest } from './actions'

const GENRE_OPTIONS: Array<{ id: AskGenre; label: string; hint: string }> = [
  { id: 'career-path', label: 'Career path', hint: "A path you're considering" },
  { id: 'industry-intro', label: 'Industry intro', hint: 'What this space is actually like' },
  { id: 'decision-review', label: 'Decision review', hint: "A specific call you're weighing" },
  { id: 'school-advice', label: 'School / academics', hint: 'Schools, applications, courses' },
  { id: 'skill-question', label: 'Skill question', hint: 'A narrow, answerable thing' },
  { id: 'other', label: 'Something else', hint: 'Open-ended' },
]

type Step = 'path' | 'context' | 'genre' | 'signals' | 'compose'

type Props = {
  helperId: string
  helperName: string
  askType: AskType
  skipHref: string
  cancelHref: string
  initialContext?: string
  /** Pre-derived server-side. Empty array → wizard skips the signals step. */
  signalCandidates: SignalCandidate[]
  // Capacity Props for protected wizard checking
  activeMenteeCount?: number
  maxActiveMentees?: number
  pendingRequestCount?: number
  maxPendingRequests?: number
  mentorshipAtCapacity?: boolean
}

const initialFormState: RequestFormState = {}

export function Wizard({
  helperId,
  helperName,
  askType,
  skipHref,
  cancelHref,
  initialContext = '',
  signalCandidates,
  activeMenteeCount = 0,
  maxActiveMentees = 5,
  pendingRequestCount = 0,
  maxPendingRequests = 10,
  mentorshipAtCapacity = false,
}: Props) {
  const [currentAskType, setCurrentAskType] = useState<AskType>(askType)

  // Start on 'path' if mentorship is requested but helper is at capacity,
  // allowing them to view limits and switch to advice immediately.
  // Otherwise, default straight to 'context' to save clicks, but let them go back to 'path'.
  const [step, setStep] = useState<Step>(() => {
    if (askType === 'mentorship' && mentorshipAtCapacity) {
      return 'path'
    }
    return 'context'
  })

  const [context, setContext] = useState(initialContext)
  const [genre, setGenre] = useState<AskGenre | null>(null)

  // Signals start active — the model picked them; the asker can drop any.
  const [activeSignalIds, setActiveSignalIds] = useState<Set<string>>(
    () => new Set(signalCandidates.map((s) => s.id)),
  )

  const [helpNeeded, setHelpNeeded] = useState('')
  const [reason, setReason] = useState('')
  const [drafting, setDrafting] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [hasAutoDrafted, setHasAutoDrafted] = useState(false)

  const hasSignals = signalCandidates.length > 0
  const helperFirstName = helperName.split(' ')[0] || helperName

  // Member-facing step labels; internal step ids are unchanged.
  const steps: { id: Step; label: string }[] = [
    { id: 'path', label: 'Help type' },
    { id: 'context', label: 'Your situation' },
    { id: 'genre', label: 'Question type' },
    ...(hasSignals ? [{ id: 'signals' as Step, label: "What we'll mention" }] : []),
    { id: 'compose', label: 'Draft' },
  ]

  const currentStepIndex = steps.findIndex((s) => s.id === step)

  function toggleSignal(id: string) {
    setActiveSignalIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function activeSignalTexts(): string[] {
    return signalCandidates.filter((c) => activeSignalIds.has(c.id)).map((c) => c.promptText)
  }

  const [formState, formAction, pending] = useActionState(submitRequest, initialFormState)
  const fe = formState.fieldErrors ?? {}

  async function fetchDraft(opts: { variant?: DraftVariant | null } = {}) {
    setDrafting(true)
    setDraftError(null)
    try {
      const res = await fetch('/api/asks/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helperId,
          askType: currentAskType,
          context,
          genre,
          signals: activeSignalTexts(),
          userText: opts.variant ? [reason, helpNeeded].filter(Boolean).join('\n\n') : '',
          variant: opts.variant ?? null,
        }),
      })
      if (!res.ok) {
        let suffix = ''
        if (process.env.NODE_ENV !== 'production') {
          try {
            const err = (await res.json()) as { error?: string; detail?: string }
            if (err?.error) suffix = ` [${err.error}]`
            if (err?.detail) console.error('[wizard] draft failed', err)
          } catch {
            // ignore non-JSON
          }
        }
        setDraftError(
          `Couldn't generate a draft right now${suffix} — try again, or write it manually.`,
        )
        return
      }
      const data = (await res.json()) as { helpNeeded: string; reason: string | null }
      setHelpNeeded(data.helpNeeded)
      if (currentAskType === 'mentorship' && data.reason) {
        setReason(data.reason)
      } else {
        setReason('')
      }
    } catch {
      setDraftError("Couldn't reach the drafting service. Try again, or write it manually.")
    } finally {
      setDrafting(false)
    }
  }

  function goAfterGenre() {
    if (hasSignals) {
      setStep('signals')
    } else {
      goToCompose()
    }
  }

  function goToCompose() {
    setStep('compose')
    if (!hasAutoDrafted) {
      setHasAutoDrafted(true)
      void fetchDraft()
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetchDraft relies on dynamic states, but we only want to auto-refresh when the selected path switches
  useEffect(() => {
    if (step === 'compose' && hasAutoDrafted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchDraft()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAskType, step, hasAutoDrafted])

  return (
    <div className="space-y-6">
      {/* Steps progress bar — completed steps render filled with a check */}
      <div className="flex border border-border bg-muted/20 rounded-md p-2 justify-between text-xs select-none overflow-x-auto whitespace-nowrap scrollbar-none">
        {steps.map((s, idx) => {
          const isActive = s.id === step
          const isCompleted = currentStepIndex > idx
          return (
            <div key={s.id} className="flex items-center gap-1.5 shrink-0">
              <span
                className={cn(
                  'size-5 rounded-full border flex items-center justify-center text-xs',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground font-semibold'
                    : isCompleted
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground',
                )}
              >
                {isCompleted ? <Check className="size-3" aria-hidden /> : idx + 1}
              </span>
              <span
                className={cn(
                  'font-medium',
                  isActive
                    ? 'text-foreground font-semibold'
                    : isCompleted
                      ? 'text-foreground'
                      : 'text-muted-foreground',
                )}
              >
                {s.label}
              </span>
              {idx < steps.length - 1 && <span className="text-border px-1">/</span>}
            </div>
          )
        })}
      </div>

      {step === 'path' ? (
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">What kind of help?</h2>
            <p className="text-sm text-muted-foreground">
              {`Quick advice is one exchange. Mentorship is ongoing — and depends on ${helperFirstName}'s availability.`}
            </p>
          </div>

          <div className="grid gap-3">
            {/* Quick Advice Path */}
            <button
              type="button"
              onClick={() => setCurrentAskType('advice')}
              aria-pressed={currentAskType === 'advice'}
              className={cn(
                'border rounded-lg p-4 text-left transition-colors w-full flex flex-col gap-1.5 outline-none focus-visible:border-focus-ring focus-visible:ring-4 focus-visible:ring-focus-ring-muted',
                currentAskType === 'advice'
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:bg-accent',
              )}
            >
              <div className="flex justify-between w-full items-baseline">
                <span className="font-semibold text-sm text-foreground">Ask for quick advice</span>
                {currentAskType === 'advice' ? (
                  <Check className="size-4 text-primary" aria-hidden />
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground leading-normal">
                Best for a quick coffee chat, resume review, single question, or one-off design
                critique.
              </p>
            </button>

            {/* Mentorship Path */}
            <button
              type="button"
              disabled={mentorshipAtCapacity}
              onClick={() => {
                if (!mentorshipAtCapacity) {
                  setCurrentAskType('mentorship')
                }
              }}
              aria-pressed={currentAskType === 'mentorship' && !mentorshipAtCapacity}
              className={cn(
                'border rounded-lg p-4 text-left transition-colors w-full flex flex-col gap-2.5 relative text-left',
                !mentorshipAtCapacity
                  ? 'cursor-pointer outline-none focus-visible:border-focus-ring focus-visible:ring-4 focus-visible:ring-focus-ring-muted'
                  : 'opacity-75 cursor-not-allowed',
                currentAskType === 'mentorship' && !mentorshipAtCapacity
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:bg-accent/40',
              )}
            >
              <div className="flex justify-between w-full items-baseline">
                <span className="font-semibold text-sm text-foreground">
                  Request ongoing mentorship
                </span>
                {currentAskType === 'mentorship' && !mentorshipAtCapacity ? (
                  <Check className="size-4 text-primary" aria-hidden />
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground leading-normal">
                Best for recurring sessions, long-term goals, project sponsorship, or milestone
                tracking.
              </p>

              {/* Bandwidth Capacity Details */}
              <div className="border-t border-border pt-3 mt-1.5 w-full space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground block">
                  Availability
                </span>
                <CapacityIndicatorGauge
                  activeCount={activeMenteeCount}
                  maxActive={maxActiveMentees}
                  pendingCount={pendingRequestCount}
                  maxPending={maxPendingRequests}
                  isCompact={false}
                  className="bg-background/80"
                />
                {mentorshipAtCapacity && (
                  <div className="flex gap-1.5 items-center text-foreground text-xs mt-2 bg-warning-tint p-2 rounded border border-accent-ochre/20">
                    <AlertCircle className="size-3.5 shrink-0 text-accent-ochre" />
                    <span>
                      {`${helperFirstName} is at capacity for mentorship right now — quick advice is still open.`}
                    </span>
                  </div>
                )}
              </div>
            </button>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              onClick={() => setStep('context')}
              disabled={currentAskType === 'mentorship' && mentorshipAtCapacity}
            >
              Add your context
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href={cancelHref}>Cancel</Link>
            </Button>
          </div>
        </div>
      ) : null}

      {step === 'context' ? (
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">What are you working on?</h2>
            <p className="text-sm text-muted-foreground">
              {`A sentence or two. We'll use this to draft a note to ${helperFirstName}.`}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="context" className="sr-only">
              What you&apos;re working on
            </Label>
            <Textarea
              id="context"
              rows={4}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. Trying to decide between staying at my consulting firm and joining a Series B product team."
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => setStep('genre')}
                disabled={context.trim().length < 5}
              >
                Continue
              </Button>
              <Button type="button" variant="outline" onClick={() => setStep('path')}>
                Back
              </Button>
            </div>
            <Link
              href={skipHref}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              I know what to say →
            </Link>
          </div>
        </div>
      ) : null}

      {step === 'genre' ? (
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">What kind of question is this?</h2>
            <p className="text-sm text-muted-foreground">
              {`Helps ${helperFirstName} know what you're hoping for.`}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {GENRE_OPTIONS.map((g) => {
              const active = genre === g.id
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGenre(g.id)}
                  aria-pressed={active}
                  className={cn(
                    'rounded-lg border p-3 text-left transition outline-none focus-visible:border-focus-ring focus-visible:ring-4 focus-visible:ring-focus-ring-muted',
                    active
                      ? 'border-primary bg-primary/5 font-medium'
                      : 'border-border bg-background hover:bg-accent',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{g.label}</span>
                    {active ? <Check className="size-4 shrink-0 text-primary" aria-hidden /> : null}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{g.hint}</div>
                </button>
              )
            })}
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" onClick={goAfterGenre} disabled={!genre}>
              {hasSignals ? 'Continue' : 'Draft my note'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setStep('context')}>
              Back
            </Button>
          </div>
        </div>
      ) : null}

      {step === 'signals' ? (
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">What we noticed about {helperFirstName}</h2>
            <p className="text-sm text-muted-foreground">
              We&apos;ll mention these in the draft. Remove any you&apos;d rather not.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {signalCandidates.map((s) => {
              const active = activeSignalIds.has(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSignal(s.id)}
                  aria-pressed={active}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm transition outline-none focus-visible:border-focus-ring focus-visible:ring-4 focus-visible:ring-focus-ring-muted',
                    active
                      ? 'border-primary bg-primary/10 text-foreground font-medium'
                      : 'border-border bg-background text-muted-foreground line-through hover:bg-accent',
                  )}
                >
                  {s.label}
                </button>
              )
            })}
          </div>
          {activeSignalIds.size === 0 ? (
            <p className="text-xs text-muted-foreground">
              {`Nothing selected — the draft will lean on your situation and ${helperFirstName}'s profile only.`}
            </p>
          ) : null}
          <div className="flex gap-2 pt-2">
            <Button type="button" onClick={goToCompose}>
              Draft my note
            </Button>
            <Button type="button" variant="outline" onClick={() => setStep('genre')}>
              Back
            </Button>
          </div>
        </div>
      ) : null}

      {step === 'compose' ? (
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="helperId" value={helperId} />
          <input type="hidden" name="askType" value={currentAskType} />

          <div className="space-y-1">
            <h2 className="text-lg font-semibold">
              {drafting && !helpNeeded ? 'Drafting your note…' : 'Here’s a starting draft'}
            </h2>
            <p className="text-sm text-muted-foreground">
              Edit anything. Refinement options below.
            </p>
          </div>

          {currentAskType === 'mentorship' ? (
            <div className="space-y-2">
              <Label htmlFor="reason">
                Why you&apos;d like {helperFirstName} specifically{' '}
                <span className="text-xs text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="reason"
                name="reason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              {fe.reason ? <p className="text-xs text-destructive">{fe.reason}</p> : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="helpNeeded">
              {currentAskType === 'advice' ? 'Your question' : "What you're hoping to explore"}{' '}
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="helpNeeded"
              name="helpNeeded"
              rows={currentAskType === 'advice' ? 4 : 5}
              required
              value={helpNeeded}
              onChange={(e) => setHelpNeeded(e.target.value)}
              placeholder={drafting ? 'Drafting…' : ''}
            />
            {fe.helpNeeded ? <p className="text-xs text-destructive">{fe.helpNeeded}</p> : null}
          </div>

          {helpNeeded.length > 0 ? (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground border-y py-1.5">
              <span className="font-semibold">Refine draft:</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={drafting}
                onClick={() => fetchDraft({ variant: 'shorter' })}
                className="h-6 px-2 text-[11px]"
              >
                Shorter
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={drafting}
                onClick={() => fetchDraft({ variant: 'more-direct' })}
                className="h-6 px-2 text-[11px]"
              >
                More direct
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={drafting}
                onClick={() => fetchDraft({ variant: 'warmer' })}
                className="h-6 px-2 text-[11px]"
              >
                Warmer
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={drafting}
                onClick={() => fetchDraft()}
                className="h-6 px-2 text-[11px]"
              >
                {drafting ? 'Drafting…' : 'Regenerate'}
              </Button>
            </div>
          ) : null}

          {draftError ? <p className="text-xs text-destructive">{draftError}</p> : null}
          {formState.error ? <p className="text-sm text-destructive">{formState.error}</p> : null}

          <div className="flex gap-2 pt-2">
            <Button type="submit" variant="cta" disabled={pending || drafting}>
              {pending ? 'Sending…' : currentAskType === 'advice' ? 'Send' : 'Send request'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(hasSignals ? 'signals' : 'genre')}
            >
              Back
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  )
}

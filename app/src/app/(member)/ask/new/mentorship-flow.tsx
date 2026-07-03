'use client'

import { AlertCircle, Check } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  type AskCommitment,
  COMMITMENT_OPTIONS,
  commitmentLabel,
  SCREENING_ANSWER_MAX_LENGTH,
} from '@/lib/asks/schemas'
import type { SignalCandidate } from '@/lib/asks/signals'
import { cn } from '@/lib/utils'
import { type RequestFormState, submitRequest } from './actions'
import { CoachLine, FlowCharCount, FlowSteps, ToneRow, useDraft } from './flow-ui'

const OWN_WORDS_MAX = 280
const GOAL_MAX = 600

type Step = 'why' | 'explore' | 'pace' | 'screening' | 'draft'

/**
 * The mentorship composer: why them (evidence, not flattery) → what to
 * explore (a goal, not a question) → pace (the expectations contract) →
 * the mentor's screening question when they set one → the assembled,
 * editable request.
 *
 * Every step's answer surfaces again on the draft step as a labeled piece
 * with its own edit affordance, and the pace + screening answer travel to
 * the mentor's review screen — honest expectations on both sides.
 */
export function MentorshipFlow({
  helperId,
  helperFirstName,
  cancelHref,
  adviceHref,
  adviceOpen,
  signalCandidates,
  screeningPrompt,
  activeMenteeCount,
  maxActiveMentees,
  mentorshipAtCapacity,
  initialGoal = '',
}: {
  helperId: string
  helperFirstName: string
  cancelHref: string
  /** Same composer pointed at advice — the soft landing when at capacity. */
  adviceHref: string
  adviceOpen: boolean
  signalCandidates: SignalCandidate[]
  screeningPrompt: string | null
  activeMenteeCount: number
  maxActiveMentees: number
  mentorshipAtCapacity: boolean
  initialGoal?: string
}) {
  const hasScreening = !!screeningPrompt?.trim()
  const stepOrder: Step[] = hasScreening
    ? ['why', 'explore', 'pace', 'screening', 'draft']
    : ['why', 'explore', 'pace', 'draft']
  const stepLabels = stepOrder.map((s) => STEP_LABELS[s].replace('{name}', helperFirstName))

  const [step, setStep] = useState<Step>('why')
  const [selectedEvidence, setSelectedEvidence] = useState<Set<string>>(() => new Set())
  const [ownWords, setOwnWords] = useState('')
  const [goal, setGoal] = useState(initialGoal.slice(0, GOAL_MAX))
  const [pace, setPace] = useState<AskCommitment | null>(null)
  const [screeningAnswer, setScreeningAnswer] = useState('')
  const [lastDraftKey, setLastDraftKey] = useState<string | null>(null)

  const draft = useDraft({ helperId, askType: 'mentorship' })
  const [formState, formAction, pending] = useActionState(submitRequest, initialFormState)

  const currentIndex = stepOrder.indexOf(step)

  function toggleEvidence(id: string) {
    setSelectedEvidence((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function draftSignals(): string[] {
    return [
      ...signalCandidates.filter((c) => selectedEvidence.has(c.id)).map((c) => c.promptText),
      ...(ownWords.trim()
        ? [
            `In the asker's own words, why this helper: "${ownWords.trim()}". This is the heart of the "why you" — keep its substance.`,
          ]
        : []),
    ]
  }

  function goToDraft() {
    setStep('draft')
    const key = JSON.stringify([[...selectedEvidence].sort(), ownWords.trim(), goal.trim(), pace])
    if (key !== lastDraftKey) {
      setLastDraftKey(key)
      void draft.fetchDraft({ context: goal, signals: draftSignals(), commitment: pace })
    }
  }

  function back() {
    setStep(stepOrder[Math.max(0, currentIndex - 1)])
  }

  // At capacity: don't walk someone through five steps toward a bounce.
  // Name it plainly and hold the advice door open.
  if (mentorshipAtCapacity) {
    return (
      <div className="space-y-4 rounded-md border border-accent-ochre/25 bg-warning-tint p-4">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-accent-ochre" aria-hidden />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {`${helperFirstName} is at capacity for ongoing help right now`}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {`Their ongoing spots are full. ${
                adviceOpen
                  ? 'A quick question is still open — one question, no ongoing commitment.'
                  : 'Check back in a few weeks, or look for someone else on the same path.'
              }`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {adviceOpen ? (
            <Button asChild>
              <Link href={adviceHref}>Ask a quick question instead</Link>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href={cancelHref}>Cancel</Link>
          </Button>
        </div>
      </div>
    )
  }

  const openSpots = Math.max(0, maxActiveMentees - activeMenteeCount)

  return (
    <div className="space-y-5">
      <FlowSteps labels={stepLabels} currentIndex={currentIndex} />

      {step === 'why' ? (
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">
              {`Why ${helperFirstName}, specifically?`}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Pick what&rsquo;s true. This becomes the heart of your request — it&rsquo;s what makes
              it feel chosen, not broadcast.
            </p>
          </div>

          {signalCandidates.length > 0 ? (
            <div className="grid gap-2">
              {signalCandidates.map((s) => {
                const active = selectedEvidence.has(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleEvidence(s.id)}
                    aria-pressed={active}
                    className={cn(
                      'rounded-lg border p-3 text-left outline-none transition-colors focus-visible:border-focus-ring focus-visible:ring-4 focus-visible:ring-focus-ring-muted',
                      active
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border bg-background hover:bg-accent',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">{s.label}</span>
                      {active ? (
                        <Check className="size-4 shrink-0 text-primary" aria-hidden />
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {evidenceSource(s.kind, helperFirstName)}
                    </p>
                  </button>
                )
              })}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="ownWords" className="sr-only">
              In your own words
            </Label>
            <Textarea
              id="ownWords"
              rows={2}
              maxLength={OWN_WORDS_MAX}
              value={ownWords}
              onChange={(e) => setOwnWords(e.target.value)}
              placeholder={
                signalCandidates.length > 0
                  ? "In your own words, if the chips don't cover it (optional)…"
                  : `In your own words — what drew you to ask ${helperFirstName}?`
              }
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              onClick={() => setStep('explore')}
              disabled={selectedEvidence.size === 0 && ownWords.trim().length < 5}
            >
              Continue
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href={cancelHref}>Cancel</Link>
            </Button>
          </div>
        </div>
      ) : null}

      {step === 'explore' ? (
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">
              What do you hope to explore together?
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Goals over questions — ongoing help is a direction, not one answer. One or two
              sentences is plenty.
            </p>
          </div>

          <Textarea
            rows={4}
            maxLength={GOAL_MAX}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Whether to build my early career in startups or consulting, and how to judge good opportunities."
            aria-label="What you hope to explore"
          />

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Need a starting point?</p>
            <div className="flex flex-wrap gap-2">
              {goalStarters().map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() =>
                    setGoal((prev) => (prev.trim() ? `${prev.trimEnd()} ${starter}` : starter))
                  }
                  className="rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground outline-none transition hover:bg-accent hover:text-foreground focus-visible:border-focus-ring focus-visible:ring-4 focus-visible:ring-focus-ring-muted"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              onClick={() => setStep('pace')}
              disabled={goal.trim().length < 10}
            >
              Continue
            </Button>
            <Button type="button" variant="outline" onClick={back}>
              Back
            </Button>
          </div>
        </div>
      ) : null}

      {step === 'pace' ? (
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">What pace are you imagining?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {`Honest expectations make it easy for ${helperFirstName} to say yes.`}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {COMMITMENT_OPTIONS.map((option) => {
              const active = pace === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPace(option.id)}
                  aria-pressed={active}
                  className={cn(
                    'rounded-lg border p-3 text-left outline-none transition-colors focus-visible:border-focus-ring focus-visible:ring-4 focus-visible:ring-focus-ring-muted',
                    active
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border bg-background hover:bg-accent',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">{option.label}</span>
                    {active ? <Check className="size-4 shrink-0 text-primary" aria-hidden /> : null}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{option.sub}</p>
                </button>
              )
            })}
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            {`${helperFirstName} sees this with your request, next to their capacity. You can both adjust later — it's a starting point, not a contract.`}
          </p>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              onClick={() => setStep(hasScreening ? 'screening' : 'draft')}
              disabled={!pace}
            >
              Continue
            </Button>
            <Button type="button" variant="outline" onClick={back}>
              Back
            </Button>
          </div>
        </div>
      ) : null}

      {step === 'screening' && hasScreening ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              {`${helperFirstName} asks everyone first:`}
            </h2>
            <blockquote className="border-primary border-l-2 pl-3 text-sm font-medium leading-relaxed text-foreground">
              &ldquo;{screeningPrompt}&rdquo;
            </blockquote>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor="screeningAnswerField" className="sr-only">
                Your answer
              </Label>
              <span aria-hidden />
              <FlowCharCount length={screeningAnswer.length} max={SCREENING_ANSWER_MAX_LENGTH} />
            </div>
            <Textarea
              id="screeningAnswerField"
              rows={4}
              maxLength={SCREENING_ANSWER_MAX_LENGTH}
              value={screeningAnswer}
              onChange={(e) => setScreeningAnswer(e.target.value)}
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              {`Only ${helperFirstName} sees this — it isn't part of the note.`}
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" onClick={goToDraft} disabled={screeningAnswer.trim().length < 5}>
              Continue
            </Button>
            <Button type="button" variant="outline" onClick={back}>
              Back
            </Button>
          </div>
        </div>
      ) : null}

      {step === 'draft' ? (
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="helperId" value={helperId} />
          <input type="hidden" name="askType" value="mentorship" />
          <input type="hidden" name="commitment" value={pace ?? ''} />
          {hasScreening ? (
            <input type="hidden" name="screeningAnswer" value={screeningAnswer} />
          ) : null}

          <div className="space-y-1.5">
            <p className="bc-card-label">Built from your answers</p>
            <div className="flex flex-wrap gap-1.5">
              <PieceChip label="Why" value={whySummary()} onEdit={() => setStep('why')} />
              <PieceChip
                label="Goal"
                value={truncate(goal, 26)}
                onEdit={() => setStep('explore')}
              />
              <PieceChip
                label="Pace"
                value={pace ? commitmentLabel(pace) : '—'}
                onEdit={() => setStep('pace')}
              />
              {hasScreening ? (
                <PieceChip label="Screening" value="answered" onEdit={() => setStep('screening')} />
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="helpNeeded" className="text-sm font-semibold text-foreground">
              Your request{' '}
              <span className="font-normal text-xs text-muted-foreground">
                — edit freely, it&rsquo;s yours
              </span>
            </Label>
            <Textarea
              id="helpNeeded"
              name="helpNeeded"
              rows={6}
              required
              value={draft.helpNeeded}
              onChange={(e) => draft.setHelpNeeded(e.target.value)}
              placeholder={draft.drafting ? 'Drafting…' : ''}
            />
            {formState.fieldErrors?.helpNeeded ? (
              <p className="text-xs text-destructive">{formState.fieldErrors.helpNeeded}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium text-foreground">
              {`Why ${helperFirstName}, in one line`}{' '}
              <span className="font-normal text-xs text-muted-foreground">
                — sent with your request
              </span>
            </Label>
            <Textarea
              id="reason"
              name="reason"
              rows={2}
              value={draft.reason}
              onChange={(e) => draft.setReason(e.target.value)}
            />
            {formState.fieldErrors?.reason ? (
              <p className="text-xs text-destructive">{formState.fieldErrors.reason}</p>
            ) : null}
          </div>

          <ToneRow
            drafting={draft.drafting}
            onVariant={(variant) =>
              draft.fetchDraft({
                variant,
                context: goal,
                signals: draftSignals(),
                commitment: pace,
              })
            }
          />
          <CoachLine coach={draft.coach} />

          {maxActiveMentees > 0 ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-mono font-semibold text-foreground">
                {openSpots} of {maxActiveMentees}
              </span>{' '}
              {`ongoing ${openSpots === 1 ? 'spot' : 'spots'} open on ${helperFirstName}'s side right now.`}
            </p>
          ) : null}

          {draft.draftError ? <p className="text-xs text-destructive">{draft.draftError}</p> : null}
          {formState.error ? <p className="text-sm text-destructive">{formState.error}</p> : null}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button type="submit" variant="cta" disabled={pending || draft.drafting}>
              {pending ? 'Sending…' : `Send request to ${helperFirstName}`}
            </Button>
            <Button type="button" variant="outline" onClick={back}>
              Back
            </Button>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {`${helperFirstName} can pass quietly — we'll let you know either way. After sending you'll land on your request's timeline.`}
          </p>
        </form>
      ) : null}
    </div>
  )

  function whySummary(): string {
    const first = signalCandidates.find((s) => selectedEvidence.has(s.id))
    if (first) return truncate(first.label, 26)
    if (ownWords.trim()) return 'in your own words'
    return '—'
  }
}

const STEP_LABELS: Record<Step, string> = {
  why: 'Why {name}',
  explore: 'Explore',
  pace: 'Pace',
  screening: 'Screening',
  draft: 'Draft',
}

const initialFormState: RequestFormState = {}

function evidenceSource(kind: SignalCandidate['kind'], firstName: string): string {
  switch (kind) {
    case 'career':
      return `from ${firstName}'s career history`
    case 'bio':
      return `from ${firstName}'s bio`
    case 'mentoring-topic':
      return `from ${firstName}'s help topics`
    default:
      return 'shared with your profile'
  }
}

function goalStarters(): string[] {
  return [
    'Career direction over the next 2–3 years.',
    'How to evaluate the opportunities in front of me.',
    'Whether my current path is building toward what I want.',
  ]
}

function truncate(s: string, max: number): string {
  const t = s.trim()
  return t.length > max ? `${t.slice(0, max).trimEnd()}…` : t
}

function PieceChip({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-panel/45 py-1 pl-3 pr-1.5 text-xs">
      <span className="font-semibold text-muted-foreground">{label}:</span>
      <span className="max-w-44 truncate text-foreground">{value}</span>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${label.toLowerCase()}`}
        className="rounded-full px-1.5 py-0.5 font-medium text-link hover:text-link-hover"
      >
        Edit
      </button>
    </span>
  )
}

'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { AskGenre, AskType, DraftVariant } from '@/lib/asks/schemas'
import type { SignalCandidate } from '@/lib/asks/signals'
import { type RequestFormState, submitRequest } from './actions'

const GENRE_OPTIONS: Array<{ id: AskGenre; label: string; hint: string }> = [
  { id: 'career-path', label: 'Career path', hint: "A path you're considering" },
  { id: 'industry-intro', label: 'Industry intro', hint: 'What this space is actually like' },
  { id: 'decision-review', label: 'Decision review', hint: "A specific call you're weighing" },
  { id: 'school-advice', label: 'School / academics', hint: 'Schools, applications, courses' },
  { id: 'skill-question', label: 'Skill question', hint: 'A narrow, answerable thing' },
  { id: 'other', label: 'Something else', hint: 'Open-ended' },
]

type Step = 'context' | 'genre' | 'signals' | 'compose'

type Props = {
  helperId: string
  helperName: string
  askType: AskType
  skipHref: string
  cancelHref: string
  /** Pre-derived server-side. Empty array → wizard skips the signals step. */
  signalCandidates: SignalCandidate[]
}

const initialFormState: RequestFormState = {}

/**
 * Coaching composer (Path A of the recommended hybrid).
 *
 *   1. Context — "Tell me what you're working on" (1–2 sentences)
 *   2. Genre   — what kind of help (career-path / industry-intro / …)
 *   3. Signals — what the AI noticed about the helper (asker can drop any)
 *   4. Compose — auto-drafted note with variant lenses, edit, send
 *
 * The signals step is skipped automatically when there are no candidates
 * (helper has very sparse profile + no shared attributes). On Step 1 a
 * quiet "I know what to say" link routes to ?skip=1, rendering the
 * simple <RequestForm /> instead.
 */
export function Wizard({
  helperId,
  helperName,
  askType,
  skipHref,
  cancelHref,
  signalCandidates,
}: Props) {
  const [step, setStep] = useState<Step>('context')
  const [context, setContext] = useState('')
  const [genre, setGenre] = useState<AskGenre | null>(null)
  // Signals start fully active — the model picked them as relevant; the
  // asker drops the ones that feel off. Stored as a Set of ids.
  const [activeSignalIds, setActiveSignalIds] = useState<Set<string>>(
    () => new Set(signalCandidates.map((s) => s.id)),
  )

  // Compose-step state — same shape as RequestForm so the AI draft can
  // populate helpNeeded (always) and reason (mentorship only).
  const [helpNeeded, setHelpNeeded] = useState('')
  const [reason, setReason] = useState('')
  const [drafting, setDrafting] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [hasAutoDrafted, setHasAutoDrafted] = useState(false)

  const hasSignals = signalCandidates.length > 0
  const totalSteps = hasSignals ? 4 : 3
  const stepNumber =
    step === 'context' ? 1 : step === 'genre' ? 2 : step === 'signals' ? 3 : hasSignals ? 4 : 3

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
          askType,
          context,
          genre,
          signals: activeSignalTexts(),
          // For variants, the current draft is the seed. For initial auto-
          // draft (no variant), userText is empty so the model drafts from
          // context + genre + helper profile + active signals.
          userText: opts.variant ? [reason, helpNeeded].filter(Boolean).join('\n\n') : '',
          variant: opts.variant ?? null,
        }),
      })
      if (!res.ok) {
        // Surface the error code in dev to make upstream failures
        // diagnosable without server-log access. In production end users
        // see the clean message — the code is meaningless to them.
        let suffix = ''
        if (process.env.NODE_ENV !== 'production') {
          try {
            const err = (await res.json()) as { error?: string; detail?: string }
            if (err?.error) suffix = ` [${err.error}]`
            if (err?.detail) console.error('[wizard] draft failed', err)
          } catch {
            /* response wasn't JSON; fall through to generic message */
          }
        }
        setDraftError(
          `Couldn't generate a draft right now${suffix} — try again, or write it manually.`,
        )
        return
      }
      const data = (await res.json()) as { helpNeeded: string; reason: string | null }
      setHelpNeeded(data.helpNeeded)
      if (askType === 'mentorship' && data.reason) {
        setReason(data.reason)
      }
    } catch {
      setDraftError("Couldn't reach the drafting service. Try again, or write it manually.")
    } finally {
      setDrafting(false)
    }
  }

  function goAfterGenre() {
    // From genre, jump to signals if there are any; otherwise straight to
    // compose. Keeps the wizard short for sparse-profile helpers.
    if (hasSignals) {
      setStep('signals')
    } else {
      goToCompose()
    }
  }

  function goToCompose() {
    setStep('compose')
    // Auto-draft once when first arriving at compose. Skipped if the user
    // comes back via Back+Forward and we already have a draft, so we don't
    // overwrite their edits.
    if (!hasAutoDrafted) {
      setHasAutoDrafted(true)
      void fetchDraft()
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        Step {stepNumber} of {totalSteps}
      </div>

      {step === 'context' ? (
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Tell me what you&apos;re working on</h2>
            <p className="text-sm text-muted-foreground">
              A sentence or two. We&apos;ll use this to draft a note to {helperName}.
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => setStep('genre')}
                disabled={context.trim().length < 5}
              >
                Continue
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={cancelHref}>Cancel</Link>
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
            <h2 className="text-lg font-semibold">What kind of help?</h2>
            <p className="text-sm text-muted-foreground">
              Helps {helperName} know what you&apos;re hoping for.
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
                  className={
                    active
                      ? 'rounded-lg border-2 border-primary bg-primary/5 p-3 text-left transition'
                      : 'rounded-lg border border-input bg-background p-3 text-left transition hover:bg-accent'
                  }
                >
                  <div className="text-sm font-medium">{g.label}</div>
                  <div className="text-xs text-muted-foreground">{g.hint}</div>
                </button>
              )
            })}
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={goAfterGenre} disabled={!genre}>
              Continue
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
            <h2 className="text-lg font-semibold">What we noticed about {helperName}</h2>
            <p className="text-sm text-muted-foreground">
              We&apos;ll lean on these when drafting. Tap any to drop it.
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
                  className={
                    active
                      ? 'rounded-full border-2 border-primary bg-primary/10 px-3 py-1.5 text-sm transition'
                      : 'rounded-full border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground line-through transition hover:bg-accent'
                  }
                >
                  {s.label}
                </button>
              )
            })}
          </div>
          {activeSignalIds.size === 0 ? (
            <p className="text-xs text-muted-foreground">
              No signals selected — the draft will lean on your situation and {helperName}&apos;s
              profile only.
            </p>
          ) : null}
          <div className="flex gap-2">
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
          <input type="hidden" name="askType" value={askType} />

          <div className="space-y-1">
            <h2 className="text-lg font-semibold">
              {drafting && !helpNeeded ? 'Drafting your note…' : 'Here’s a starting draft'}
            </h2>
            <p className="text-sm text-muted-foreground">Edit anything. Variants below.</p>
          </div>

          {askType === 'mentorship' ? (
            <div className="space-y-2">
              <Label htmlFor="reason">
                Why you&apos;d like {helperName} specifically{' '}
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
              {askType === 'advice' ? 'Your question' : "What you're hoping to explore"}{' '}
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="helpNeeded"
              name="helpNeeded"
              rows={askType === 'advice' ? 4 : 5}
              required
              value={helpNeeded}
              onChange={(e) => setHelpNeeded(e.target.value)}
              placeholder={drafting ? 'Drafting…' : ''}
            />
            {fe.helpNeeded ? <p className="text-xs text-destructive">{fe.helpNeeded}</p> : null}
          </div>

          {helpNeeded.length > 0 ? (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span>Refine:</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={drafting}
                onClick={() => fetchDraft({ variant: 'shorter' })}
              >
                Shorter
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={drafting}
                onClick={() => fetchDraft({ variant: 'more-direct' })}
              >
                More direct
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={drafting}
                onClick={() => fetchDraft({ variant: 'warmer' })}
              >
                Warmer
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={drafting}
                onClick={() => fetchDraft()}
              >
                {drafting ? 'Drafting…' : 'Try again'}
              </Button>
            </div>
          ) : null}

          {draftError ? <p className="text-xs text-destructive">{draftError}</p> : null}
          {formState.error ? <p className="text-sm text-destructive">{formState.error}</p> : null}

          <div className="flex gap-2">
            <Button type="submit" disabled={pending || drafting}>
              {pending ? 'Sending…' : askType === 'advice' ? 'Send' : 'Send request'}
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

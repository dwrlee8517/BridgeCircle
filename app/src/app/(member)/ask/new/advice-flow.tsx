'use client'

import { Plus, X } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { SignalCandidate } from '@/lib/asks/signals'
import { cn } from '@/lib/utils'
import { type RequestFormState, submitRequest } from './actions'
import { CoachLine, FlowCharCount, FlowSteps, ToneRow, useDraft } from './flow-ui'

const SITUATION_MAX = 600
const CUSTOM_MENTION_MAX = 120

/**
 * The advice composer: two steps. One field for the situation + question
 * (the genre question is gone — the drafter infers it), with the mentions
 * the draft will lean on visible and prunable before anything is
 * generated. Then the draft itself, editable, with tone lenses.
 *
 * "Skip — write it myself" stays one click away for members who hate
 * scaffolding.
 */
export function AdviceFlow({
  helperId,
  helperFirstName,
  skipHref,
  signalCandidates,
  initialSituation = '',
}: {
  helperId: string
  helperFirstName: string
  skipHref: string
  signalCandidates: SignalCandidate[]
  initialSituation?: string
}) {
  const [step, setStep] = useState<'ask' | 'draft'>('ask')
  const [situation, setSituation] = useState(initialSituation.slice(0, SITUATION_MAX))

  // Profile-derived mentions start active; the asker prunes. Custom
  // mentions are the asker's own words, removable the same way.
  const [activeSignalIds, setActiveSignalIds] = useState<Set<string>>(
    () => new Set(signalCandidates.map((s) => s.id)),
  )
  const [customMentions, setCustomMentions] = useState<string[]>([])
  const [addingOwn, setAddingOwn] = useState(false)
  const [ownText, setOwnText] = useState('')

  // Re-draft only when the inputs actually changed since the last draft —
  // bouncing back to edit a mention and returning must not clobber an
  // already-edited note for no reason.
  const [lastDraftKey, setLastDraftKey] = useState<string | null>(null)

  const draft = useDraft({ helperId, askType: 'advice' })
  const [formState, formAction, pending] = useActionState(submitRequest, initialFormState)

  const mentionCount = activeSignalIds.size + customMentions.length

  function toggleSignal(id: string) {
    setActiveSignalIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function addOwnMention() {
    const text = ownText.trim().slice(0, CUSTOM_MENTION_MAX)
    if (!text) return
    setCustomMentions((prev) => [...prev, text])
    setOwnText('')
    setAddingOwn(false)
  }

  function activeSignals(): string[] {
    return [
      ...signalCandidates.filter((c) => activeSignalIds.has(c.id)).map((c) => c.promptText),
      ...customMentions.map(
        (m) =>
          `The asker wants to mention: "${m}". Work it in naturally if it strengthens the ask.`,
      ),
    ]
  }

  function goToDraft() {
    setStep('draft')
    const key = JSON.stringify([situation.trim(), [...activeSignalIds].sort(), customMentions])
    if (key !== lastDraftKey) {
      setLastDraftKey(key)
      void draft.fetchDraft({ context: situation, signals: activeSignals() })
    }
  }

  const situationSummary =
    situation.trim().length > 48 ? `${situation.trim().slice(0, 48).trimEnd()}…` : situation.trim()

  if (step === 'ask') {
    return (
      <div className="space-y-5">
        <FlowSteps labels={['Your ask', 'Draft']} currentIndex={0} />

        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor="situation" className="text-sm font-semibold text-foreground">
              Your situation and question
            </Label>
            <FlowCharCount length={situation.length} max={SITUATION_MAX} />
          </div>
          <Textarea
            id="situation"
            rows={5}
            maxLength={SITUATION_MAX}
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            placeholder={`e.g. I'm choosing between a consulting offer and a small startup. Which did you weigh when you switched?`}
          />
          <p className="text-xs leading-relaxed text-muted-foreground">
            A sentence or two of where you are, plus the question. We&rsquo;ll shape it on the next
            step.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">
            We&rsquo;ll mention{' '}
            <span className="font-normal text-xs text-muted-foreground">
              {`— from ${helperFirstName}'s profile + your words`}
            </span>
          </p>
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
                    'rounded-full border px-3 py-1.5 text-sm outline-none transition focus-visible:border-focus-ring focus-visible:ring-4 focus-visible:ring-focus-ring-muted',
                    active
                      ? 'border-primary bg-primary/10 font-medium text-foreground'
                      : 'border-border bg-background text-muted-foreground line-through hover:bg-accent',
                  )}
                >
                  {s.label}
                </button>
              )
            })}
            {customMentions.map((m) => (
              <span
                key={m}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium text-foreground"
              >
                {m}
                <button
                  type="button"
                  aria-label={`Remove "${m}"`}
                  onClick={() => setCustomMentions((prev) => prev.filter((x) => x !== m))}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </span>
            ))}
            {addingOwn ? (
              <span className="inline-flex items-center gap-1.5">
                <input
                  // biome-ignore lint/a11y/noAutofocus: the field appears on the asker's own click — focusing it is the expected next keystroke
                  autoFocus
                  value={ownText}
                  maxLength={CUSTOM_MENTION_MAX}
                  onChange={(e) => setOwnText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addOwnMention()
                    }
                    if (e.key === 'Escape') setAddingOwn(false)
                  }}
                  placeholder="Something to mention…"
                  className="h-8 rounded-full border border-border bg-background px-3 text-sm outline-none focus-visible:border-focus-ring"
                />
                <Button type="button" size="sm" variant="outline" onClick={addOwnMention}>
                  Add
                </Button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setAddingOwn(true)}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground outline-none transition hover:bg-accent hover:text-foreground focus-visible:border-focus-ring focus-visible:ring-4 focus-visible:ring-focus-ring-muted"
              >
                <Plus className="size-3.5" aria-hidden />
                Add your own
              </button>
            )}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Removing one keeps it out of the draft — nothing is sent yet.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <Button type="button" onClick={goToDraft} disabled={situation.trim().length < 10}>
            See your draft
          </Button>
          <Link
            href={skipHref}
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            Skip — write it myself →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <FlowSteps labels={['Your ask', 'Draft']} currentIndex={1} />

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface-panel/45 px-3 py-2 text-xs text-muted-foreground">
        <span className="min-w-0 truncate">
          {situationSummary}
          {mentionCount > 0
            ? ` · ${mentionCount} ${mentionCount === 1 ? 'mention' : 'mentions'}`
            : ''}
        </span>
        <button
          type="button"
          onClick={() => setStep('ask')}
          className="font-medium text-link hover:text-link-hover"
        >
          Edit
        </button>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="helperId" value={helperId} />
        <input type="hidden" name="askType" value="advice" />

        <div className="space-y-2">
          <Label htmlFor="helpNeeded" className="text-sm font-semibold text-foreground">
            Your note{' '}
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

        <ToneRow
          drafting={draft.drafting}
          onVariant={(variant) =>
            draft.fetchDraft({ variant, context: situation, signals: activeSignals() })
          }
        />
        <CoachLine coach={draft.coach} />

        {draft.draftError ? <p className="text-xs text-destructive">{draft.draftError}</p> : null}
        {formState.error ? <p className="text-sm text-destructive">{formState.error}</p> : null}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button type="submit" variant="cta" disabled={pending || draft.drafting}>
            {pending ? 'Sending…' : `Send ask to ${helperFirstName}`}
          </Button>
          <Button type="button" variant="outline" onClick={() => setStep('ask')}>
            Back
          </Button>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {`If now isn't right, ${helperFirstName} can pass quietly — and we'll let you know either way. After sending you'll land on your ask's timeline.`}
        </p>
      </form>
    </div>
  )
}

const initialFormState: RequestFormState = {}

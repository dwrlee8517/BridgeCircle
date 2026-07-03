'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { DraftVariant } from '@/lib/asks/schemas'
import type { SignalCandidate } from '@/lib/asks/signals'
import { cn } from '@/lib/utils'
import { type RequestFormState, submitRequest } from './actions'

const SITUATION_MAX = 600
const initialFormState: RequestFormState = {}

type Bubble = { id: string; role: 'bc' | 'me'; text: string }

function mkBubble(role: 'bc' | 'me', text: string): Bubble {
  return { id: crypto.randomUUID(), role, text }
}

/**
 * The conversational composer (ADR 0011 Phase 2): one chat with the AI
 * instead of a wizard. The asker says what they need in their own words,
 * the drafter shapes a note, and everything after that is refinement —
 * follow-up messages, tone lenses, or editing the note directly.
 *
 * The signals-transparency defense survives the chat idiom: the chips the
 * drafter leaned on render with the draft and stay prunable. Dropping one
 * re-drafts immediately; nothing is sent until the asker sends it.
 */
export function ChatComposer({
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
  const [transcript, setTranscript] = useState<Bubble[]>([
    mkBubble(
      'bc',
      `What do you want ${helperFirstName}'s help with? Say it however it comes out — I'll shape it into a note you can edit.`,
    ),
  ])
  const [input, setInput] = useState(initialSituation.slice(0, SITUATION_MAX))
  const [userTurns, setUserTurns] = useState<string[]>([])

  // Profile-derived signals start active; the asker prunes. Toggling after
  // a draft exists re-drafts with the updated set.
  const [activeSignalIds, setActiveSignalIds] = useState<Set<string>>(
    () => new Set(signalCandidates.map((s) => s.id)),
  )

  const draft = useDraft({ helperId })
  const [formState, formAction, pending] = useActionState(submitRequest, initialFormState)
  const hasDraftStarted = userTurns.length > 0

  function activeSignals(ids: Set<string> = activeSignalIds): string[] {
    return signalCandidates.filter((c) => ids.has(c.id)).map((c) => c.promptText)
  }

  function contextFrom(turns: string[]): string {
    return turns.join('\n').slice(0, 2000)
  }

  async function requestDraft(turns: string[], signals: string[]) {
    const result = await draft.fetchDraft({ context: contextFrom(turns), signals })
    setTranscript((prev) => [
      ...prev,
      mkBubble(
        'bc',
        result.ok
          ? (result.coach ?? 'Here’s a draft — edit anything before sending.')
          : 'I couldn’t shape a draft just now. Try again, or write the note yourself below.',
      ),
    ])
  }

  function sendMessage() {
    const text = input.trim()
    if (text.length < 10 || draft.drafting) return
    const turns = [...userTurns, text]
    setUserTurns(turns)
    setTranscript((prev) => [...prev, mkBubble('me', text)])
    setInput('')
    void requestDraft(turns, activeSignals())
  }

  function toggleSignal(id: string) {
    const next = new Set(activeSignalIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setActiveSignalIds(next)
    if (hasDraftStarted && !draft.drafting) {
      void requestDraft(userTurns, activeSignals(next))
    }
  }

  return (
    <div className="space-y-5">
      {/* Transcript */}
      <div className="flex flex-col gap-2.5" aria-live="polite">
        {transcript.map((b) => (
          <div
            key={b.id}
            className={cn(
              'max-w-[88%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed',
              b.role === 'bc'
                ? 'self-start rounded-bl-sm bg-secondary text-foreground'
                : 'self-end rounded-br-sm bg-primary-tint text-foreground',
            )}
          >
            {b.role === 'bc' ? (
              <span className="mb-0.5 block font-mono text-[10px] font-semibold uppercase tracking-label text-muted-foreground">
                BridgeCircle
              </span>
            ) : null}
            {b.text}
          </div>
        ))}
        {draft.drafting ? (
          <div className="max-w-[88%] self-start rounded-xl rounded-bl-sm bg-secondary px-3.5 py-2.5 text-sm text-muted-foreground">
            Shaping your note…
          </div>
        ) : null}
      </div>

      {/* Message input — the conversation stays open for refinements. */}
      <div className="space-y-2">
        <Label htmlFor="situation" className="sr-only">
          Your message
        </Label>
        <Textarea
          id="situation"
          rows={hasDraftStarted ? 2 : 4}
          maxLength={SITUATION_MAX}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              sendMessage()
            }
          }}
          placeholder={
            hasDraftStarted
              ? 'Anything to add or change? e.g. "mention I met her at the reunion"'
              : `e.g. I'm choosing between a consulting offer and a small startup. Which did ${helperFirstName} weigh when they switched?`
          }
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant={hasDraftStarted ? 'outline' : 'default'}
            onClick={sendMessage}
            disabled={draft.drafting || input.trim().length < 10}
          >
            {hasDraftStarted ? 'Update the note' : 'Shape my note'}
          </Button>
          <Link
            href={skipHref}
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            Write it myself →
          </Link>
        </div>
      </div>

      {/* Leaned-on chips — the transparency defense, prunable at any time. */}
      {hasDraftStarted && signalCandidates.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-foreground">
            Leaning on <span className="font-normal text-muted-foreground">— tap to drop one</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {signalCandidates.map((s) => {
              const active = activeSignalIds.has(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSignal(s.id)}
                  aria-pressed={active}
                  disabled={draft.drafting}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs outline-none transition focus-visible:border-focus-ring focus-visible:ring-4 focus-visible:ring-focus-ring-muted',
                    active
                      ? 'border-primary bg-primary/10 font-medium text-foreground'
                      : 'border-border bg-background text-muted-foreground line-through hover:bg-accent',
                  )}
                >
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {/* The note itself — appears once the first draft lands. */}
      {hasDraftStarted ? (
        <form action={formAction} className="space-y-4 border-t border-border pt-4">
          <input type="hidden" name="helperId" value={helperId} />

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

          {draft.reason ? (
            <div className="space-y-1.5">
              <Label htmlFor="reason" className="text-xs font-semibold text-muted-foreground">
                Why {helperFirstName}, in one line — sent with your note
              </Label>
              <Textarea
                id="reason"
                name="reason"
                rows={1}
                maxLength={500}
                value={draft.reason}
                onChange={(e) => draft.setReason(e.target.value)}
              />
            </div>
          ) : null}

          <ToneRow
            drafting={draft.drafting}
            onVariant={(variant) =>
              draft.fetchDraft({
                variant,
                context: contextFrom(userTurns),
                signals: activeSignals(),
              })
            }
          />

          {draft.draftError ? <p className="text-xs text-destructive">{draft.draftError}</p> : null}
          {formState.error ? <p className="text-sm text-destructive">{formState.error}</p> : null}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button type="submit" variant="cta" disabled={pending || draft.drafting}>
              {pending ? 'Sending…' : `Send ask to ${helperFirstName}`}
            </Button>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {`If now isn't right, ${helperFirstName} can pass quietly — and we'll let you know either way. After sending you'll land on your ask's timeline.`}
          </p>
        </form>
      ) : null}
    </div>
  )
}

const TONE_VARIANTS: Array<{ id: DraftVariant; label: string }> = [
  { id: 'warmer', label: 'Warmer' },
  { id: 'more-direct', label: 'More direct' },
  { id: 'shorter', label: 'Shorter' },
]

/** Tone lenses + a full regenerate. `null` variant means "new draft". */
function ToneRow({
  drafting,
  onVariant,
}: {
  drafting: boolean
  onVariant: (variant: DraftVariant | null) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 border-y border-border py-1.5 text-xs text-muted-foreground">
      <span className="font-semibold">Tone</span>
      {TONE_VARIANTS.map((v) => (
        <Button
          key={v.id}
          type="button"
          variant="ghost"
          size="sm"
          disabled={drafting}
          onClick={() => onVariant(v.id)}
          className="h-6 px-2 text-kicker"
        >
          {v.label}
        </Button>
      ))}
      <span aria-hidden className="px-1 text-border">
        ·
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={drafting}
        onClick={() => onVariant(null)}
        className="h-6 px-2 text-kicker"
      >
        {drafting ? 'Drafting…' : 'New draft'}
      </Button>
    </div>
  )
}

type DraftRequestOpts = {
  variant?: DraftVariant | null
  context?: string | null
  signals?: string[] | null
}

type DraftFetchResult = { ok: boolean; coach: string | null }

/**
 * Draft state + fetch against /api/asks/draft. Tone variants rework the
 * current text (sent as userText); a fresh call drafts from the structured
 * inputs alone. Returns the coach line so the chat can speak it.
 */
function useDraft({ helperId }: { helperId: string }) {
  const [helpNeeded, setHelpNeeded] = useState('')
  const [reason, setReason] = useState('')
  const [coach, setCoach] = useState<string | null>(null)
  const [drafting, setDrafting] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)

  async function fetchDraft(opts: DraftRequestOpts = {}): Promise<DraftFetchResult> {
    setDrafting(true)
    setDraftError(null)
    try {
      const res = await fetch('/api/asks/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helperId,
          context: opts.context ?? null,
          signals: opts.signals ?? null,
          userText: opts.variant ? [reason, helpNeeded].filter(Boolean).join('\n\n') : '',
          variant: opts.variant ?? null,
        }),
      })
      if (!res.ok) {
        setDraftError("Couldn't generate a draft right now — try again, or write it yourself.")
        return { ok: false, coach: null }
      }
      const data = (await res.json()) as {
        helpNeeded: string
        reason: string | null
        coach: string | null
      }
      setHelpNeeded(data.helpNeeded)
      setReason(data.reason ?? '')
      setCoach(data.coach ?? null)
      return { ok: true, coach: data.coach ?? null }
    } catch {
      setDraftError("Couldn't reach the drafting service. Try again, or write it yourself.")
      return { ok: false, coach: null }
    } finally {
      setDrafting(false)
    }
  }

  return {
    helpNeeded,
    setHelpNeeded,
    reason,
    setReason,
    coach,
    drafting,
    draftError,
    fetchDraft,
  }
}

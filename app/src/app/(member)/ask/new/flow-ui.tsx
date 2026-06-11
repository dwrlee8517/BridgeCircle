'use client'

import { Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { AskCommitment, AskType, DraftVariant } from '@/lib/asks/schemas'
import { cn } from '@/lib/utils'

/**
 * Shared pieces for the two guided composer flows (advice-flow.tsx and
 * mentorship-flow.tsx). The flows have different steps and different
 * questions, but the chrome — step rail, character counts, tone controls,
 * coach line, draft fetching — must feel identical so switching ask type
 * never feels like switching products.
 */

export function FlowSteps({ labels, currentIndex }: { labels: string[]; currentIndex: number }) {
  return (
    <div className="scrollbar-none flex select-none justify-between overflow-x-auto whitespace-nowrap rounded-md border border-border bg-muted/20 p-2 text-xs">
      {labels.map((label, idx) => {
        const isActive = idx === currentIndex
        const isCompleted = idx < currentIndex
        return (
          <div key={label} className="flex shrink-0 items-center gap-1.5">
            <span
              className={cn(
                'flex size-5 items-center justify-center rounded-full border text-xs',
                isActive
                  ? 'border-primary bg-primary font-semibold text-primary-foreground'
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
                  ? 'font-semibold text-foreground'
                  : isCompleted
                    ? 'text-foreground'
                    : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
            {idx < labels.length - 1 ? <span className="px-1 text-border">/</span> : null}
          </div>
        )
      })}
    </div>
  )
}

export function FlowCharCount({ length, max }: { length: number; max: number }) {
  return (
    <span
      className={cn(
        'font-mono text-xs tabular-nums',
        length > max ? 'text-destructive' : 'text-muted-foreground',
      )}
    >
      {length} / {max}
    </span>
  )
}

const TONE_VARIANTS: Array<{ id: DraftVariant; label: string }> = [
  { id: 'warmer', label: 'Warmer' },
  { id: 'more-direct', label: 'More direct' },
  { id: 'shorter', label: 'Shorter' },
]

/** Tone lenses + a full regenerate. `null` variant means "new draft". */
export function ToneRow({
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

/** One quiet line to the asker about why the draft is easy to say yes to.
 * Coaching, not praise — and never part of what gets sent. */
export function CoachLine({ coach }: { coach: string | null }) {
  if (!coach) return null
  return <p className="text-xs italic leading-relaxed text-muted-foreground">{coach}</p>
}

export type DraftRequestOpts = {
  variant?: DraftVariant | null
  context?: string | null
  signals?: string[] | null
  commitment?: AskCommitment | null
}

/**
 * Draft state + fetch against /api/asks/draft, shared by both flows.
 * Tone variants rework the current text (sent as userText); a fresh call
 * drafts from the structured inputs alone.
 */
export function useDraft({ helperId, askType }: { helperId: string; askType: AskType }) {
  const [helpNeeded, setHelpNeeded] = useState('')
  const [reason, setReason] = useState('')
  const [coach, setCoach] = useState<string | null>(null)
  const [drafting, setDrafting] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)

  async function fetchDraft(opts: DraftRequestOpts = {}) {
    setDrafting(true)
    setDraftError(null)
    try {
      const res = await fetch('/api/asks/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helperId,
          askType,
          context: opts.context ?? null,
          signals: opts.signals ?? null,
          commitment: opts.commitment ?? null,
          userText: opts.variant ? [reason, helpNeeded].filter(Boolean).join('\n\n') : '',
          variant: opts.variant ?? null,
        }),
      })
      if (!res.ok) {
        setDraftError("Couldn't generate a draft right now — try again, or write it yourself.")
        return
      }
      const data = (await res.json()) as {
        helpNeeded: string
        reason: string | null
        coach: string | null
      }
      setHelpNeeded(data.helpNeeded)
      if (askType === 'mentorship' && data.reason) setReason(data.reason)
      setCoach(data.coach ?? null)
    } catch {
      setDraftError("Couldn't reach the drafting service. Try again, or write it yourself.")
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

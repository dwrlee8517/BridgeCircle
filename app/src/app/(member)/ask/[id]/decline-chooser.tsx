'use client'

import { Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DECLINE_REASONS, type DeclineReason, declineCopyForAsker } from '@/lib/asks/declineReasons'
import { cn } from '@/lib/utils'
import { declineAction } from './actions'

/**
 * The decline moment, made lighter instead of heavier: one optional tap.
 * A reason is never required, the helper previews exactly what the asker
 * will read (that transparency is what makes choosing one feel safe), and
 * "pass without a reason" is always one click. The reason value travels on
 * the submit button itself so the clicked button is the source of truth —
 * no state/DOM race.
 */
export function DeclineChooser({
  askId,
  helperFirstName,
  askerFirstName,
}: {
  askId: string
  helperFirstName: string
  askerFirstName: string
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<DeclineReason | null>(null)

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Decline
      </Button>
    )
  }

  return (
    <div className="w-full rounded-md border border-border bg-surface-panel/40 p-4">
      <p className="font-heading text-sm font-semibold text-foreground">Passing quietly is fine</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        A reason is optional. If one fits, it shapes what {askerFirstName} sees — and helps us route
        better next time.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {DECLINE_REASONS.map((option) => {
          const selected = reason === option.id
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setReason(selected ? null : option.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors duration-base ease-standard',
                selected
                  ? 'border-primary bg-primary-tint font-semibold text-primary'
                  : 'border-border bg-card text-foreground hover:border-primary/35',
              )}
            >
              {selected ? <Check aria-hidden className="size-3.5" /> : null}
              {option.helperLabel}
            </button>
          )
        })}
      </div>

      <div className="mt-3 rounded-md bg-surface-panel px-3 py-2">
        <p className="text-xs text-muted-foreground">{askerFirstName} will see:</p>
        <p className="mt-0.5 text-sm font-medium text-foreground">
          &ldquo;{declineCopyForAsker(reason, helperFirstName)}&rdquo;
        </p>
      </div>

      <form action={declineAction} className="mt-4 flex flex-wrap items-center gap-2">
        <input type="hidden" name="requestId" value={askId} />
        <Button type="submit" variant="outline" name="reason" value={reason ?? ''}>
          Pass on this ask
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        {reason !== null ? (
          <Button
            type="submit"
            variant="ghost"
            name="reason"
            value=""
            className="ml-auto text-muted-foreground"
          >
            Pass without a reason
          </Button>
        ) : null}
      </form>
    </div>
  )
}

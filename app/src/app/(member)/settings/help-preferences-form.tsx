'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useState } from 'react'
import { FormMessage } from '@/components/ui/form-message'
import { FormSubmitButton } from '@/components/ui/form-submit-button'
import { cn } from '@/lib/utils'
import {
  type HelpPreferencesFormState,
  saveHelpPreferencesAction,
} from '../help/help-preferences-actions'

const INITIAL_STATE: HelpPreferencesFormState = {}

export function HelpPreferencesForm({
  defaults,
  paused,
}: {
  defaults: { openToHelp: boolean; topics: string[] }
  paused: { reason: 'manual' | 'unresponsive' | 'admin' | null } | null
}) {
  const router = useRouter()
  const [state, action] = useActionState(saveHelpPreferencesAction, INITIAL_STATE)
  const [openToHelp, setOpenToHelp] = useState(defaults.openToHelp)
  const adminPaused = paused?.reason === 'admin'

  useEffect(() => {
    if (state.ok) router.refresh()
  }, [router, state.ok])

  return (
    <form action={action} className="overflow-hidden">
      <div className="flex flex-col gap-3 border-t border-[var(--divider-row)] px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
        <div className="min-w-0 flex-1">
          <label htmlFor="openToHelp" className="text-label font-bold text-[var(--text-primary)]">
            Open to helping
          </label>
          <p className="mt-0.5 text-xs leading-relaxed font-medium text-[var(--text-faint)]">
            {availabilityDescription(openToHelp, paused?.reason ?? null)}
          </p>
        </div>
        <label
          className={cn(
            'inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2.5 self-start rounded-full px-1 sm:self-auto',
            adminPaused && 'cursor-not-allowed opacity-60',
          )}
        >
          <input
            id="openToHelp"
            name="openToHelp"
            type="checkbox"
            role="switch"
            checked={openToHelp}
            aria-checked={openToHelp}
            disabled={adminPaused}
            onChange={(event) => setOpenToHelp(event.target.checked)}
            className="peer sr-only"
          />
          <span className="relative h-5 w-[34px] rounded-full bg-[var(--icon-muted)] transition-colors after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-[var(--green-500)] peer-checked:after:translate-x-3.5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring motion-reduce:transition-none motion-reduce:after:transition-none" />
          <span className="text-xs font-bold text-[var(--text-secondary)]">
            {openToHelp ? 'Open' : 'Not right now'}
          </span>
        </label>
      </div>

      <div className="border-t border-[var(--divider-row)] px-4 py-3.5 sm:px-5">
        <label htmlFor="helpTopics" className="text-label font-bold text-[var(--text-primary)]">
          Help topics
        </label>
        <p className="mt-0.5 text-xs leading-relaxed font-medium text-[var(--text-faint)]">
          Set up to five topics while you are open so the right asks can find you.
        </p>
        <input
          id="helpTopics"
          name="topics"
          defaultValue={defaults.topics.join(', ')}
          maxLength={504}
          disabled={!openToHelp || adminPaused}
          aria-invalid={state.fieldErrors?.topics ? true : undefined}
          aria-describedby={state.fieldErrors?.topics ? 'help-topics-error' : undefined}
          placeholder="career transitions, consulting, returning to Korea"
          className="mt-2.5 min-h-10 w-full rounded-[var(--radius-box)] border border-[var(--input)] bg-card px-3.5 text-sm font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--action-primary)] focus:ring-2 focus:ring-[var(--focus-ring-soft)] disabled:cursor-not-allowed disabled:opacity-60"
        />
        {state.fieldErrors?.topics ? (
          <span
            id="help-topics-error"
            className="mt-1.5 block text-xs font-semibold text-[var(--state-danger-text)]"
          >
            {state.fieldErrors.topics}
          </span>
        ) : null}
      </div>

      <div className="flex min-h-14 flex-wrap items-center justify-end gap-3 border-t border-[var(--divider-row)] px-4 py-2.5 sm:px-5">
        <div aria-live="polite" className="mr-auto text-xs font-semibold">
          {state.ok ? <FormMessage tone="success">Helping preferences saved.</FormMessage> : null}
          {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
        </div>
        <FormSubmitButton size="sm" variant="outline" pendingLabel="Saving…" disabled={adminPaused}>
          Save helping preferences
        </FormSubmitButton>
      </div>
    </form>
  )
}

function availabilityDescription(
  openToHelp: boolean,
  pauseReason: 'manual' | 'unresponsive' | 'admin' | null,
) {
  if (pauseReason === 'admin') {
    return 'Your circle administrator paused matching. Contact them if you think this should change.'
  }
  if (pauseReason === 'unresponsive') {
    return 'Matching paused after three unanswered direct asks. Save with availability on to resume.'
  }
  if (openToHelp) {
    return 'Members may match with you around these topics. You still decide on every Ask.'
  }
  return 'Topic matching is off. Direct asks that name you can still arrive.'
}

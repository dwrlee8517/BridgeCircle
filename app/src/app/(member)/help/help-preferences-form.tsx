'use client'

import { Settings2 } from 'lucide-react'
import { useActionState } from 'react'
import {
  type HelpPreferencesFormState,
  saveHelpPreferencesAction,
} from './help-preferences-actions'

const INITIAL_STATE: HelpPreferencesFormState = {}

export function HelpPreferencesForm({
  defaults,
}: {
  defaults: { openToHelp: boolean; topics: string[] }
}) {
  const [state, action, pending] = useActionState(saveHelpPreferencesAction, INITIAL_STATE)

  return (
    <details className="group mt-4 border-t border-[var(--divider)] pt-4">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-[var(--radius-comfortable)] bg-card px-4 text-xs font-bold text-[var(--text-secondary)] shadow-[var(--ring-outline)] hover:bg-[var(--surface-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring [&::-webkit-details-marker]:hidden">
        <Settings2 aria-hidden className="size-4" />
        Edit availability and topics
      </summary>

      <form action={action} className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-box)] bg-[var(--surface-inset)] px-3.5 py-2.5 sm:col-span-2">
          <input
            type="checkbox"
            name="openToHelp"
            defaultChecked={defaults.openToHelp}
            className="peer sr-only"
          />
          <span className="relative h-6 w-10 shrink-0 rounded-full bg-[var(--icon-muted)] transition-colors after:absolute after:top-1 after:left-1 after:size-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-[var(--green-500)] peer-checked:after:translate-x-4 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring motion-reduce:transition-none motion-reduce:after:transition-none" />
          <span>
            <span className="block text-body-sm font-bold text-[var(--text-primary)]">
              Open to topic matching
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed font-medium text-[var(--text-faint)]">
              Direct asks can still reach you when this is off.
            </span>
          </span>
        </label>

        <label className="min-w-0">
          <span className="text-xs font-bold text-[var(--text-secondary)]">Help topics</span>
          <input
            name="topics"
            defaultValue={defaults.topics.join(', ')}
            maxLength={504}
            aria-invalid={state.fieldErrors?.topics ? true : undefined}
            aria-describedby={state.fieldErrors?.topics ? 'help-topics-error' : 'help-topics-hint'}
            placeholder="career transitions, consulting, returning to Korea"
            className="mt-1.5 min-h-11 w-full rounded-[var(--radius-box)] border border-[var(--input)] bg-card px-3.5 text-sm font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--action-primary)] focus:ring-2 focus:ring-[var(--focus-ring-soft)]"
          />
          {state.fieldErrors?.topics ? (
            <span
              id="help-topics-error"
              className="mt-1.5 block text-xs font-semibold text-[var(--state-danger-text)]"
            >
              {state.fieldErrors.topics}
            </span>
          ) : (
            <span
              id="help-topics-hint"
              className="mt-1.5 block text-xs font-medium text-[var(--text-faint)]"
            >
              Up to five, separated by commas.
            </span>
          )}
        </label>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center self-start rounded-full bg-[var(--action-give)] px-5 text-xs font-bold text-[var(--action-on-give)] shadow-sm hover:bg-[var(--action-give-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60 sm:mt-[22px]"
        >
          {pending ? 'Saving…' : 'Save changes'}
        </button>

        <span aria-live="polite" className="text-xs font-semibold sm:col-span-2">
          {state.ok ? <span className="text-[var(--state-success-text)]">Saved.</span> : null}
          {state.error ? (
            <span className="text-[var(--state-danger-text)]">{state.error}</span>
          ) : null}
        </span>
      </form>
    </details>
  )
}

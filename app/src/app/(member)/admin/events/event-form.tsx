'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { FieldError, FormMessage } from '@/components/ui/form-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createEventAction, type EventCreateFormState } from './actions'

const initialState: EventCreateFormState = {}

export type EventFormDefaults = {
  title: string
  /** datetime-local accepts `YYYY-MM-DDTHH:mm` (no timezone). The page
   * converts ISO → local before passing it in. */
  startsAtLocal: string
  location: string
  description: string
  capacity: string
}

const EMPTY_DEFAULTS: EventFormDefaults = {
  title: '',
  startsAtLocal: '',
  location: '',
  description: '',
  capacity: '',
}

type Props = {
  /** Pre-filled values for edit mode. Optional — defaults to empty for create. */
  defaults?: EventFormDefaults
  /** Action override. Default = createEventAction. Edit page passes its own. */
  action?: typeof createEventAction
  submitLabel?: string
  /** When true, do not reset the form on successful submit. Useful for edit. */
  preserveOnSuccess?: boolean
  /** Extra hidden fields to ship with the form (e.g. eventId on the edit page). */
  hiddenFields?: Record<string, string>
}

export function EventForm({
  defaults = EMPTY_DEFAULTS,
  action = createEventAction,
  submitLabel,
  preserveOnSuccess = false,
  hiddenFields,
}: Props) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const fe = state.fieldErrors ?? {}
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.ok && formRef.current && !preserveOnSuccess) formRef.current.reset()
  }, [state.ok, preserveOnSuccess])

  useEffect(() => {
    if (state.error || state.fieldErrors) {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    }
  }, [state.error, state.fieldErrors])

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {hiddenFields
        ? Object.entries(hiddenFields).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))
        : null}
      <Field id="title" label="Title" error={fe.title} required>
        <Input
          id="title"
          name="title"
          required
          maxLength={200}
          placeholder="Spring alumni mixer"
          defaultValue={defaults.title}
          aria-invalid={fe.title ? true : undefined}
          aria-describedby={fe.title ? 'title-error' : undefined}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="startsAt" label="Start" error={fe.startsAt} required>
          <Input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            required
            defaultValue={defaults.startsAtLocal}
            aria-invalid={fe.startsAt ? true : undefined}
            aria-describedby={fe.startsAt ? 'startsAt-error' : undefined}
          />
        </Field>
        <Field id="location" label="Location" error={fe.location} required>
          <Input
            id="location"
            name="location"
            required
            maxLength={200}
            placeholder="Palos Verdes campus"
            defaultValue={defaults.location}
            aria-invalid={fe.location ? true : undefined}
            aria-describedby={fe.location ? 'location-error' : undefined}
          />
        </Field>
      </div>

      <Field id="capacity" label="Capacity (optional — blank = unlimited)" error={fe.capacity}>
        <Input
          id="capacity"
          name="capacity"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          placeholder="e.g. 50"
          defaultValue={defaults.capacity}
          aria-invalid={fe.capacity ? true : undefined}
          aria-describedby={fe.capacity ? 'capacity-error' : undefined}
        />
      </Field>

      <Field id="description" label="Description" error={fe.description}>
        <Textarea
          id="description"
          name="description"
          rows={4}
          maxLength={2000}
          placeholder="What's the agenda? Anything attendees should bring?"
          defaultValue={defaults.description}
          aria-invalid={fe.description ? true : undefined}
          aria-describedby={fe.description ? 'description-error' : undefined}
        />
      </Field>

      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
      {state.ok ? (
        <FormMessage tone="success">
          {preserveOnSuccess ? 'Saved.' : 'Event published.'}
        </FormMessage>
      ) : null}

      <Button type="submit" disabled={pending} aria-busy={pending}>
        {pending
          ? preserveOnSuccess
            ? 'Saving…'
            : 'Publishing…'
          : (submitLabel ?? 'Publish event')}
      </Button>
    </form>
  )
}

function Field({
  id,
  label,
  error,
  required,
  children,
}: {
  id: string
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      <FieldError id={`${id}-error`} error={error} />
    </div>
  )
}

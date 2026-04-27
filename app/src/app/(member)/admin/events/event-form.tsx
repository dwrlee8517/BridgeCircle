'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createEventAction, type EventCreateFormState } from './actions'

const initialState: EventCreateFormState = {}

export function EventForm() {
  const [state, action, pending] = useActionState(createEventAction, initialState)
  const fe = state.fieldErrors ?? {}
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.ok && formRef.current) formRef.current.reset()
  }, [state.ok])

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <Field id="title" label="Title" error={fe.title} required>
        <Input id="title" name="title" required maxLength={200} placeholder="Spring alumni mixer" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="startsAt" label="Start" error={fe.startsAt} required>
          <Input id="startsAt" name="startsAt" type="datetime-local" required />
        </Field>
        <Field id="location" label="Location" error={fe.location}>
          <Input id="location" name="location" maxLength={200} placeholder="Palos Verdes campus" />
        </Field>
      </div>

      <Field id="description" label="Description" error={fe.description}>
        <Textarea
          id="description"
          name="description"
          rows={4}
          maxLength={2000}
          placeholder="What's the agenda? Anything attendees should bring?"
        />
      </Field>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-emerald-600">Event published.</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? 'Publishing…' : 'Publish event'}
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
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

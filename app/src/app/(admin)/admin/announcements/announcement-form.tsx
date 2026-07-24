'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldError, FormMessage } from '@/components/ui/form-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { type AnnouncementFormState, createAnnouncementAction } from './actions'

const initialState: AnnouncementFormState = {}

/**
 * Compose form for a School announcement. Publishing creates durable in-app
 * notifications through the outbox; delivery is not coupled to this request.
 */
export function AnnouncementForm() {
  const [state, action, pending] = useActionState(createAnnouncementAction, initialState)
  const fe = state.fieldErrors ?? {}
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.ok && formRef.current) formRef.current.reset()
  }, [state.ok])

  useEffect(() => {
    if (state.error || state.fieldErrors) {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    }
  }, [state.error, state.fieldErrors])

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <Field id="ann-title" label="Title" error={fe.title} required>
        <Input
          id="ann-title"
          name="title"
          required
          maxLength={200}
          placeholder="Spring fundraiser this Saturday"
          aria-invalid={fe.title ? true : undefined}
          aria-describedby={fe.title ? 'ann-title-error' : undefined}
        />
      </Field>

      <Field id="ann-body" label="Message" error={fe.body}>
        <Textarea
          id="ann-body"
          name="body"
          rows={6}
          maxLength={5000}
          placeholder={"What's the news? Be specific — date, time, what you need from members."}
          aria-invalid={fe.body ? true : undefined}
          aria-describedby={fe.body ? 'ann-body-error' : undefined}
        />
      </Field>

      <Field id="ann-tag" label="Category" error={fe.tag} required>
        <select
          id="ann-tag"
          name="tag"
          defaultValue="general"
          className="h-10 w-full rounded-[var(--radius-md)] border border-input bg-background px-3 text-sm"
          aria-invalid={fe.tag ? true : undefined}
          aria-describedby={fe.tag ? 'ann-tag-error' : undefined}
        >
          <option value="general">General</option>
          <option value="mentorship">Career guidance</option>
          <option value="hiring">Hiring</option>
          <option value="reunion">Reunion</option>
        </select>
      </Field>

      <div className="flex items-start gap-3 rounded-[var(--radius-md)] bg-muted/50 p-3">
        <Checkbox id="ann-pinned" name="pinned" />
        <div className="space-y-1">
          <Label htmlFor="ann-pinned">Pin in the announcement archive</Label>
          <p className="text-xs text-muted-foreground">
            Pinned announcements stay ahead of newer posts until the pin is removed.
          </p>
        </div>
      </div>

      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
      {state.ok ? <FormMessage tone="success">Announcement published.</FormMessage> : null}

      <Button type="submit" disabled={pending} aria-busy={pending}>
        {pending ? 'Publishing…' : 'Publish announcement'}
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

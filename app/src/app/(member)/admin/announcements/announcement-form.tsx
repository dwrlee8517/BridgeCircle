'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { type AnnouncementFormState, createAnnouncementAction } from './actions'

const initialState: AnnouncementFormState = {}

/**
 * Compose form for a new announcement. Title required, body optional. The
 * "send email" checkbox fans out a one-shot Resend email to every active
 * member. Default off — admin opts in per announcement.
 */
export function AnnouncementForm() {
  const [state, action, pending] = useActionState(createAnnouncementAction, initialState)
  const fe = state.fieldErrors ?? {}
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.ok && formRef.current) formRef.current.reset()
  }, [state.ok])

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <Field id="ann-title" label="Title" error={fe.title} required>
        <Input
          id="ann-title"
          name="title"
          required
          maxLength={200}
          placeholder="Spring fundraiser this Saturday"
        />
      </Field>

      <Field id="ann-body" label="Message" error={fe.body}>
        <Textarea
          id="ann-body"
          name="body"
          rows={6}
          maxLength={5000}
          placeholder={"What's the news? Be specific — date, time, what you need from members."}
        />
      </Field>

      <div className="flex items-start gap-3">
        <Checkbox id="ann-sendEmail" name="sendEmail" />
        <div className="space-y-1">
          <Label htmlFor="ann-sendEmail">Email this to every active member</Label>
          <p className="text-xs text-muted-foreground">
            Off by default. Use sparingly — it lands in everyone&apos;s inbox immediately.
          </p>
        </div>
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.ok ? (
        <p className="text-sm text-accent-sage">
          Announcement published.
          {state.emailsAttempted
            ? ` Emailed ${state.emailsSent} of ${state.emailsAttempted} member${state.emailsAttempted === 1 ? '' : 's'}.`
            : ''}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
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
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

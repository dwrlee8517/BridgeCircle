'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { FieldError, FormMessage } from '@/components/ui/form-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type StepAboutState = {
  error?: string
  fieldErrors?: Record<string, string>
}

const initialState: StepAboutState = {}

type Props = {
  defaults: {
    name: string
    preferredName: string
    nameOther: string
    graduationYear: string
  }
  action: (state: StepAboutState, formData: FormData) => Promise<StepAboutState>
}

/**
 * Step 1 of 7 — About you.
 *
 * Two required fields (name, graduation year) with prefill where possible.
 * Two optional name fields (preferred + name_other) for members who go by
 * a different name in their cohort or have a name in another language —
 * important for Chadwick US ↔ Chadwick International overlap.
 *
 * No skip button on step 1: every member needs at least a name + grad
 * year to be in the directory.
 */
export function StepAbout({ defaults, action }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const fe = state.fieldErrors ?? {}
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.error || state.fieldErrors) {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    }
  }, [state.error, state.fieldErrors])

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      <Field
        id="name"
        label="Full name"
        hint="Your name as it should appear on your profile."
        error={fe.name}
      >
        <Input
          id="name"
          name="name"
          defaultValue={defaults.name}
          required
          autoComplete="name"
          aria-invalid={fe.name ? true : undefined}
          aria-describedby={fe.name ? 'name-hint name-error' : 'name-hint'}
        />
      </Field>

      <Field
        id="preferredName"
        label="Preferred name"
        hint="What people in the network should call you. Defaults to your full name when blank."
        optional
        error={fe.preferredName}
      >
        <Input
          id="preferredName"
          name="preferredName"
          defaultValue={defaults.preferredName}
          placeholder="e.g. Sue"
          aria-invalid={fe.preferredName ? true : undefined}
          aria-describedby={
            fe.preferredName ? 'preferredName-hint preferredName-error' : 'preferredName-hint'
          }
        />
      </Field>

      <Field
        id="nameOther"
        label="Also known as"
        hint="Other names you go by — Korean name, nickname, etc. Searchable by anyone in the circle."
        optional
        error={fe.nameOther}
      >
        <Input
          id="nameOther"
          name="nameOther"
          defaultValue={defaults.nameOther}
          placeholder="e.g. Sam"
          aria-invalid={fe.nameOther ? true : undefined}
          aria-describedby={fe.nameOther ? 'nameOther-hint nameOther-error' : 'nameOther-hint'}
        />
      </Field>

      <Field
        id="graduationYear"
        label="Graduation year"
        hint="The year you graduated from your school."
        error={fe.graduationYear}
      >
        <Input
          id="graduationYear"
          name="graduationYear"
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={4}
          defaultValue={defaults.graduationYear}
          required
          aria-invalid={fe.graduationYear ? true : undefined}
          aria-describedby={
            fe.graduationYear ? 'graduationYear-hint graduationYear-error' : 'graduationYear-hint'
          }
        />
      </Field>

      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}

      <div className="pt-2">
        <Button type="submit" disabled={pending} aria-busy={pending} className="w-full">
          {pending ? 'Saving…' : 'Save and continue'}
        </Button>
      </div>
    </form>
  )
}

function Field({
  id,
  label,
  hint,
  optional,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  optional?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="flex items-baseline gap-2">
        {label}
        {optional ? (
          <span className="text-xs font-normal text-muted-foreground">Optional</span>
        ) : null}
      </Label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      <FieldError id={`${id}-error`} error={error} />
    </div>
  )
}

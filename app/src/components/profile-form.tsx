'use client'

import { useActionState } from 'react'
import {
  type CareerEntryInput,
  CareerHistoryField,
  type EducationEntryInput,
  EducationHistoryField,
  SkillsField,
} from '@/components/profile-history-fields'
import { FieldError, FormMessage } from '@/components/ui/form-message'
import { FormSubmitButton } from '@/components/ui/form-submit-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export type ProfileFormState = {
  error?: string
  fieldErrors?: Record<string, string>
}

export type ProfileFormDefaults = {
  name: string
  preferredName: string
  nameOther: string
  city: string
  currentEmployer: string
  currentTitle: string
  university: string
  major: string
  graduationYear: string
  headline: string
  bio: string
  linkedinUrl: string
  avatarUrl: string
  /** Already-saved JSONB arrays. Editors are seeded from these. */
  skills: string[]
  careerHistory: CareerEntryInput[]
  educationHistory: EducationEntryInput[]
}

type Props = {
  defaults: ProfileFormDefaults
  action: (state: ProfileFormState, formData: FormData) => Promise<ProfileFormState>
  submitLabel?: string
  submittingLabel?: string
}

const initialState: ProfileFormState = {}

export function ProfileForm({
  defaults,
  action,
  submitLabel = 'Save and continue',
  submittingLabel = 'Saving…',
}: Props) {
  const [state, formAction] = useActionState(action, initialState)
  const fe = state.fieldErrors ?? {}

  return (
    <form action={formAction} className="space-y-5">
      <Section title="Basics">
        <Field id="name" label="Full name" error={fe.name} required>
          <Input id="name" name="name" defaultValue={defaults.name} required />
        </Field>
        <Field id="preferredName" label="Preferred name (optional)" error={fe.preferredName}>
          <Input
            id="preferredName"
            name="preferredName"
            defaultValue={defaults.preferredName}
            placeholder="What other alumni should call you"
          />
        </Field>
        <Field id="nameOther" label="Also known as (optional)" error={fe.nameOther}>
          <Input
            id="nameOther"
            name="nameOther"
            defaultValue={defaults.nameOther}
            placeholder="e.g. Sam, or a nickname"
          />
        </Field>
        <Field id="graduationYear" label="Graduation year" error={fe.graduationYear} required>
          <Input
            id="graduationYear"
            name="graduationYear"
            inputMode="numeric"
            pattern="\d{4}"
            defaultValue={defaults.graduationYear}
            required
          />
        </Field>
        <Field id="city" label="City" error={fe.city} required>
          <Input id="city" name="city" defaultValue={defaults.city} required />
        </Field>
      </Section>

      <Section title="Work">
        <Field id="currentEmployer" label="Current employer" error={fe.currentEmployer} required>
          <Input
            id="currentEmployer"
            name="currentEmployer"
            defaultValue={defaults.currentEmployer}
            required
          />
        </Field>
        <Field id="currentTitle" label="Current title" error={fe.currentTitle} required>
          <Input
            id="currentTitle"
            name="currentTitle"
            defaultValue={defaults.currentTitle}
            required
          />
        </Field>
      </Section>

      <Section title="Education">
        <Field id="university" label="University" error={fe.university} required>
          <Input id="university" name="university" defaultValue={defaults.university} required />
        </Field>
        <Field id="major" label="Major" error={fe.major} required>
          <Input id="major" name="major" defaultValue={defaults.major} required />
        </Field>
        <EducationHistoryField initial={defaults.educationHistory} />
        <FieldError error={fe.educationHistory} />
      </Section>

      <Section title="Career history">
        <CareerHistoryField initial={defaults.careerHistory} />
        <FieldError error={fe.careerHistory} />
      </Section>

      <Section title="Skills">
        <SkillsField initial={defaults.skills} />
        <FieldError error={fe.skills} />
      </Section>

      <Section title="Optional">
        <Field id="headline" label="Headline (one line)" error={fe.headline}>
          <Input
            id="headline"
            name="headline"
            placeholder="e.g. Senior PM, formerly at Stripe"
            defaultValue={defaults.headline}
          />
        </Field>
        <Field id="bio" label="Bio" error={fe.bio}>
          <Textarea id="bio" name="bio" rows={3} defaultValue={defaults.bio} />
        </Field>
        <Field id="linkedinUrl" label="LinkedIn URL" error={fe.linkedinUrl}>
          <Input
            id="linkedinUrl"
            name="linkedinUrl"
            type="url"
            placeholder="https://linkedin.com/in/…"
            defaultValue={defaults.linkedinUrl}
          />
        </Field>
        <Field id="avatarUrl" label="Profile picture URL" error={fe.avatarUrl}>
          <Input
            id="avatarUrl"
            name="avatarUrl"
            type="url"
            placeholder="Link to a photo (LinkedIn, Gravatar, etc.)"
            defaultValue={defaults.avatarUrl}
          />
        </Field>
      </Section>

      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}

      <FormSubmitButton className="w-full" pendingLabel={submittingLabel}>
        {submitLabel}
      </FormSubmitButton>
    </form>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 border-t pt-5 first:border-t-0 first:pt-0">
      <legend className="text-kicker font-semibold uppercase tracking-hero text-muted-foreground">
        {title}
      </legend>
      {children}
    </fieldset>
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
      <FieldError error={error} />
    </div>
  )
}

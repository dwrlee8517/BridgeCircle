'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { saveProfile, type OnboardingState } from './actions'

const initialState: OnboardingState = {}

type Defaults = {
  name: string
  city: string
  currentEmployer: string
  currentTitle: string
  university: string
  major: string
  graduationYear: string
  openToMentor: boolean
  headline: string
  bio: string
  linkedinUrl: string
  avatarUrl: string
  mentoringTopics: string
}

export function OnboardingForm({ defaults }: { defaults: Defaults }) {
  const [state, action, pending] = useActionState(saveProfile, initialState)
  const fe = state.fieldErrors ?? {}

  return (
    <form action={action} className="space-y-5">
      <Section title="Basics">
        <Field id="name" label="Full name" error={fe.name} required>
          <Input id="name" name="name" defaultValue={defaults.name} required />
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
          <Input
            id="university"
            name="university"
            defaultValue={defaults.university}
            required
          />
        </Field>
        <Field id="major" label="Major" error={fe.major} required>
          <Input id="major" name="major" defaultValue={defaults.major} required />
        </Field>
      </Section>

      <Section title="Mentorship">
        <div className="flex items-start gap-3">
          <Checkbox id="openToMentor" name="openToMentor" defaultChecked={defaults.openToMentor} />
          <div className="space-y-1">
            <Label htmlFor="openToMentor">I'm open to mentoring other alumni</Label>
            <p className="text-xs text-muted-foreground">
              You can change this any time in mentor settings.
            </p>
          </div>
        </div>
        <Field
          id="mentoringTopics"
          label="Topics you can help with (comma-separated, optional)"
          error={fe.mentoringTopics}
        >
          <Input
            id="mentoringTopics"
            name="mentoringTopics"
            placeholder="e.g. consulting, business school, returning to Korea"
            defaultValue={defaults.mentoringTopics}
          />
        </Field>
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

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Saving…' : 'Save and continue'}
      </Button>
    </form>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">{title}</legend>
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
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

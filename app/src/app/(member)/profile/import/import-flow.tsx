'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { CareerEntry, EducationEntry, ExtractedProfile } from '@/lib/resume/schemas'
import {
  type ApplyState,
  applyExtractedAction,
  type ExtractState,
  extractFromUploadAction,
} from './actions'

export type CurrentProfile = {
  name: string | null
  headline: string | null
  city: string | null
  currentEmployer: string | null
  currentTitle: string | null
  university: string | null
  major: string | null
}

const SCALAR_FIELDS = [
  { key: 'name', label: 'Full name' },
  { key: 'headline', label: 'Headline' },
  { key: 'city', label: 'City' },
  { key: 'currentEmployer', label: 'Current employer' },
  { key: 'currentTitle', label: 'Current title' },
  { key: 'university', label: 'University' },
  { key: 'major', label: 'Major' },
] as const

type ScalarKey = (typeof SCALAR_FIELDS)[number]['key']

type ScalarChoice = { use: boolean; value: string | null }
type CareerChoice = CareerEntry & { use: boolean; _key: string }
type EducationChoice = EducationEntry & { use: boolean; _key: string }
type SkillChoice = { use: boolean; value: string; _key: string }

let nextKey = 0
function k(): string {
  nextKey += 1
  return `k${nextKey}`
}

type Props = {
  current: CurrentProfile
  returnTo: string
}

export function ImportFlow({ current, returnTo }: Props) {
  const [extractState, extractAction, extractPending] = useActionState<ExtractState, FormData>(
    extractFromUploadAction,
    {},
  )

  const [applyState, applyAction, applyPending] = useActionState<ApplyState, FormData>(
    applyExtractedAction,
    {},
  )

  // Once extraction lands, copy results into local editable state.
  const profile = extractState.profile ?? null

  if (!profile) {
    return (
      <UploadStep
        action={extractAction}
        pending={extractPending}
        error={extractState.error}
        returnTo={returnTo}
      />
    )
  }

  return (
    <ConfirmStep
      profile={profile}
      current={current}
      action={applyAction}
      pending={applyPending}
      error={applyState.error}
      returnTo={returnTo}
    />
  )
}

function UploadStep({
  action,
  pending,
  error,
  returnTo,
}: {
  action: (formData: FormData) => void
  pending: boolean
  error?: string
  returnTo: string
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="file">Upload your resume</Label>
        <Input id="file" name="file" type="file" accept=".pdf,.docx" required disabled={pending} />
        <p className="text-xs text-muted-foreground">
          PDF or DOCX, up to 5MB. We'll extract your career history, education, and skills, then let
          you confirm before saving anything.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Extracting…' : 'Upload and extract'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={returnTo}>Cancel</Link>
        </Button>
      </div>

      {pending ? (
        <p className="text-xs text-muted-foreground">
          Reading your resume — this usually takes 5–15 seconds.
        </p>
      ) : null}
    </form>
  )
}

function ConfirmStep({
  profile,
  current,
  action,
  pending,
  error,
  returnTo,
}: {
  profile: ExtractedProfile
  current: CurrentProfile
  action: (formData: FormData) => void
  pending: boolean
  error?: string
  returnTo: string
}) {
  // Local editable state seeded from the extraction.
  const [scalars, setScalars] = useState<Record<ScalarKey, ScalarChoice>>(() => ({
    name: { use: profile.name !== null, value: profile.name },
    headline: { use: profile.headline !== null, value: profile.headline },
    city: { use: profile.city !== null, value: profile.city },
    currentEmployer: { use: profile.currentEmployer !== null, value: profile.currentEmployer },
    currentTitle: { use: profile.currentTitle !== null, value: profile.currentTitle },
    university: { use: profile.university !== null, value: profile.university },
    major: { use: profile.major !== null, value: profile.major },
  }))

  const [careerHistory, setCareerHistory] = useState<CareerChoice[]>(() =>
    profile.careerHistory.map((e) => ({ ...e, use: true, _key: k() })),
  )

  const [educationHistory, setEducationHistory] = useState<EducationChoice[]>(() =>
    profile.educationHistory.map((e) => ({ ...e, use: true, _key: k() })),
  )

  const [skills, setSkills] = useState<SkillChoice[]>(() =>
    profile.skills.map((s) => ({ use: true, value: s, _key: k() })),
  )

  const [newSkill, setNewSkill] = useState('')

  function setScalar(key: ScalarKey, patch: Partial<ScalarChoice>) {
    setScalars((s) => ({ ...s, [key]: { ...s[key], ...patch } }))
  }

  function patchCareer(idx: number, patch: Partial<CareerChoice>) {
    setCareerHistory((cs) => cs.map((e, i) => (i === idx ? { ...e, ...patch } : e)))
  }

  function patchEducation(idx: number, patch: Partial<EducationChoice>) {
    setEducationHistory((es) => es.map((e, i) => (i === idx ? { ...e, ...patch } : e)))
  }

  function addSkill() {
    const v = newSkill.trim()
    if (!v) return
    if (skills.some((s) => s.value.toLowerCase() === v.toLowerCase())) {
      setNewSkill('')
      return
    }
    setSkills((s) => [...s, { use: true, value: v, _key: k() }])
    setNewSkill('')
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData()
    fd.set('return', returnTo)
    // Strip the synthetic React keys before serializing — the server schema
    // doesn't know about them.
    const stripKey = <T extends { _key: string }>({ _key, ...rest }: T) => rest
    fd.set(
      'selections',
      JSON.stringify({
        scalars,
        careerHistory: careerHistory.map(stripKey),
        educationHistory: educationHistory.map(stripKey),
        skills: skills.map(stripKey),
      }),
    )
    action(fd)
  }

  const includedCount =
    Object.values(scalars).filter((s) => s.use).length +
    careerHistory.filter((e) => e.use).length +
    educationHistory.filter((e) => e.use).length +
    skills.filter((s) => s.use).length

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-md border bg-emerald-50 p-3 text-sm text-emerald-900">
        Extracted. Review each item below — uncheck anything you don't want, edit values inline,
        then click Apply. Nothing is saved until you confirm.
      </div>

      <Section title="Profile fields">
        <div className="space-y-3">
          {SCALAR_FIELDS.map(({ key, label }) => (
            <ScalarRow
              key={key}
              label={label}
              choice={scalars[key]}
              currentValue={current[key]}
              onChange={(patch) => setScalar(key, patch)}
            />
          ))}
        </div>
      </Section>

      <Section
        title="Career history"
        subtitle={`${careerHistory.filter((e) => e.use).length} of ${careerHistory.length} included`}
      >
        {careerHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">None extracted.</p>
        ) : (
          <div className="space-y-3">
            {careerHistory.map((entry, idx) => (
              <CareerCard
                key={entry._key}
                entry={entry}
                onChange={(patch) => patchCareer(idx, patch)}
              />
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Education"
        subtitle={`${educationHistory.filter((e) => e.use).length} of ${educationHistory.length} included`}
      >
        {educationHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">None extracted.</p>
        ) : (
          <div className="space-y-3">
            {educationHistory.map((entry, idx) => (
              <EducationCard
                key={entry._key}
                entry={entry}
                onChange={(patch) => patchEducation(idx, patch)}
              />
            ))}
          </div>
        )}
      </Section>

      <Section title="Skills" subtitle={`${skills.filter((s) => s.use).length} included`}>
        <div className="flex flex-wrap gap-1.5">
          {skills.map((s, idx) => (
            <button
              type="button"
              key={s._key}
              onClick={() =>
                setSkills((arr) => arr.map((x, i) => (i === idx ? { ...x, use: !x.use } : x)))
              }
              className={`rounded-full border px-2.5 py-0.5 text-xs ${
                s.use
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-muted-foreground/30 text-muted-foreground line-through'
              }`}
            >
              {s.value}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Add a skill"
            className="max-w-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addSkill()
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addSkill} disabled={!newSkill.trim()}>
            Add
          </Button>
        </div>
      </Section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex items-center justify-between gap-2 sticky bottom-0 -mx-1 border-t bg-background py-3 px-1">
        <p className="text-xs text-muted-foreground">{includedCount} items selected</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href={returnTo}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={pending || includedCount === 0}>
            {pending ? 'Applying…' : 'Apply selected'}
          </Button>
        </div>
      </div>
    </form>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle ? <span className="text-xs text-muted-foreground">{subtitle}</span> : null}
      </div>
      {children}
    </div>
  )
}

function ScalarRow({
  label,
  choice,
  currentValue,
  onChange,
}: {
  label: string
  choice: ScalarChoice
  currentValue: string | null
  onChange: (patch: Partial<ScalarChoice>) => void
}) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
      <Checkbox
        checked={choice.use}
        onCheckedChange={(v) => onChange({ use: v === true })}
        className="mt-1"
        aria-label={`Include ${label}`}
      />
      <div className="space-y-1">
        <Label className="text-sm">{label}</Label>
        <Input
          value={choice.value ?? ''}
          onChange={(e) => onChange({ value: e.target.value || null })}
          disabled={!choice.use}
          placeholder="(empty)"
        />
        {currentValue && currentValue !== choice.value ? (
          <p className="text-xs text-muted-foreground">
            Currently: <span className="italic">{currentValue}</span>
          </p>
        ) : null}
      </div>
    </div>
  )
}

function CareerCard({
  entry,
  onChange,
}: {
  entry: CareerChoice
  onChange: (patch: Partial<CareerChoice>) => void
}) {
  return (
    <div className={`rounded-md border p-3 space-y-2 ${entry.use ? '' : 'opacity-50'}`}>
      <div className="flex items-center gap-2">
        <Checkbox
          checked={entry.use}
          onCheckedChange={(v) => onChange({ use: v === true })}
          aria-label="Include this role"
        />
        <span className="text-xs text-muted-foreground">
          {entry.startDate ?? '?'} – {entry.endDate ?? 'present'}
        </span>
        {entry.endDate === null ? (
          <Badge variant="secondary" className="text-[10px]">
            current
          </Badge>
        ) : null}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          value={entry.title}
          onChange={(e) => onChange({ title: e.target.value })}
          disabled={!entry.use}
          placeholder="Title"
        />
        <Input
          value={entry.employer}
          onChange={(e) => onChange({ employer: e.target.value })}
          disabled={!entry.use}
          placeholder="Employer"
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          value={entry.startDate ?? ''}
          onChange={(e) => onChange({ startDate: e.target.value || null })}
          disabled={!entry.use}
          placeholder="Start (YYYY or YYYY-MM)"
        />
        <Input
          value={entry.endDate ?? ''}
          onChange={(e) => onChange({ endDate: e.target.value || null })}
          disabled={!entry.use}
          placeholder="End (blank = current)"
        />
      </div>
      <Textarea
        value={entry.description ?? ''}
        onChange={(e) => onChange({ description: e.target.value || null })}
        disabled={!entry.use}
        placeholder="One-sentence description (optional)"
        rows={2}
      />
    </div>
  )
}

function EducationCard({
  entry,
  onChange,
}: {
  entry: EducationChoice
  onChange: (patch: Partial<EducationChoice>) => void
}) {
  return (
    <div className={`rounded-md border p-3 space-y-2 ${entry.use ? '' : 'opacity-50'}`}>
      <div className="flex items-center gap-2">
        <Checkbox
          checked={entry.use}
          onCheckedChange={(v) => onChange({ use: v === true })}
          aria-label="Include this education"
        />
        <span className="text-xs text-muted-foreground">
          {entry.startDate ?? '?'} – {entry.endDate ?? '?'}
        </span>
      </div>
      <Input
        value={entry.school}
        onChange={(e) => onChange({ school: e.target.value })}
        disabled={!entry.use}
        placeholder="School"
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          value={entry.degree ?? ''}
          onChange={(e) => onChange({ degree: e.target.value || null })}
          disabled={!entry.use}
          placeholder="Degree (optional)"
        />
        <Input
          value={entry.field ?? ''}
          onChange={(e) => onChange({ field: e.target.value || null })}
          disabled={!entry.use}
          placeholder="Field (optional)"
        />
      </div>
    </div>
  )
}

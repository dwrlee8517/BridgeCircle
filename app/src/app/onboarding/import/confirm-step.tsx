'use client'

import Link from 'next/link'
import { useId, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ImportCurrentProfile } from '@/lib/onboarding/import-current-profile'
import type { CareerEntry, EducationEntry, ExtractedProfile } from '@/lib/resume/schemas'

/**
 * Shared confirm UI for the import flow (resume + LinkedIn) and the proposal
 * review (manual refresh + monthly sweep). All four entry points reach this
 * same dual-seed UI with per-row checkboxes; the differences are limited to:
 *   - `cancelHref`     — where Cancel links to
 *   - `hiddenFields`   — extra hidden inputs serialized onto the submit
 *                        (e.g. proposalId for the proposal review path)
 *   - `newBadgeLabel`  — the "from X" badge on newly-extracted entries
 *   - `headerBanner`   — the optional emerald banner copy (omitted on proposal
 *                        review where the page header already explains)
 *   - extra buttons via `extraActions` (e.g. Decline on the proposal review)
 */

export type CurrentProfile = ImportCurrentProfile

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
type CareerChoice = CareerEntry & { use: boolean; _key: string; _origin: 'saved' | 'new' }
type EducationChoice = EducationEntry & { use: boolean; _key: string; _origin: 'saved' | 'new' }
type SkillChoice = { use: boolean; value: string; _key: string; _origin: 'saved' | 'new' }

let nextKey = 0
function k(): string {
  nextKey += 1
  return `k${nextKey}`
}

function stripChoiceKey<T extends { _key: string }>({ _key: _discarded, ...rest }: T) {
  return rest
}

export function ConfirmStep({
  profile,
  current,
  action,
  pending,
  error,
  cancelHref,
  hiddenFields = {},
  headerBanner = "Extracted. Review each item below — uncheck anything you don't want, edit values inline, then click Apply. Nothing is saved until you confirm.",
  newBadgeLabel = 'from resume',
  submitLabel = 'Apply selected',
  extraActions,
}: {
  profile: ExtractedProfile
  current: CurrentProfile
  action: (formData: FormData) => void
  pending: boolean
  error?: string
  cancelHref: string
  hiddenFields?: Record<string, string>
  headerBanner?: string | null
  newBadgeLabel?: string
  submitLabel?: string
  extraActions?: React.ReactNode
}) {
  const [scalars, setScalars] = useState<Record<ScalarKey, ScalarChoice>>(() => ({
    name: { use: profile.name !== null, value: profile.name },
    headline: { use: profile.headline !== null, value: profile.headline },
    city: { use: profile.city !== null, value: profile.city },
    currentEmployer: { use: profile.currentEmployer !== null, value: profile.currentEmployer },
    currentTitle: { use: profile.currentTitle !== null, value: profile.currentTitle },
    university: { use: profile.university !== null, value: profile.university },
    major: { use: profile.major !== null, value: profile.major },
  }))

  const [careerHistory, setCareerHistory] = useState<CareerChoice[]>(() => {
    const savedKeys = new Set(
      current.careerHistory.map(
        (e) => `${e.employer.toLowerCase()}|${e.title.toLowerCase()}|${e.start_date ?? ''}`,
      ),
    )
    const saved: CareerChoice[] = current.careerHistory.map((e) => ({
      employer: e.employer,
      title: e.title,
      startDate: e.start_date,
      endDate: e.end_date,
      description: e.description,
      use: true,
      _key: k(),
      _origin: 'saved',
    }))
    const extras: CareerChoice[] = profile.careerHistory
      .filter(
        (e) =>
          !savedKeys.has(
            `${e.employer.toLowerCase()}|${e.title.toLowerCase()}|${e.startDate ?? ''}`,
          ),
      )
      .map((e) => ({ ...e, use: true, _key: k(), _origin: 'new' }))
    return [...saved, ...extras]
  })

  const [educationHistory, setEducationHistory] = useState<EducationChoice[]>(() => {
    const savedKeys = new Set(
      current.educationHistory.map((e) => `${e.school.toLowerCase()}|${e.start_date ?? ''}`),
    )
    const saved: EducationChoice[] = current.educationHistory.map((e) => ({
      school: e.school,
      degree: e.degree,
      field: e.field,
      startDate: e.start_date,
      endDate: e.end_date,
      use: true,
      _key: k(),
      _origin: 'saved',
    }))
    const extras: EducationChoice[] = profile.educationHistory
      .filter((e) => !savedKeys.has(`${e.school.toLowerCase()}|${e.startDate ?? ''}`))
      .map((e) => ({ ...e, use: true, _key: k(), _origin: 'new' }))
    return [...saved, ...extras]
  })

  const [skills, setSkills] = useState<SkillChoice[]>(() => {
    const savedSet = new Set(current.skills.map((s) => s.toLowerCase()))
    const saved: SkillChoice[] = current.skills.map((s) => ({
      use: true,
      value: s,
      _key: k(),
      _origin: 'saved',
    }))
    const extras: SkillChoice[] = profile.skills
      .filter((s) => !savedSet.has(s.toLowerCase()))
      .map((s) => ({ use: true, value: s, _key: k(), _origin: 'new' }))
    return [...saved, ...extras]
  })

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
    setSkills((s) => [...s, { use: true, value: v, _key: k(), _origin: 'new' }])
    setNewSkill('')
  }

  const includedCount =
    Object.values(scalars).filter((s) => s.use).length +
    careerHistory.filter((e) => e.use).length +
    educationHistory.filter((e) => e.use).length +
    skills.filter((s) => s.use).length

  const selectionsJson = JSON.stringify({
    scalars,
    careerHistory: careerHistory.map(stripChoiceKey),
    educationHistory: educationHistory.map(stripChoiceKey),
    skills: skills.map(stripChoiceKey),
  })

  return (
    <form action={action} className="space-y-6">
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <input type="hidden" name="selections" value={selectionsJson} />

      {headerBanner ? (
        <div className="rounded-md border border-accent-sage/25 bg-accent-sage/10 p-3 text-sm text-foreground">
          {headerBanner}
        </div>
      ) : null}

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
          <p className="text-sm text-muted-foreground">
            Nothing on your profile and nothing extracted.
          </p>
        ) : (
          <div className="space-y-3">
            {careerHistory.map((entry, idx) => (
              <CareerCard
                key={entry._key}
                entry={entry}
                newBadgeLabel={newBadgeLabel}
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
          <p className="text-sm text-muted-foreground">
            Nothing on your profile and nothing extracted.
          </p>
        ) : (
          <div className="space-y-3">
            {educationHistory.map((entry, idx) => (
              <EducationCard
                key={entry._key}
                entry={entry}
                newBadgeLabel={newBadgeLabel}
                onChange={(patch) => patchEducation(idx, patch)}
              />
            ))}
          </div>
        )}
      </Section>

      <Section title="Skills" subtitle={`${skills.filter((s) => s.use).length} included`}>
        <p className="text-xs text-muted-foreground">
          Click any chip to remove it (or restore it). Skills already on your profile show with a
          dot.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {skills.map((s, idx) => (
            <button
              type="button"
              key={s._key}
              onClick={() =>
                setSkills((arr) => arr.map((x, i) => (i === idx ? { ...x, use: !x.use } : x)))
              }
              className={`rounded-lg border px-2.5 py-0.5 text-xs ${
                s.use
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-muted-foreground/30 text-muted-foreground line-through'
              }`}
              title={
                s._origin === 'saved'
                  ? 'Already on your profile'
                  : `From this ${newBadgeLabel.replace(/^from\s+/, '')}`
              }
            >
              {s._origin === 'saved' ? '• ' : ''}
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
          {extraActions}
          <Button type="button" variant="outline" asChild>
            <Link href={cancelHref}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Applying…' : submitLabel}
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
  newBadgeLabel,
  onChange,
}: {
  entry: CareerChoice
  newBadgeLabel: string
  onChange: (patch: Partial<CareerChoice>) => void
}) {
  const currentId = useId()
  const [currentlyHere, setCurrentlyHere] = useState(entry.endDate === null)
  function toggleCurrent(next: boolean) {
    setCurrentlyHere(next)
    if (next) onChange({ endDate: null })
  }

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
          <Badge variant="secondary" className="text-xs">
            current
          </Badge>
        ) : null}
        <Badge
          variant={entry._origin === 'saved' ? 'outline' : 'default'}
          className="ml-auto text-xs"
        >
          {entry._origin === 'saved' ? 'on profile' : newBadgeLabel}
        </Badge>
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
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Start</Label>
          <Input
            value={entry.startDate ?? ''}
            onChange={(e) => onChange({ startDate: e.target.value || null })}
            disabled={!entry.use}
            placeholder="YYYY or YYYY-MM"
            inputMode="numeric"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">End</Label>
          <Input
            value={entry.endDate ?? ''}
            onChange={(e) => onChange({ endDate: e.target.value || null })}
            disabled={!entry.use || currentlyHere}
            placeholder={currentlyHere ? 'Present' : 'YYYY or YYYY-MM'}
            inputMode="numeric"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id={currentId}
          checked={currentlyHere}
          onCheckedChange={(v) => toggleCurrent(v === true)}
          disabled={!entry.use}
        />
        <Label htmlFor={currentId} className="cursor-pointer text-xs text-muted-foreground">
          I currently work here
        </Label>
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
  newBadgeLabel,
  onChange,
}: {
  entry: EducationChoice
  newBadgeLabel: string
  onChange: (patch: Partial<EducationChoice>) => void
}) {
  const currentId = useId()
  const [currentlyHere, setCurrentlyHere] = useState(entry.endDate === null)
  function toggleCurrent(next: boolean) {
    setCurrentlyHere(next)
    if (next) onChange({ endDate: null })
  }

  return (
    <div className={`rounded-md border p-3 space-y-2 ${entry.use ? '' : 'opacity-50'}`}>
      <div className="flex items-center gap-2">
        <Checkbox
          checked={entry.use}
          onCheckedChange={(v) => onChange({ use: v === true })}
          aria-label="Include this education"
        />
        <span className="text-xs text-muted-foreground">
          {entry.startDate ?? '?'} – {entry.endDate ?? (currentlyHere ? 'present' : '?')}
        </span>
        <Badge
          variant={entry._origin === 'saved' ? 'outline' : 'default'}
          className="ml-auto text-xs"
        >
          {entry._origin === 'saved' ? 'on profile' : newBadgeLabel}
        </Badge>
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
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Start year</Label>
          <Input
            value={entry.startDate ?? ''}
            onChange={(e) => onChange({ startDate: e.target.value || null })}
            disabled={!entry.use}
            placeholder="YYYY"
            inputMode="numeric"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">End year</Label>
          <Input
            value={entry.endDate ?? ''}
            onChange={(e) => onChange({ endDate: e.target.value || null })}
            disabled={!entry.use || currentlyHere}
            placeholder={currentlyHere ? 'Present' : 'YYYY'}
            inputMode="numeric"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id={currentId}
          checked={currentlyHere}
          onCheckedChange={(v) => toggleCurrent(v === true)}
          disabled={!entry.use}
        />
        <Label htmlFor={currentId} className="cursor-pointer text-xs text-muted-foreground">
          I&apos;m currently studying here
        </Label>
      </div>
    </div>
  )
}

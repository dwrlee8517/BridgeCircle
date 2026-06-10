'use client'

import { Plus, X } from 'lucide-react'
import { useId, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

/**
 * Three structured editors used inside the ProfileForm — career history,
 * education history, and skills. Each component owns its own state, renders
 * the visible UI, and writes a JSON-stringified copy of its current value to
 * a hidden `<input>` so it ships in the standard FormData submission. The
 * server action parses and validates via the existing zod schemas.
 *
 * Shape on the wire (the hidden input values, all JSON-encoded strings):
 *   careerHistory:    Array<{ employer, title, startDate, endDate, description }>
 *   educationHistory: Array<{ school, degree, field, startDate, endDate }>
 *   skills:           string[]
 *
 * Date fields are free text in `YYYY` or `YYYY-MM`. The DB stores them as
 * strings inside the JSONB blob, same shape as the resume-extract path so
 * the two persistence paths agree.
 */

export type CareerEntryInput = {
  employer: string
  title: string
  startDate: string | null
  endDate: string | null
  description: string | null
}

export type EducationEntryInput = {
  school: string
  degree: string | null
  field: string | null
  startDate: string | null
  endDate: string | null
}

let nextKey = 0
function k(): string {
  nextKey += 1
  return `phf-${nextKey}`
}

// =============================================================================
// Skills
// =============================================================================

export function SkillsField({ initial, name = 'skills' }: { initial: string[]; name?: string }) {
  const inputId = useId()
  const [skills, setSkills] = useState<Array<{ value: string; _key: string }>>(() =>
    initial.map((s) => ({ value: s, _key: k() })),
  )
  const [draft, setDraft] = useState('')

  function add() {
    const v = draft.trim()
    if (!v) return
    if (skills.some((s) => s.value.toLowerCase() === v.toLowerCase())) {
      setDraft('')
      return
    }
    setSkills((arr) => [...arr, { value: v, _key: k() }])
    setDraft('')
  }

  function remove(idx: number) {
    setSkills((arr) => arr.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>Skills</Label>
      <input type="hidden" name={name} value={JSON.stringify(skills.map((s) => s.value))} />
      <div className="flex flex-wrap gap-1.5">
        {skills.length === 0 ? (
          <p className="text-xs text-muted-foreground">No skills yet.</p>
        ) : (
          skills.map((s, idx) => (
            <span
              key={s._key}
              className="inline-flex items-center gap-1 rounded-full border border-foreground bg-foreground px-2.5 py-0.5 text-xs text-background"
            >
              {s.value}
              <button
                type="button"
                onClick={() => remove(idx)}
                aria-label={`Remove ${s.value}`}
                className="hover:opacity-75"
              >
                <X className="size-3" />
              </button>
            </span>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <Input
          id={inputId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a skill (e.g. Python)"
          className="max-w-xs"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
        />
        <Button type="button" variant="outline" onClick={add} disabled={!draft.trim()}>
          Add
        </Button>
      </div>
    </div>
  )
}

// =============================================================================
// Career history
// =============================================================================

const EMPTY_CAREER: CareerEntryInput = {
  employer: '',
  title: '',
  startDate: null,
  endDate: null,
  description: null,
}

export function CareerHistoryField({
  initial,
  name = 'careerHistory',
}: {
  initial: CareerEntryInput[]
  name?: string
}) {
  const [items, setItems] = useState<Array<CareerEntryInput & { _key: string }>>(() =>
    initial.map((e) => ({ ...e, _key: k() })),
  )

  function patch(idx: number, p: Partial<CareerEntryInput>) {
    setItems((arr) => arr.map((e, i) => (i === idx ? { ...e, ...p } : e)))
  }
  function remove(idx: number) {
    setItems((arr) => arr.filter((_, i) => i !== idx))
  }
  function add() {
    setItems((arr) => [...arr, { ...EMPTY_CAREER, _key: k() }])
  }

  // What we serialize: only entries with a non-empty employer + title. Empty
  // rows the user added but didn't fill in are silently skipped — keeps the
  // server schema strict without yelling at the user about a placeholder.
  const wire = items
    .filter((e) => e.employer.trim() && e.title.trim())
    .map(({ _key: _, ...rest }) => rest)

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <Label>Career history</Label>
        <span className="text-xs text-muted-foreground">{wire.length} saved</span>
      </div>
      <input type="hidden" name={name} value={JSON.stringify(wire)} />
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Add roles to give other alumni context on your background.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((entry, idx) => (
            <CareerCard
              key={entry._key}
              entry={entry}
              onChange={(p) => patch(idx, p)}
              onRemove={() => remove(idx)}
            />
          ))}
        </div>
      )}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="size-3.5 mr-1" /> Add role
      </Button>
    </div>
  )
}

function CareerCard({
  entry,
  onChange,
  onRemove,
}: {
  entry: CareerEntryInput
  onChange: (p: Partial<CareerEntryInput>) => void
  onRemove: () => void
}) {
  const currentId = useId()
  // "Currently here" is derived from endDate being null at first mount.
  // Tracked separately so the user can uncheck (which re-enables the End
  // input) without us auto-re-ticking on the next render — the source of
  // truth for the wire shape is still entry.endDate.
  const [currentlyHere, setCurrentlyHere] = useState(
    entry.endDate === null && (entry.startDate !== null || entry.employer.trim() !== ''),
  )
  function toggleCurrent(next: boolean) {
    setCurrentlyHere(next)
    if (next) onChange({ endDate: null })
  }

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {entry.startDate ?? '?'} – {entry.endDate ?? 'present'}
        </span>
        {entry.endDate === null && entry.startDate ? (
          <Badge variant="secondary" className="text-xs">
            current
          </Badge>
        ) : null}
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove role"
          className="ml-auto text-muted-foreground hover:text-destructive"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          value={entry.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Title"
        />
        <Input
          value={entry.employer}
          onChange={(e) => onChange({ employer: e.target.value })}
          placeholder="Employer"
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Start</Label>
          <Input
            value={entry.startDate ?? ''}
            onChange={(e) => onChange({ startDate: e.target.value || null })}
            placeholder="YYYY or YYYY-MM"
            inputMode="numeric"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">End</Label>
          <Input
            value={entry.endDate ?? ''}
            onChange={(e) => onChange({ endDate: e.target.value || null })}
            placeholder={currentlyHere ? 'Present' : 'YYYY or YYYY-MM'}
            disabled={currentlyHere}
            inputMode="numeric"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id={currentId}
          checked={currentlyHere}
          onCheckedChange={(v) => toggleCurrent(v === true)}
        />
        <Label htmlFor={currentId} className="cursor-pointer text-xs text-muted-foreground">
          I currently work here
        </Label>
      </div>
      <Textarea
        value={entry.description ?? ''}
        onChange={(e) => onChange({ description: e.target.value || null })}
        placeholder="One-sentence description (optional)"
        rows={2}
      />
    </div>
  )
}

// =============================================================================
// Education history
// =============================================================================

const EMPTY_EDU: EducationEntryInput = {
  school: '',
  degree: null,
  field: null,
  startDate: null,
  endDate: null,
}

export function EducationHistoryField({
  initial,
  name = 'educationHistory',
}: {
  initial: EducationEntryInput[]
  name?: string
}) {
  const [items, setItems] = useState<Array<EducationEntryInput & { _key: string }>>(() =>
    initial.map((e) => ({ ...e, _key: k() })),
  )

  function patch(idx: number, p: Partial<EducationEntryInput>) {
    setItems((arr) => arr.map((e, i) => (i === idx ? { ...e, ...p } : e)))
  }
  function remove(idx: number) {
    setItems((arr) => arr.filter((_, i) => i !== idx))
  }
  function add() {
    setItems((arr) => [...arr, { ...EMPTY_EDU, _key: k() }])
  }

  const wire = items.filter((e) => e.school.trim()).map(({ _key: _, ...rest }) => rest)

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <Label>Education history</Label>
        <span className="text-xs text-muted-foreground">{wire.length} saved</span>
      </div>
      <input type="hidden" name={name} value={JSON.stringify(wire)} />
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Add schools beyond your alumni org if you&apos;d like them to be searchable.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((entry, idx) => (
            <EducationCard
              key={entry._key}
              entry={entry}
              onChange={(p) => patch(idx, p)}
              onRemove={() => remove(idx)}
            />
          ))}
        </div>
      )}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="size-3.5 mr-1" /> Add school
      </Button>
    </div>
  )
}

function EducationCard({
  entry,
  onChange,
  onRemove,
}: {
  entry: EducationEntryInput
  onChange: (p: Partial<EducationEntryInput>) => void
  onRemove: () => void
}) {
  const currentId = useId()
  const [currentlyHere, setCurrentlyHere] = useState(
    entry.endDate === null && (entry.startDate !== null || entry.school.trim() !== ''),
  )
  function toggleCurrent(next: boolean) {
    setCurrentlyHere(next)
    if (next) onChange({ endDate: null })
  }

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {entry.startDate ?? '?'} – {entry.endDate ?? (currentlyHere ? 'present' : '?')}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove education"
          className="ml-auto text-muted-foreground hover:text-destructive"
        >
          <X className="size-4" />
        </button>
      </div>
      <Input
        value={entry.school}
        onChange={(e) => onChange({ school: e.target.value })}
        placeholder="School"
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          value={entry.degree ?? ''}
          onChange={(e) => onChange({ degree: e.target.value || null })}
          placeholder="Degree (optional)"
        />
        <Input
          value={entry.field ?? ''}
          onChange={(e) => onChange({ field: e.target.value || null })}
          placeholder="Field (optional)"
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Start year</Label>
          <Input
            value={entry.startDate ?? ''}
            onChange={(e) => onChange({ startDate: e.target.value || null })}
            placeholder="YYYY"
            inputMode="numeric"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">End year</Label>
          <Input
            value={entry.endDate ?? ''}
            onChange={(e) => onChange({ endDate: e.target.value || null })}
            placeholder={currentlyHere ? 'Present' : 'YYYY'}
            disabled={currentlyHere}
            inputMode="numeric"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id={currentId}
          checked={currentlyHere}
          onCheckedChange={(v) => toggleCurrent(v === true)}
        />
        <Label htmlFor={currentId} className="cursor-pointer text-xs text-muted-foreground">
          I&apos;m currently studying here
        </Label>
      </div>
    </div>
  )
}

'use client'

import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { type ChangeEvent, type FormEvent, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type SearchFormDefaults = {
  nl: string
  q: string
  city: string
  employer: string
  university: string
  major: string
  topic: string
  gradYearMin: string
  gradYearMax: string
  openToMentor: boolean
  peopleIKnow: boolean
}

type Props = {
  defaults: SearchFormDefaults
  filtersOpen: boolean
  /**
   * Fired with a cleaned URLSearchParams (only non-empty, trimmed values).
   * Parent is responsible for `router.push` so it can wrap the navigation in
   * `useTransition` and dim the result list while the new query runs.
   */
  onSearch: (params: URLSearchParams) => void
  /**
   * Fired when the user clicks Clear. The form's DOM inputs are wiped
   * imperatively before this fires so the form visually clears even though
   * inputs are uncontrolled with `defaultValue`.
   */
  onClear: () => void
}

function buildParamsFromForm(form: HTMLFormElement): URLSearchParams {
  const fd = new FormData(form)
  const params = new URLSearchParams()
  for (const [key, value] of fd.entries()) {
    if (typeof value !== 'string') continue
    const trimmed = value.trim()
    if (trimmed.length === 0) continue
    params.set(key, trimmed)
  }
  return params
}

export type ActiveFilterItem = {
  key: keyof SearchFormDefaults
  label: string
  value: string
}

export function SearchForm({ defaults, filtersOpen, onSearch, onClear }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const activeFilters = buildActiveFilters(defaults)
  const activeRefinements = activeFilters.filter((f) => f.key !== 'nl')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSearch(buildParamsFromForm(e.currentTarget))
  }

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const form = e.currentTarget.form
    if (!form) return
    onSearch(buildParamsFromForm(form))
  }

  const handleClearClick = () => {
    const form = formRef.current
    if (form) {
      for (const input of form.querySelectorAll('input')) {
        if (input.type === 'checkbox' || input.type === 'radio') input.checked = false
        else input.value = ''
      }
    }
    onClear()
  }

  const handleRemoveFilter = (key: keyof SearchFormDefaults) => {
    const form = formRef.current
    if (!form) return
    const input = form.querySelector(`[name="${key}"]`) as HTMLInputElement | null
    if (input) {
      if (input.type === 'checkbox' || input.type === 'radio') {
        input.checked = false
      } else {
        input.value = ''
      }
    }
    // Handle dual graduation year fields
    if (key === 'gradYearMin' || key === 'gradYearMax') {
      const minInput = form.querySelector('[name="gradYearMin"]') as HTMLInputElement | null
      const maxInput = form.querySelector('[name="gradYearMax"]') as HTMLInputElement | null
      if (key === 'gradYearMin' && minInput) minInput.value = ''
      if (key === 'gradYearMax' && maxInput) maxInput.value = ''
    }
    onSearch(buildParamsFromForm(form))
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="nl">What kind of alumni are you looking for?</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="nl"
            name="nl"
            placeholder="e.g. someone who can mentor me on a photography career in the US"
            defaultValue={defaults.nl}
            className="flex-1"
          />
          <Button type="submit">Search</Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Reads career history, education, and skills — not just current title.
        </p>
      </div>

      <ActiveFilterTray
        activeFilters={activeFilters}
        onRemove={handleRemoveFilter}
        onClearAll={handleClearClick}
      />

      <details open={filtersOpen} className="group rounded-lg border bg-muted/20 p-3">
        <summary className="flex cursor-pointer list-none items-center gap-3 select-none [&::-webkit-details-marker]:hidden">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-card text-primary">
            <SlidersHorizontal className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Filters</span>
            <span className="block truncate text-xs text-muted-foreground">
              {activeRefinements.length > 0
                ? `${activeRefinements.length} active refinement${activeRefinements.length === 1 ? '' : 's'}`
                : 'Refine by place, school, work, cohort, or relationship'}
            </span>
          </span>
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>

        <div className="mt-4 grid gap-4 border-t pt-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" defaultValue={defaults.city} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="employer">Employer</Label>
            <Input id="employer" name="employer" defaultValue={defaults.employer} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="university">University</Label>
            <Input id="university" name="university" defaultValue={defaults.university} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="major">Major</Label>
            <Input id="major" name="major" defaultValue={defaults.major} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="topic">Mentor topic</Label>
            <Input
              id="topic"
              name="topic"
              placeholder="consulting, product, …"
              defaultValue={defaults.topic}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="gradYearMin">Grad year ≥</Label>
              <Input
                id="gradYearMin"
                name="gradYearMin"
                inputMode="numeric"
                pattern="\d{4}"
                defaultValue={defaults.gradYearMin}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gradYearMax">Grad year ≤</Label>
              <Input
                id="gradYearMax"
                name="gradYearMax"
                inputMode="numeric"
                pattern="\d{4}"
                defaultValue={defaults.gradYearMax}
              />
            </div>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="q">Keyword (matches name, employer, headline)</Label>
            <Input id="q" name="q" defaultValue={defaults.q} />
          </div>
          <div className="flex flex-wrap items-end gap-x-5 gap-y-2 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="openToMentor"
                value="on"
                defaultChecked={defaults.openToMentor}
                onChange={handleCheckboxChange}
                className="h-4 w-4 accent-primary"
              />
              Only show mentors
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="peopleIKnow"
                value="on"
                defaultChecked={defaults.peopleIKnow}
                onChange={handleCheckboxChange}
                className="h-4 w-4 accent-primary"
              />
              Only people I know
            </label>
            <div className="ml-auto">
              <Button type="button" variant="outline" onClick={handleClearClick}>
                Clear all
              </Button>
            </div>
          </div>
        </div>
      </details>
    </form>
  )
}

function ActiveFilterTray({
  activeFilters,
  onRemove,
  onClearAll,
}: {
  activeFilters: ActiveFilterItem[]
  onRemove: (key: keyof SearchFormDefaults) => void
  onClearAll: () => void
}) {
  if (activeFilters.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/20 p-2.5">
      <span className="font-mono text-[9px] font-bold text-muted-foreground uppercase tracking-wider mr-1 select-none">
        ACTIVE FILTERS:
      </span>
      {activeFilters.map((filter) => (
        <div
          key={filter.key}
          className="flex items-center gap-1.5 rounded border border-border bg-background px-2 py-0.5 font-mono text-[10px] text-foreground shadow-sm"
        >
          <span className="text-muted-foreground font-medium">{filter.label}:</span>
          <span className="font-bold">{filter.value}</span>
          <button
            type="button"
            onClick={() => onRemove(filter.key)}
            className="text-primary hover:underline font-bold px-0.5 transition-colors text-xs"
            aria-label={`Remove filter: ${filter.label}`}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="font-mono text-[10px] font-semibold text-primary hover:underline uppercase tracking-wider ml-auto px-1.5 transition-all"
      >
        Clear All
      </button>
    </div>
  )
}

function buildActiveFilters(defaults: SearchFormDefaults): ActiveFilterItem[] {
  const filters: (ActiveFilterItem | null)[] = [
    defaults.nl ? { key: 'nl', label: 'QUERY', value: `"${defaults.nl}"` } : null,
    defaults.city ? { key: 'city', label: 'LOCATION', value: defaults.city } : null,
    defaults.employer ? { key: 'employer', label: 'EMPLOYER', value: defaults.employer } : null,
    defaults.university ? { key: 'university', label: 'SCHOOL', value: defaults.university } : null,
    defaults.major ? { key: 'major', label: 'MAJOR', value: defaults.major } : null,
    defaults.topic ? { key: 'topic', label: 'TOPIC', value: defaults.topic } : null,
    defaults.gradYearMin || defaults.gradYearMax
      ? {
          key: 'gradYearMin',
          label: 'CLASS',
          value: `${defaults.gradYearMin || 'any'}–${defaults.gradYearMax || 'any'}`,
        }
      : null,
    defaults.q ? { key: 'q', label: 'KEYWORD', value: defaults.q } : null,
    defaults.openToMentor ? { key: 'openToMentor', label: 'MENTOR', value: 'YES' } : null,
    defaults.peopleIKnow ? { key: 'peopleIKnow', label: 'MY CIRCLE', value: 'YES' } : null,
  ]
  return filters.filter((filter): filter is ActiveFilterItem => filter !== null)
}

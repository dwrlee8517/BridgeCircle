'use client'

import { ChevronDown, SlidersHorizontal, X } from 'lucide-react'
import { type ChangeEvent, type FormEvent, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
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

export function SearchForm({ defaults, filtersOpen, onSearch, onClear }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const activeFilters = buildActiveFilters(defaults)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSearch(buildParamsFromForm(e.currentTarget))
  }

  // Boolean filters auto-commit on toggle — there's no "partial input" to
  // worry about. Text inputs and number ranges still require Enter / Search
  // button because firing on every keystroke would either burn Claude API
  // calls (NL search) or thrash the UI on partial values.
  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const form = e.currentTarget.form
    if (!form) return
    onSearch(buildParamsFromForm(form))
  }

  // Inputs are uncontrolled (defaultValue / defaultChecked). React only
  // applies those at mount, so changing the `defaults` prop after navigation
  // does not visually reset the DOM. Wipe the inputs imperatively so Clear
  // actually looks like it cleared.
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

      <details open={filtersOpen} className="group rounded-lg border bg-muted/20 p-3">
        <summary className="flex cursor-pointer list-none items-center gap-3 select-none [&::-webkit-details-marker]:hidden">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-card text-primary">
            <SlidersHorizontal className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Filters</span>
            <span className="block truncate text-xs text-muted-foreground">
              {activeFilters.length > 0
                ? `${activeFilters.length} active refinement${activeFilters.length === 1 ? '' : 's'}`
                : 'Refine by place, school, work, cohort, or relationship'}
            </span>
          </span>
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>

        {activeFilters.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t pt-3">
            {activeFilters.map((filter) => (
              <Badge key={filter} variant="secondary">
                {filter}
              </Badge>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={handleClearClick}
              className="ml-auto gap-1"
            >
              <X className="size-3" />
              Clear
            </Button>
          </div>
        ) : null}

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

function buildActiveFilters(defaults: SearchFormDefaults): string[] {
  const filters = [
    defaults.city ? `City: ${defaults.city}` : null,
    defaults.employer ? `Employer: ${defaults.employer}` : null,
    defaults.university ? `School: ${defaults.university}` : null,
    defaults.major ? `Major: ${defaults.major}` : null,
    defaults.topic ? `Topic: ${defaults.topic}` : null,
    defaults.gradYearMin || defaults.gradYearMax
      ? `Years: ${defaults.gradYearMin || 'any'}-${defaults.gradYearMax || 'any'}`
      : null,
    defaults.q ? `Keyword: ${defaults.q}` : null,
    defaults.openToMentor ? 'Mentors only' : null,
    defaults.peopleIKnow ? 'People I know' : null,
  ]
  return filters.filter((filter): filter is string => filter !== null)
}

'use client'

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

export function SearchForm({ defaults, filtersOpen, onSearch, onClear }: Props) {
  const formRef = useRef<HTMLFormElement>(null)

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
        <div className="flex gap-2">
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

      <details open={filtersOpen} className="border-t pt-4">
        <summary className="text-sm font-medium cursor-pointer select-none">Filters</summary>
        <div className="grid gap-4 sm:grid-cols-2 mt-4">
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
                className="h-4 w-4"
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
                className="h-4 w-4"
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

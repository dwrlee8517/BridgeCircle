'use client'

import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react'
import { type ChangeEvent, type FormEvent, type ReactNode, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

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
  children?: ReactNode
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

export function SearchForm({ defaults, filtersOpen, onSearch, onClear, children }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const activeFilters = buildActiveFilters(defaults)
  const activeRefinements = activeFilters.filter((f) => f.key !== 'nl')

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(filtersOpen)
  const [availExpanded, setAvailExpanded] = useState(true)
  const [locationExpanded, setLocationExpanded] = useState(true)
  const [eduExpanded, setEduExpanded] = useState(true)
  const [keywordExpanded, setKeywordExpanded] = useState(true)

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

  const handleClearNL = () => {
    const form = formRef.current
    if (form) {
      const nlInput = form.querySelector('[name="nl"]') as HTMLInputElement | null
      if (nlInput) {
        nlInput.value = ''
      }
      onSearch(buildParamsFromForm(form))
    }
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
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Search Input Capsule */}
      <div className="relative flex items-center bg-card border border-border rounded-full p-1 pl-5 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/40 transition-all">
        <span className="text-muted-foreground/60 mr-2.5 shrink-0">
          <Search className="size-4" />
        </span>
        <input
          id="nl"
          name="nl"
          placeholder="Describe who could help, e.g. product after consulting, Seoul alumni, college advice"
          defaultValue={defaults.nl}
          className="flex-1 bg-transparent border-none p-0 h-9 text-sm focus:outline-none focus:ring-0 placeholder:text-muted-foreground/50 text-foreground"
        />
        {defaults.nl && (
          <button
            type="button"
            onClick={handleClearNL}
            className="text-muted-foreground hover:text-foreground p-1 mr-1 transition-colors cursor-pointer"
            aria-label="Clear search query"
          >
            <X className="size-4" />
          </button>
        )}
        <Button
          type="submit"
          variant="cta"
          size="sm"
          className="rounded-full px-5 h-8"
          aria-label="Search people"
        >
          Find people
        </Button>
      </div>

      {/* 2. Mobile Filters Trigger */}
      <button
        type="button"
        onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
        className="md:hidden flex items-center justify-between w-full border border-border bg-card rounded-lg px-4 py-2.5 text-sm font-semibold text-foreground"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-primary" />
          <span>Filters</span>
          {activeRefinements.length > 0 && (
            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono text-[10px] font-bold">
              {activeRefinements.length}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            'size-4 text-muted-foreground transition-transform duration-200',
            mobileFiltersOpen && 'rotate-180',
          )}
        />
      </button>

      {/* 3. 2-Column layout */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 items-start">
        {/* Left: Accordion Facets */}
        <aside
          className={cn(
            'md:block space-y-4 border border-border md:border-none p-4 md:p-0 rounded-lg bg-card md:bg-transparent shadow-sm md:shadow-none',
            mobileFiltersOpen ? 'block' : 'hidden',
          )}
        >
          <div className="flex justify-between items-baseline mb-2">
            <span className="font-heading font-bold text-sm text-foreground">Refine results</span>
            {activeRefinements.length > 0 && (
              <button
                type="button"
                onClick={handleClearClick}
                className="text-primary hover:underline font-mono text-[10px] font-bold cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="border border-border bg-card rounded-lg p-4 space-y-4 shadow-sm">
            {/* Group 1: Availability & Connection */}
            <FacetGroup
              label="Availability"
              expanded={availExpanded}
              onToggle={() => setAvailExpanded(!availExpanded)}
            >
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="openToMentor"
                    value="on"
                    defaultChecked={defaults.openToMentor}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 rounded-[3px] accent-primary border-border cursor-pointer"
                  />
                  Open to mentorship
                </label>
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="peopleIKnow"
                    value="on"
                    defaultChecked={defaults.peopleIKnow}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 rounded-[3px] accent-primary border-border cursor-pointer"
                  />
                  Only people I know
                </label>
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="topic"
                  className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Mentor topic
                </Label>
                <Input
                  id="topic"
                  name="topic"
                  placeholder="consulting, product, …"
                  defaultValue={defaults.topic}
                  className="h-8 text-xs px-2.5"
                />
              </div>
            </FacetGroup>

            {/* Group 2: Location & Career */}
            <FacetGroup
              label="Location & Career"
              expanded={locationExpanded}
              onToggle={() => setLocationExpanded(!locationExpanded)}
            >
              <div className="space-y-1">
                <Label
                  htmlFor="city"
                  className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  City
                </Label>
                <Input
                  id="city"
                  name="city"
                  defaultValue={defaults.city}
                  className="h-8 text-xs px-2.5"
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="employer"
                  className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Employer
                </Label>
                <Input
                  id="employer"
                  name="employer"
                  defaultValue={defaults.employer}
                  className="h-8 text-xs px-2.5"
                />
              </div>
            </FacetGroup>

            {/* Group 3: Education */}
            <FacetGroup
              label="Education"
              expanded={eduExpanded}
              onToggle={() => setEduExpanded(!eduExpanded)}
            >
              <div className="space-y-1">
                <Label
                  htmlFor="university"
                  className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  University
                </Label>
                <Input
                  id="university"
                  name="university"
                  defaultValue={defaults.university}
                  className="h-8 text-xs px-2.5"
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="major"
                  className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Major
                </Label>
                <Input
                  id="major"
                  name="major"
                  defaultValue={defaults.major}
                  className="h-8 text-xs px-2.5"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Graduation Year
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    id="gradYearMin"
                    name="gradYearMin"
                    placeholder="Min"
                    inputMode="numeric"
                    pattern="\d{4}"
                    defaultValue={defaults.gradYearMin}
                    className="h-8 text-xs px-2"
                  />
                  <Input
                    id="gradYearMax"
                    name="gradYearMax"
                    placeholder="Max"
                    inputMode="numeric"
                    pattern="\d{4}"
                    defaultValue={defaults.gradYearMax}
                    className="h-8 text-xs px-2"
                  />
                </div>
              </div>
            </FacetGroup>

            {/* Group 4: Keyword */}
            <FacetGroup
              label="Keyword"
              expanded={keywordExpanded}
              onToggle={() => setKeywordExpanded(!keywordExpanded)}
            >
              <div className="space-y-1">
                <Label
                  htmlFor="q"
                  className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Matches name, bio, work
                </Label>
                <Input id="q" name="q" defaultValue={defaults.q} className="h-8 text-xs px-2.5" />
              </div>
            </FacetGroup>
          </div>
        </aside>

        {/* Right: Results / Active filters */}
        <div className="space-y-6 min-w-0">
          <ActiveFilterTray
            activeFilters={activeFilters}
            onRemove={handleRemoveFilter}
            onClearAll={handleClearClick}
          />
          {children}
        </div>
      </div>
    </form>
  )
}

function FacetGroup({
  label,
  expanded,
  onToggle,
  children,
}: {
  label: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-border/60 pb-3 mb-3 last:border-b-0 last:pb-0 last:mb-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between w-full py-1 text-left select-none group/btn cursor-pointer"
      >
        <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-hover/btn:text-foreground transition-colors">
          {label}
        </span>
        <ChevronDown
          className={cn(
            'size-3.5 text-muted-foreground/75 transition-transform duration-200',
            expanded && 'rotate-180',
          )}
        />
      </button>
      {expanded && <div className="mt-2.5 space-y-2.5">{children}</div>}
    </div>
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
    <div className="flex flex-wrap items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.04] px-5 py-1.5">
      <span className="font-mono text-[9px] font-bold text-primary uppercase tracking-wider mr-2 select-none">
        Active
      </span>
      {activeFilters.map((filter) => (
        <div
          key={filter.key}
          className="inline-flex items-center gap-1 px-3 py-0.5 bg-card border border-primary/25 rounded-full font-mono text-[10px] text-foreground hover:border-primary/50 transition-colors shadow-none"
        >
          <span className="text-muted-foreground font-medium">{filter.label}:</span>
          <span className="font-bold">{filter.value}</span>
          <button
            type="button"
            onClick={() => onRemove(filter.key)}
            className="ml-1 text-primary hover:text-primary-hover font-bold px-0.5 transition-colors text-xs cursor-pointer select-none"
            aria-label={`Remove filter: ${filter.label}`}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="font-mono text-[10px] font-bold text-primary hover:underline uppercase tracking-wider ml-auto px-2 select-none cursor-pointer"
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

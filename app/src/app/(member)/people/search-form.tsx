'use client'

import { Search, SlidersHorizontal, X } from 'lucide-react'
import { type FormEvent, type InputHTMLAttributes, type ReactNode, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  resultCount: number
  openCount: number
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

export type ActiveFilterItem = {
  key: keyof SearchFormDefaults
  label: string
  value: string
}

const TOPIC_FILTERS = [
  { label: 'Career transitions', count: 12 },
  { label: 'Product management', count: 18 },
  { label: 'VC & Startups', count: 9 },
  { label: 'Founders', count: 14 },
  { label: 'Engineering leadership', count: 11 },
]

const COHORT_FILTERS = [
  { label: "Class '00-'09", min: '2000', max: '2009', count: 42 },
  { label: "Class '10-'19", min: '2010', max: '2019', count: 86 },
  { label: "Class '20-'24", min: '2020', max: '2024', count: 73 },
]

const COMPANY_FILTERS = ['Common Capital', 'Mayo Clinic', 'Airbnb']
const LOCATION_FILTERS = ['San Francisco, CA', 'New York, NY', 'Seoul, South Korea']

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

export function SearchForm({
  defaults,
  filtersOpen,
  resultCount,
  openCount,
  onSearch,
  onClear,
  children,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const activeFilters = buildActiveFilters(defaults)
  const activeRefinements = activeFilters.filter((f) => f.key !== 'nl')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(filtersOpen)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSearch(buildParamsFromForm(e.currentTarget))
  }

  const setFieldValue = (key: keyof SearchFormDefaults, value: string) => {
    const form = formRef.current
    const input = form?.querySelector(`[name="${key}"]`) as HTMLInputElement | null
    if (!form || !input) return
    input.value = input.value === value ? '' : value
    onSearch(buildParamsFromForm(form))
  }

  const setCohort = (min: string, max: string) => {
    const form = formRef.current
    const minInput = form?.querySelector('[name="gradYearMin"]') as HTMLInputElement | null
    const maxInput = form?.querySelector('[name="gradYearMax"]') as HTMLInputElement | null
    if (!form || !minInput || !maxInput) return
    const isActive = minInput.value === min && maxInput.value === max
    minInput.value = isActive ? '' : min
    maxInput.value = isActive ? '' : max
    onSearch(buildParamsFromForm(form))
  }

  const toggleFlag = (key: 'openToMentor' | 'peopleIKnow') => {
    const form = formRef.current
    const input = form?.querySelector(`[name="${key}"]`) as HTMLInputElement | null
    if (!form || !input) return
    input.value = input.value === 'on' ? '' : 'on'
    onSearch(buildParamsFromForm(form))
  }

  const handleClearClick = () => {
    const form = formRef.current
    if (form) {
      for (const input of form.querySelectorAll('input')) {
        input.value = ''
      }
    }
    onClear()
  }

  const handleClearNL = () => {
    const form = formRef.current
    if (!form) return
    const nlInput = form.querySelector('[name="nl"]') as HTMLInputElement | null
    if (nlInput) nlInput.value = ''
    onSearch(buildParamsFromForm(form))
  }

  const handleRemoveFilter = (key: keyof SearchFormDefaults) => {
    const form = formRef.current
    if (!form) return
    const input = form.querySelector(`[name="${key}"]`) as HTMLInputElement | null
    if (input) input.value = ''
    if (key === 'gradYearMin' || key === 'gradYearMax') {
      const minInput = form.querySelector('[name="gradYearMin"]') as HTMLInputElement | null
      const maxInput = form.querySelector('[name="gradYearMax"]') as HTMLInputElement | null
      if (minInput) minInput.value = ''
      if (maxInput) maxInput.value = ''
    }
    onSearch(buildParamsFromForm(form))
  }

  const cohortActive = (min: string, max: string) =>
    defaults.gradYearMin === min && defaults.gradYearMax === max

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="min-h-full">
      <input type="hidden" name="openToMentor" defaultValue={defaults.openToMentor ? 'on' : ''} />
      <input type="hidden" name="peopleIKnow" defaultValue={defaults.peopleIKnow ? 'on' : ''} />

      <div className="border-b border-border bg-background">
        <div className="mx-auto max-w-[1400px] px-4 pt-4 sm:px-8">
          <p className="bc-section-kicker">People search</p>
          <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-heading text-[22px] font-semibold leading-tight text-foreground">
                Find someone in your circle
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Search by role, company, school, or the question you are trying to answer.
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3 sm:px-8">
          <div className="relative flex min-w-[min(320px,100%)] flex-1 items-center rounded-full border border-border bg-card py-1 pr-1 pl-4 transition-colors focus-within:border-focus-ring focus-within:ring-4 focus-within:ring-focus-ring-muted">
            <span className="mr-2 shrink-0 text-muted-foreground">
              <Search className="size-3.5" />
            </span>
            <input
              id="nl"
              name="nl"
              placeholder="Search the network..."
              aria-label="Search the network by name, role, company, school, or question"
              defaultValue={defaults.nl}
              className="h-8 flex-1 border-none bg-transparent p-0 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0"
            />
            {defaults.nl ? (
              <button
                type="button"
                onClick={handleClearNL}
                className="mr-1 p-1 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Clear search query"
              >
                <X className="size-4" />
              </button>
            ) : null}
            <Button
              type="submit"
              variant="default"
              size="sm"
              className="h-8 rounded-full px-4"
              aria-label="Search people"
            >
              Search
            </Button>
          </div>

          <span className="shrink-0 font-mono text-xs uppercase tracking-[0.05em] text-muted-foreground">
            {resultCount.toLocaleString()} results · {openCount.toLocaleString()} open
          </span>

          <button
            type="button"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="ml-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground md:hidden"
            aria-expanded={mobileFiltersOpen}
          >
            <SlidersHorizontal className="size-3.5 text-primary" />
            Filters
            {activeRefinements.length > 0 ? (
              <span className="flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1.5 font-mono text-xs font-bold text-primary-foreground">
                {activeRefinements.length}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-start gap-0 px-4 py-4 sm:px-8 md:grid-cols-[260px_minmax(0,1fr)] md:gap-8 md:py-6 md:pb-16">
        <aside
          className={cn(
            'max-h-[calc(100dvh-22rem)] overflow-y-auto overscroll-contain rounded-md border border-border bg-card p-4 shadow-card md:sticky md:top-24 md:block md:max-h-[calc(100vh-8rem)] md:p-5',
            mobileFiltersOpen ? 'mb-4 block' : 'hidden',
          )}
        >
          <div className="mb-5 flex items-center justify-between">
            <span className="font-heading text-[15px] font-semibold text-foreground">Filters</span>
            <div className="flex items-center gap-3">
              {activeRefinements.length > 0 ? (
                <button
                  type="button"
                  onClick={handleClearClick}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Clear all
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="text-muted-foreground hover:text-foreground md:hidden"
                aria-label="Close filters"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <FilterSection label="Availability">
              <FilterRow
                label="Open as mentor"
                count={openCount}
                active={defaults.openToMentor}
                dotClassName="bg-accent-sage"
                onClick={() => toggleFlag('openToMentor')}
              />
              <FilterRow
                label="People I know"
                active={defaults.peopleIKnow}
                dotClassName="bg-primary"
                onClick={() => toggleFlag('peopleIKnow')}
              />
            </FilterSection>

            <FilterSection label="Career">
              <FilterInput
                name="topic"
                label="Topic"
                placeholder="product, fundraising"
                defaultValue={defaults.topic}
              />
              <div className="flex flex-col gap-0.5">
                {TOPIC_FILTERS.slice(0, 4).map((topic) => (
                  <FilterRow
                    key={topic.label}
                    label={topic.label}
                    count={topic.count}
                    active={defaults.topic === topic.label}
                    onClick={() => setFieldValue('topic', topic.label)}
                  />
                ))}
              </div>
              <FilterInput
                name="employer"
                label="Company"
                placeholder="Common Capital"
                defaultValue={defaults.employer}
              />
              <InlineSuggestions
                values={COMPANY_FILTERS}
                activeValue={defaults.employer}
                onSelect={(value) => setFieldValue('employer', value)}
              />
              <FilterInput
                name="q"
                label="Role / keyword"
                placeholder="founder, cardiology, data"
                defaultValue={defaults.q}
              />
            </FilterSection>

            <FilterSection label="Location">
              <FilterInput
                name="city"
                label="City"
                placeholder="San Francisco, CA"
                defaultValue={defaults.city}
              />
              <InlineSuggestions
                values={LOCATION_FILTERS}
                activeValue={defaults.city}
                onSelect={(value) => setFieldValue('city', value)}
              />
            </FilterSection>

            <FilterSection label="Education">
              <FilterInput
                name="university"
                label="School"
                placeholder="Harvard, Stanford"
                defaultValue={defaults.university}
              />
              <FilterInput
                name="major"
                label="Major"
                placeholder="computer science"
                defaultValue={defaults.major}
              />
              <div className="grid grid-cols-2 gap-2">
                <FilterInput
                  name="gradYearMin"
                  label="From"
                  placeholder="2010"
                  defaultValue={defaults.gradYearMin}
                  inputMode="numeric"
                />
                <FilterInput
                  name="gradYearMax"
                  label="To"
                  placeholder="2024"
                  defaultValue={defaults.gradYearMax}
                  inputMode="numeric"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                {COHORT_FILTERS.map((cohort) => (
                  <FilterRow
                    key={cohort.label}
                    label={cohort.label}
                    count={cohort.count}
                    active={cohortActive(cohort.min, cohort.max)}
                    onClick={() => setCohort(cohort.min, cohort.max)}
                  />
                ))}
              </div>
            </FilterSection>

            <div className="sticky bottom-0 z-10 -mx-4 -mb-4 mt-2 grid grid-cols-1 gap-2 border-t border-border bg-card px-4 py-3 md:static md:mx-0 md:mb-0 md:border-t-0 md:bg-transparent md:p-0">
              <Button type="submit" variant="default" size="sm" className="w-full rounded-lg">
                Apply filters
              </Button>
              <Button type="button" variant="outline" size="sm" className="w-full rounded-lg">
                Save this search
              </Button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-4">
          <ActiveQueryLine
            activeFilters={activeFilters}
            resultCount={resultCount}
            onRemove={handleRemoveFilter}
            onClearAll={handleClearClick}
          />
          {children}
        </div>
      </div>
    </form>
  )
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2.5 font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  )
}

function FilterInput({
  name,
  label,
  placeholder,
  defaultValue,
  inputMode,
}: {
  name: keyof SearchFormDefaults
  label: string
  placeholder: string
  defaultValue: string
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode']
}) {
  const id = `people-filter-${name}`
  return (
    <label htmlFor={id} className="block space-y-1.5">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <Input
        id={id}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        inputMode={inputMode}
        aria-label={label}
        className="h-8 rounded-lg px-2.5 text-xs"
      />
    </label>
  )
}

function InlineSuggestions({
  values,
  activeValue,
  onSelect,
}: {
  values: string[]
  activeValue: string
  onSelect: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {values.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onSelect(value)}
          aria-pressed={activeValue === value}
          className={cn(
            'rounded-md border px-2 py-0.5 text-xs font-medium transition-colors',
            activeValue === value
              ? 'border-primary/30 bg-primary-tint text-primary'
              : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground',
          )}
        >
          {value}
        </button>
      ))}
    </div>
  )
}

function FilterRow({
  label,
  count,
  active = false,
  muted = false,
  dotClassName,
  onClick,
}: {
  label: string
  count?: number
  active?: boolean
  muted?: boolean
  dotClassName?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors',
        active
          ? 'bg-primary-tint text-primary'
          : muted
            ? 'text-muted-foreground hover:bg-surface-subtle'
            : 'text-foreground hover:bg-surface-subtle',
      )}
    >
      <span className="inline-flex min-w-0 items-center gap-2">
        {dotClassName ? (
          <span className={cn('size-1.5 shrink-0 rounded-full', dotClassName)} aria-hidden />
        ) : null}
        <span className="truncate">{label}</span>
      </span>
      {count != null ? (
        <span className="ml-2 shrink-0 font-mono text-xs text-muted-foreground">{count}</span>
      ) : null}
    </button>
  )
}

function ActiveQueryLine({
  activeFilters,
  resultCount,
  onRemove,
  onClearAll,
}: {
  activeFilters: ActiveFilterItem[]
  resultCount: number
  onRemove: (key: keyof SearchFormDefaults) => void
  onClearAll: () => void
}) {
  if (activeFilters.length === 0) return null

  const query = activeFilters.find((filter) => filter.key === 'nl')
  const refinements = activeFilters.filter((filter) => filter.key !== 'nl')

  return (
    <div className="border-b border-border pb-4">
      <div className="flex flex-wrap items-center gap-3">
        {query ? (
          <>
            <span className="font-heading text-[15px] font-medium text-muted-foreground">
              You asked
            </span>
            <span className="font-heading text-[19px] font-medium italic text-foreground">
              {query.value}
            </span>
          </>
        ) : (
          <span className="font-heading text-[15px] font-medium text-muted-foreground">
            Refined by
          </span>
        )}

        {refinements.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => onRemove(filter.key)}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground hover:border-primary/40"
            aria-label={`Remove filter: ${filter.label}`}
          >
            <span className="text-muted-foreground">{filter.label}:</span>
            <span>{filter.value}</span>
            <X className="size-3 text-primary" />
          </button>
        ))}

        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          Clear
        </button>
        <div className="min-w-3 flex-1" />
        <span className="font-mono text-xs text-muted-foreground">
          {resultCount.toLocaleString()} results · sorted by match
        </span>
      </div>
    </div>
  )
}

function buildActiveFilters(defaults: SearchFormDefaults): ActiveFilterItem[] {
  const filters: (ActiveFilterItem | null)[] = [
    defaults.nl ? { key: 'nl', label: 'query', value: `"${defaults.nl}"` } : null,
    defaults.city ? { key: 'city', label: 'location', value: defaults.city } : null,
    defaults.employer ? { key: 'employer', label: 'employer', value: defaults.employer } : null,
    defaults.university ? { key: 'university', label: 'school', value: defaults.university } : null,
    defaults.major ? { key: 'major', label: 'major', value: defaults.major } : null,
    defaults.topic ? { key: 'topic', label: 'topic', value: defaults.topic } : null,
    defaults.gradYearMin || defaults.gradYearMax
      ? {
          key: 'gradYearMin',
          label: 'class',
          value: `${defaults.gradYearMin || 'any'}-${defaults.gradYearMax || 'any'}`,
        }
      : null,
    defaults.q ? { key: 'q', label: 'keyword', value: defaults.q } : null,
    defaults.openToMentor ? { key: 'openToMentor', label: 'mentor', value: 'yes' } : null,
    defaults.peopleIKnow ? { key: 'peopleIKnow', label: 'my circle', value: 'yes' } : null,
  ]
  return filters.filter((filter): filter is ActiveFilterItem => filter !== null)
}

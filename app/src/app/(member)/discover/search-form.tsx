'use client'

import { useRouter } from 'next/navigation'
import type { FormEvent } from 'react'
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

/**
 * Client form that submits to /discover with a clean query string —
 * only fields with non-empty values end up in the URL. Without this,
 * the native GET form encodes every named input as an empty param
 * ("?employer=&university=…"), which works but uglifies the URL and
 * breaks share/bookmark hygiene.
 */
export function SearchForm({
  defaults,
  filtersOpen,
}: {
  defaults: SearchFormDefaults
  filtersOpen: boolean
}) {
  const router = useRouter()

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const params = new URLSearchParams()
    for (const [key, value] of fd.entries()) {
      if (typeof value !== 'string') continue
      const trimmed = value.trim()
      if (trimmed.length === 0) continue
      params.set(key, trimmed)
    }
    const qs = params.toString()
    router.push(qs.length > 0 ? `/discover?${qs}` : '/discover')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
                className="h-4 w-4"
              />
              Only people I know
            </label>
            <div className="ml-auto">
              <Button type="button" variant="outline" onClick={() => router.push('/discover')}>
                Clear all
              </Button>
            </div>
          </div>
        </div>
      </details>
    </form>
  )
}

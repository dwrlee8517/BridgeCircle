import type { PeopleFilters, PeopleScope } from './contracts'

export type PeopleSearchParams = {
  query: string | null
  scope: PeopleScope
  filters: PeopleFilters
}

export type RawPeopleSearchParams = Record<string, string | string[] | undefined>

const SCOPES = new Set<PeopleScope>(['all', 'open_to_help', 'in_circle'])
const TEXT_FILTER_KEYS = ['industry', 'location', 'employer', 'education', 'topic'] as const

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function normalizedText(
  value: string | string[] | undefined,
  maxLength: number,
): string | null | undefined {
  const text = one(value)?.trim()
  if (!text) return null
  return text.length <= maxLength ? text : undefined
}

function normalizedYear(value: string | string[] | undefined): number | null | undefined {
  const text = one(value)?.trim()
  if (!text) return null
  if (!/^\d{4}$/.test(text)) return undefined
  const year = Number(text)
  return year >= 1900 && year <= 2100 ? year : undefined
}

export function parsePeopleSearchParams(
  raw: RawPeopleSearchParams,
): { ok: true; value: PeopleSearchParams } | { ok: false; error: 'invalid_search' } {
  const query = normalizedText(raw.q, 300)
  const scopeValue = one(raw.scope)?.trim() || 'all'
  const classYearStart = normalizedYear(raw.classYearStart)
  const classYearEnd = normalizedYear(raw.classYearEnd)
  const textFilters = Object.fromEntries(
    TEXT_FILTER_KEYS.map((key) => [key, normalizedText(raw[key], 120)]),
  ) as Record<(typeof TEXT_FILTER_KEYS)[number], string | null | undefined>

  if (
    query === undefined ||
    !SCOPES.has(scopeValue as PeopleScope) ||
    classYearStart === undefined ||
    classYearEnd === undefined ||
    Object.values(textFilters).some((value) => value === undefined) ||
    (classYearStart !== null && classYearEnd !== null && classYearStart > classYearEnd)
  ) {
    return { ok: false, error: 'invalid_search' }
  }

  return {
    ok: true,
    value: {
      query: query ?? null,
      scope: scopeValue as PeopleScope,
      filters: {
        industry: textFilters.industry ?? null,
        classYearStart: classYearStart ?? null,
        classYearEnd: classYearEnd ?? null,
        location: textFilters.location ?? null,
        employer: textFilters.employer ?? null,
        education: textFilters.education ?? null,
        topic: textFilters.topic ?? null,
      },
    },
  }
}

export function peopleSearchHref(value: PeopleSearchParams): string {
  const params = new URLSearchParams()
  if (value.query) params.set('q', value.query)
  if (value.scope !== 'all') params.set('scope', value.scope)
  if (value.filters.industry) params.set('industry', value.filters.industry)
  if (value.filters.classYearStart !== null) {
    params.set('classYearStart', String(value.filters.classYearStart))
  }
  if (value.filters.classYearEnd !== null) {
    params.set('classYearEnd', String(value.filters.classYearEnd))
  }
  if (value.filters.location) params.set('location', value.filters.location)
  if (value.filters.employer) params.set('employer', value.filters.employer)
  if (value.filters.education) params.set('education', value.filters.education)
  if (value.filters.topic) params.set('topic', value.filters.topic)
  const query = params.toString()
  return query ? `/people?${query}` : '/people'
}

export function activePeopleFilterCount(value: PeopleSearchParams): number {
  return Object.values(value.filters).filter((filter) => filter !== null).length
}

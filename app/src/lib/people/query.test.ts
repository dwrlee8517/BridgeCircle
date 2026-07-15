import { describe, expect, it } from 'vitest'
import { activePeopleFilterCount, parsePeopleSearchParams, peopleSearchHref } from './query'

describe('People query state', () => {
  it('normalizes a valid search and serializes a stable URL', () => {
    const parsed = parsePeopleSearchParams({
      q: ' climate infrastructure ',
      scope: 'open_to_help',
      industry: ' Climate ',
      classYearStart: '2000',
      classYearEnd: '2020',
    })
    expect(parsed).toEqual({
      ok: true,
      value: {
        query: 'climate infrastructure',
        scope: 'open_to_help',
        filters: {
          industry: 'Climate',
          classYearStart: 2000,
          classYearEnd: 2020,
          location: null,
          employer: null,
          education: null,
          topic: null,
        },
      },
    })
    if (!parsed.ok) return
    expect(activePeopleFilterCount(parsed.value)).toBe(3)
    expect(peopleSearchHref(parsed.value)).toBe(
      '/people?q=climate+infrastructure&scope=open_to_help&industry=Climate&classYearStart=2000&classYearEnd=2020',
    )
  })

  it('rejects invalid scopes, ranges, and oversized values', () => {
    expect(parsePeopleSearchParams({ scope: 'friends' }).ok).toBe(false)
    expect(parsePeopleSearchParams({ classYearStart: '2021', classYearEnd: '2020' }).ok).toBe(false)
    expect(parsePeopleSearchParams({ q: 'x'.repeat(301) }).ok).toBe(false)
  })

  it('uses the browsable directory as the empty default', () => {
    const parsed = parsePeopleSearchParams({})
    expect(parsed.ok && parsed.value).toEqual({
      query: null,
      scope: 'all',
      filters: {
        industry: null,
        classYearStart: null,
        classYearEnd: null,
        location: null,
        employer: null,
        education: null,
        topic: null,
      },
    })
    if (!parsed.ok) return
    expect(peopleSearchHref(parsed.value)).toBe('/people')
  })
})

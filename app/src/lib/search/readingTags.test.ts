import { describe, expect, it } from 'vitest'
import type { ExtractedFilters } from './extractFilters'
import { readingTags } from './readingTags'

const empty: ExtractedFilters = {
  mentorOpen: null,
  city: null,
  country: null,
  university: null,
  universityScope: null,
  major: null,
  majorScope: null,
  employer: null,
  employerScope: null,
  gradYearMin: null,
  gradYearMax: null,
  theme: null,
}

describe('readingTags', () => {
  it('returns nothing for an empty extraction', () => {
    expect(readingTags(empty)).toEqual([])
  })

  it('sentence-cases the theme and keeps proper nouns as written', () => {
    expect(
      readingTags({ ...empty, theme: 'career decision in consulting', employer: 'McKinsey' }),
    ).toEqual(['Career decision in consulting', 'McKinsey'])
  })

  it('prefers city over country and dedupes case-insensitively', () => {
    expect(
      readingTags({ ...empty, theme: 'seoul startups', city: 'Seoul', country: 'South Korea' }),
    ).toEqual(['Seoul startups', 'Seoul'])
  })

  it('collapses a single-year range to Class of', () => {
    expect(readingTags({ ...empty, gradYearMin: 2010, gradYearMax: 2010 })).toEqual([
      'Class of 2010',
    ])
  })

  it('renders open ranges honestly', () => {
    expect(readingTags({ ...empty, gradYearMin: 2015, gradYearMax: null })).toEqual([
      'Classes 2015–now',
    ])
  })

  it('caps the list at 5 tags', () => {
    const tags = readingTags({
      ...empty,
      theme: 'fintech engineering',
      employer: 'Stripe',
      university: 'Stanford',
      major: 'computer science',
      city: 'New York',
      gradYearMin: 2008,
      gradYearMax: 2014,
    })
    expect(tags).toHaveLength(5)
    expect(tags).not.toContain('Classes 2008–2014')
  })
})

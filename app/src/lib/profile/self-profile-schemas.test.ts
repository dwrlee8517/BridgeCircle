import { describe, expect, it } from 'vitest'
import {
  historyFormSchema,
  identityFormSchema,
  linksFormSchema,
  visibilityFormSchema,
} from './self-profile-schemas'

describe('self profile form contracts', () => {
  it('normalizes optional identity values and keeps a bounded graduation year', () => {
    expect(
      identityFormSchema.parse({
        displayName: '  Maya Chen  ',
        preferredName: '',
        nameOther: '',
        graduationYear: '2018',
      }),
    ).toEqual({
      displayName: 'Maya Chen',
      preferredName: null,
      nameOther: null,
      graduationYear: 2018,
    })
  })

  it('rejects reversed career dates and duplicate skills', () => {
    const result = historyFormSchema.safeParse({
      experiences: JSON.stringify([
        {
          employer: 'BridgeCircle',
          title: 'Builder',
          startYear: 2028,
          startMonth: null,
          endYear: 2027,
          endMonth: null,
          description: null,
        },
      ]),
      skills: JSON.stringify(['Design', 'design']),
    })
    expect(result.success).toBe(false)
  })

  it('requires secure URLs, labels custom links, and removes duplicates', () => {
    expect(
      linksFormSchema.safeParse({
        links: JSON.stringify([
          { kind: 'website', label: null, value: 'http://example.com', audience: 'self' },
          { kind: 'other', label: null, value: 'https://example.com', audience: 'self' },
          { kind: 'website', label: null, value: 'https://example.com', audience: 'self' },
        ]),
      }).success,
    ).toBe(false)
  })

  it('accepts only the four explicit visibility keys', () => {
    expect(
      visibilityFormSchema.safeParse({
        career_history: 'organization',
        education_history: 'connections',
        bio: 'self',
        skills: 'organization',
        links: 'organization',
      }).success,
    ).toBe(false)
  })
})

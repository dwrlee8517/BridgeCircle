import { describe, expect, it } from 'vitest'
import type { ExtractedProfile } from '@/lib/resume/schemas'
import {
  fingerprintProfile,
  fingerprintsDiffer,
  hashFingerprint,
  projectFingerprint,
} from './fingerprint'

function profile(overrides: Partial<ExtractedProfile> = {}): ExtractedProfile {
  return {
    name: 'Test User',
    headline: null,
    city: 'Seoul, Korea',
    currentEmployer: 'Naver',
    currentTitle: 'Engineer',
    university: 'KAIST',
    major: 'CS',
    careerHistory: [],
    educationHistory: [
      { school: 'KAIST', degree: 'BS', field: 'CS', startDate: '2016', endDate: '2020' },
      {
        school: 'Seoul National Univ',
        degree: 'MS',
        field: 'CS',
        startDate: '2020',
        endDate: null,
      },
    ],
    skills: [],
    ...overrides,
  }
}

describe('projectFingerprint', () => {
  it('picks the most recent school (null end date wins)', () => {
    const fp = projectFingerprint(profile())
    expect(fp.mostRecentSchool).toBe('Seoul National Univ')
  })

  it('falls back to university when educationHistory is empty', () => {
    const fp = projectFingerprint(profile({ educationHistory: [] }))
    expect(fp.mostRecentSchool).toBe('KAIST')
  })

  it('returns nulls when fields are blank or whitespace', () => {
    const fp = projectFingerprint(
      profile({
        currentEmployer: '  ',
        currentTitle: null,
        city: '',
        university: null,
        educationHistory: [],
      }),
    )
    expect(fp).toEqual({
      currentEmployer: null,
      currentTitle: null,
      currentLocation: null,
      mostRecentSchool: null,
    })
  })

  it('ranks by latest end_date when no nulls present', () => {
    const fp = projectFingerprint(
      profile({
        educationHistory: [
          { school: 'A', degree: null, field: null, startDate: '2015', endDate: '2019' },
          { school: 'B', degree: null, field: null, startDate: '2019', endDate: '2021-06' },
          { school: 'C', degree: null, field: null, startDate: '2010', endDate: '2014' },
        ],
      }),
    )
    expect(fp.mostRecentSchool).toBe('B')
  })
})

describe('hashFingerprint', () => {
  it('is deterministic across runs', () => {
    const fp = projectFingerprint(profile())
    expect(hashFingerprint(fp)).toBe(hashFingerprint(fp))
  })

  it('is case-insensitive on input values', () => {
    const a = hashFingerprint(projectFingerprint(profile({ currentEmployer: 'NAVER' })))
    const b = hashFingerprint(projectFingerprint(profile({ currentEmployer: 'naver' })))
    expect(a).toBe(b)
  })

  it('differs when any dimension changes', () => {
    const baseline = hashFingerprint(projectFingerprint(profile()))
    const moved = hashFingerprint(projectFingerprint(profile({ currentEmployer: 'Kakao' })))
    expect(moved).not.toBe(baseline)
  })
})

describe('fingerprintsDiffer', () => {
  it('treats no prior hash as a diff', () => {
    const { hash } = fingerprintProfile(profile())
    expect(fingerprintsDiffer(null, hash)).toBe(true)
  })

  it('returns false when hashes match', () => {
    const { hash } = fingerprintProfile(profile())
    expect(fingerprintsDiffer(hash, hash)).toBe(false)
  })
})

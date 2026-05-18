import { describe, expect, it } from 'vitest'
import type { ExtractedProfile } from '@/lib/resume/schemas'
import { isAcceptableResult } from './quality'

function profile(overrides: Partial<ExtractedProfile> = {}): ExtractedProfile {
  return {
    name: 'Jin Park',
    headline: 'Engineer at Naver',
    city: 'Seoul',
    currentEmployer: 'Naver',
    currentTitle: 'Engineer',
    university: 'KAIST',
    major: 'CS',
    careerHistory: [
      { employer: 'Naver', title: 'Engineer', startDate: '2022', endDate: null, description: null },
      { employer: 'Kakao', title: 'Intern', startDate: '2021', endDate: '2022', description: null },
    ],
    educationHistory: [
      { school: 'KAIST', degree: 'BS', field: 'CS', startDate: '2017', endDate: '2021' },
    ],
    skills: ['typescript'],
    ...overrides,
  }
}

describe('isAcceptableResult', () => {
  it('accepts a clean update with matching name', () => {
    const result = isAcceptableResult(profile(), profile({ currentEmployer: 'Kakao' }))
    expect(result.ok).toBe(true)
  })

  it('rejects when name is missing', () => {
    const result = isAcceptableResult(profile(), profile({ name: '' }))
    expect(result).toEqual({ ok: false, reason: 'name_missing' })
  })

  it('rejects when name has zero token overlap', () => {
    const result = isAcceptableResult(
      profile({ name: 'Jin Park' }),
      profile({ name: 'Maria Garcia' }),
    )
    expect(result).toEqual({ ok: false, reason: 'name_mismatch' })
  })

  it('accepts partial name overlap (middle initial added)', () => {
    const result = isAcceptableResult(
      profile({ name: 'Jin Park' }),
      profile({ name: 'Jin H. Park' }),
    )
    expect(result.ok).toBe(true)
  })

  it('rejects when current title was set and is now empty', () => {
    const result = isAcceptableResult(profile(), profile({ currentTitle: null }))
    expect(result).toEqual({ ok: false, reason: 'current_title_dropped' })
  })

  it('rejects when career history collapses from many to zero', () => {
    const result = isAcceptableResult(profile(), profile({ careerHistory: [] }))
    expect(result).toEqual({ ok: false, reason: 'total_replacement' })
  })

  it('rejects placeholder values', () => {
    const result = isAcceptableResult(profile(), profile({ headline: '[REDACTED]' }))
    expect(result).toEqual({ ok: false, reason: 'placeholder_value' })
  })

  it('lets through asterisk strings in unrelated text fields conservatively', () => {
    const result = isAcceptableResult(profile(), profile({ headline: 'Engineer at ***SECRET***' }))
    expect(result.ok).toBe(false)
  })
})

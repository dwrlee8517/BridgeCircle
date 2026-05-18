import { describe, expect, it } from 'vitest'
import { mapBrightDataRecord } from './brightdata'

const sample = {
  id: 'bd_rec_001',
  url: 'https://linkedin.com/in/jin-park',
  name: 'Jin Park',
  position: 'Engineer',
  current_company: 'Naver',
  current_company_name: 'Naver',
  city: 'Seoul',
  country_code: 'kr',
  about: 'Engineer at Naver.\nLikes hiking.',
  experience: [
    {
      company: 'Naver',
      title: 'Engineer',
      start_date: '2022-06',
      end_date: null,
      description: 'Search',
    },
    {
      company: 'Kakao',
      title: 'Intern',
      start_date: '2021',
      end_date: '2022-05',
    },
  ],
  education: [
    {
      title: 'KAIST',
      degree: 'BS',
      field: 'CS',
      start_year: 2017,
      end_year: 2021,
    },
  ],
  skills: ['TypeScript', 'Python'],
  timestamp: '2026-04-15',
}

describe('mapBrightDataRecord', () => {
  it('maps a well-formed record into ExtractedProfile', () => {
    const result = mapBrightDataRecord(sample)
    if (!result.ok) throw new Error(`expected ok, got ${result.error}`)
    expect(result.profile.name).toBe('Jin Park')
    expect(result.profile.headline).toBe('Engineer at Naver.')
    expect(result.profile.city).toBe('Seoul, KR')
    expect(result.profile.currentEmployer).toBe('Naver')
    expect(result.profile.currentTitle).toBe('Engineer')
    expect(result.profile.careerHistory[0].startDate).toBe('2022-06')
    expect(result.profile.educationHistory[0].startDate).toBe('2017')
    expect(result.linkedinUsername).toBe('jin-park')
    expect(result.recordTimestamp).toBe('2026-04-15')
  })

  it('extracts username from url when present', () => {
    const result = mapBrightDataRecord({
      ...sample,
      url: 'https://www.linkedin.com/in/another-slug/',
    })
    if (!result.ok) throw new Error('expected ok')
    expect(result.linkedinUsername).toBe('another-slug')
  })

  it('returns invalid_response for non-object', () => {
    expect(mapBrightDataRecord('nope')).toEqual({
      ok: false,
      error: 'invalid_response',
      detail: 'not an object',
    })
  })
})

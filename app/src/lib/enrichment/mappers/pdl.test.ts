import { describe, expect, it } from 'vitest'
import { mapPdlPerson } from './pdl'

const sample = {
  id: 'pdl_abc',
  linkedin_url: 'https://linkedin.com/in/jin-park',
  linkedin_username: 'jin-park',
  full_name: 'Jin Park',
  headline: 'Engineer at Naver',
  job_title: 'Engineer',
  job_company_name: 'Naver',
  location_name: 'seoul, south korea',
  experience: [
    {
      company: { name: 'Naver' },
      title: { name: 'Engineer' },
      start_date: '2022-06',
      end_date: null,
      summary: 'Search team',
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
      school: { name: 'KAIST' },
      degrees: ['Bachelor'],
      majors: ['Computer Science'],
      start_date: '2017',
      end_date: '2021',
    },
  ],
  skills: ['typescript', 'python'],
}

describe('mapPdlPerson', () => {
  it('maps PDL person into ExtractedProfile', () => {
    const result = mapPdlPerson(sample)
    if (!result.ok) throw new Error(`expected ok, got ${result.error}`)
    expect(result.profile.name).toBe('Jin Park')
    expect(result.profile.currentEmployer).toBe('Naver')
    expect(result.profile.currentTitle).toBe('Engineer')
    expect(result.profile.careerHistory[0].employer).toBe('Naver')
    expect(result.profile.careerHistory[1].employer).toBe('Kakao')
    expect(result.profile.educationHistory[0].school).toBe('KAIST')
    expect(result.profile.educationHistory[0].degree).toBe('Bachelor')
    expect(result.profile.educationHistory[0].field).toBe('Computer Science')
    expect(result.linkedinUsername).toBe('jin-park')
  })

  it('returns invalid_response when both id and linkedin_url are missing', () => {
    const result = mapPdlPerson({ ...sample, id: null, linkedin_url: null })
    expect(result.ok).toBe(false)
  })
})

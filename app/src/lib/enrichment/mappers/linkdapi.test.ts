import { describe, expect, it } from 'vitest'
import { mapLinkdApiProfile } from './linkdapi'

// Realistic fixture probed live against LinkdAPI /api/v1/profile/full.
// The provider unwraps the `{ success, data }` envelope before calling the
// mapper, so this fixture is the bare profile object.
const sample = {
  id: 494633894,
  urn: 'ACoAAB17g6YBVVaIU7iroZGG0rDCfdx4dv34ZEU',
  username: 'jin-park',
  firstName: 'Jin',
  lastName: 'Park',
  headline: 'Engineer at Naver',
  geo: {
    country: 'South Korea',
    city: 'Seoul, South Korea',
    full: 'Seoul, South Korea',
    countryCode: 'kr',
  },
  currentPositions: [{ companyName: 'Naver', company: { name: 'Naver' } }],
  fullPositions: [
    {
      companyName: 'Naver',
      title: 'Engineer',
      description: 'Search team',
      start: { year: 2022, month: 6, day: 0 },
      end: null,
    },
    {
      companyName: 'Kakao',
      title: 'Intern',
      description: '',
      start: { year: 2021, month: 0, day: 0 },
      end: { year: 2022, month: 5, day: 0 },
    },
  ],
  educations: [
    {
      schoolName: 'KAIST',
      degree: 'BS',
      fieldOfStudy: 'Computer Science',
      start: { year: 2017, month: 0, day: 0 },
      end: { year: 2021, month: 0, day: 0 },
    },
  ],
  skills: [{ name: 'TypeScript' }, { name: 'Python' }],
}

describe('mapLinkdApiProfile', () => {
  it('maps a well-formed response into ExtractedProfile', () => {
    const result = mapLinkdApiProfile(sample)
    if (!result.ok) throw new Error(`expected ok, got ${result.error}`)

    expect(result.profile.name).toBe('Jin Park')
    expect(result.profile.headline).toBe('Engineer at Naver')
    expect(result.profile.currentEmployer).toBe('Naver')
    expect(result.profile.currentTitle).toBe('Engineer')
    expect(result.profile.city).toBe('Seoul, South Korea')
    expect(result.profile.careerHistory).toHaveLength(2)
    expect(result.profile.careerHistory[0]).toMatchObject({
      employer: 'Naver',
      title: 'Engineer',
      startDate: '2022-06',
      endDate: null,
    })
    expect(result.profile.careerHistory[1].startDate).toBe('2021')
    expect(result.profile.educationHistory[0]).toMatchObject({
      school: 'KAIST',
      degree: 'BS',
      field: 'Computer Science',
      startDate: '2017',
      endDate: '2021',
    })
    expect(result.profile.skills).toEqual(['TypeScript', 'Python'])
    expect(result.providerRecordId).toBe('ACoAAB17g6YBVVaIU7iroZGG0rDCfdx4dv34ZEU')
    expect(result.linkedinUsername).toBe('jin-park')
  })

  it('returns invalid_response for a non-object', () => {
    expect(mapLinkdApiProfile(null)).toEqual({
      ok: false,
      error: 'invalid_response',
      detail: 'not an object',
    })
  })

  it('falls back to username when urn is missing', () => {
    const result = mapLinkdApiProfile({ ...sample, urn: null })
    if (!result.ok) throw new Error('expected ok')
    expect(result.providerRecordId).toBe('jin-park')
  })

  it('returns invalid_response when urn and username are both missing', () => {
    const result = mapLinkdApiProfile({ ...sample, urn: null, username: null })
    expect(result.ok).toBe(false)
  })

  it('composes name from firstName + lastName', () => {
    const result = mapLinkdApiProfile({
      ...sample,
      firstName: 'Dongwoo (Richard)',
      lastName: 'Lee',
    })
    if (!result.ok) throw new Error('expected ok')
    expect(result.profile.name).toBe('Dongwoo (Richard) Lee')
  })
})

import { describe, expect, it } from 'vitest'
import type { ImportCurrentProfile } from './import-current-profile'
import {
  buildImportApplyPayload,
  buildInitialScalarChoices,
  currentProfileAsExtracted,
  parseApplySelections,
} from './import-proposal'

const current: ImportCurrentProfile = {
  name: 'Alex Morgan',
  headline: null,
  city: null,
  currentEmployer: null,
  currentTitle: null,
  university: null,
  major: null,
  linkedinUrl: null,
  careerHistory: [],
  educationHistory: [],
  skills: [],
}

describe('onboarding import proposal', () => {
  it('builds one normalized profile command from reviewed fields', () => {
    const selections = parseApplySelections(
      JSON.stringify({
        scalars: {
          name: { use: true, value: 'Alex Morgan' },
          headline: { use: true, value: 'Climate programs' },
          city: { use: true, value: 'Los Angeles, CA' },
          currentEmployer: { use: true, value: 'Civic Futures' },
          currentTitle: { use: true, value: 'Program Associate' },
          university: { use: true, value: 'UCLA' },
          major: { use: true, value: 'Public Policy' },
        },
        careerHistory: [
          {
            use: true,
            employer: 'Civic Futures',
            title: 'Program Associate',
            startDate: '2024-07',
            endDate: null,
            description: 'Builds partnerships.',
          },
        ],
        educationHistory: [
          {
            use: true,
            school: 'UCLA',
            degree: 'B.A.',
            field: 'Public Policy',
            startDate: '2018',
            endDate: '2022',
          },
        ],
        skills: [
          { use: true, value: 'Program management' },
          { use: true, value: 'program management' },
        ],
      }),
    )

    expect(
      buildImportApplyPayload({
        current,
        selections,
        preferredName: 'Alex',
        nameOther: null,
        graduationYear: 2018,
        industry: null,
      }),
    ).toMatchObject({
      identity: { displayName: 'Alex Morgan', graduationYear: 2018 },
      education: { university: 'UCLA', major: 'Public Policy' },
      current: { currentEmployer: 'Civic Futures', currentTitle: 'Program Associate' },
      history: {
        experiences: [{ startYear: 2024, startMonth: 7, endYear: null, endMonth: null }],
        skills: ['Program management'],
      },
    })
  })

  it('preserves current scalar values when an imported field is unchecked', () => {
    const withCurrent = { ...current, city: 'Long Beach, CA' }
    const selections = parseApplySelections(
      JSON.stringify({
        scalars: {
          name: { use: false, value: 'Different Person' },
          headline: { use: false, value: null },
          city: { use: false, value: 'New York, NY' },
          currentEmployer: { use: false, value: null },
          currentTitle: { use: false, value: null },
          university: { use: false, value: null },
          major: { use: false, value: null },
        },
        careerHistory: [],
        educationHistory: [],
        skills: [],
      }),
    )
    const payload = buildImportApplyPayload({
      current: withCurrent,
      selections,
      preferredName: null,
      nameOther: null,
      graduationYear: 2018,
      industry: null,
    })
    expect(payload.identity.displayName).toBe('Alex Morgan')
    expect(payload.current.city).toBe('Long Beach, CA')
  })

  it('projects the current v2 profile into the provider quality contract', () => {
    expect(currentProfileAsExtracted(current)).toEqual({
      name: 'Alex Morgan',
      headline: null,
      city: null,
      currentEmployer: null,
      currentTitle: null,
      university: null,
      major: null,
      careerHistory: [],
      educationHistory: [],
      skills: [],
    })
  })

  it('defaults an unsupported imported current role to not selected', () => {
    const choices = buildInitialScalarChoices({
      name: 'Dongwoo (Richard) Lee',
      headline: 'Ph.D Student at UCLA (Medical Informatics)',
      city: 'Los Angeles, California, United States',
      currentEmployer: 'A2 Biotherapeutics, Inc.',
      currentTitle: 'Research Associate II',
      university: 'UCLA',
      major: 'Medical Informatics',
      careerHistory: [
        {
          employer: 'A2 Biotherapeutics, Inc.',
          title: 'Research Associate II',
          startDate: '2023-09',
          endDate: '2024-07',
          description: null,
        },
      ],
      educationHistory: [],
      skills: [],
    })

    expect(choices.currentEmployer).toEqual({
      use: false,
      value: 'A2 Biotherapeutics, Inc.',
    })
    expect(choices.currentTitle).toEqual({
      use: false,
      value: 'Research Associate II',
    })
    expect(choices.headline.use).toBe(true)
  })

  it('selects a current role when an open-ended career entry supports it', () => {
    const choices = buildInitialScalarChoices({
      name: 'Jin Park',
      headline: 'Engineer at Naver',
      city: 'Seoul, South Korea',
      currentEmployer: 'NAVER Corp.',
      currentTitle: 'Engineer',
      university: 'KAIST',
      major: 'Computer Science',
      careerHistory: [
        {
          employer: 'Naver Corp',
          title: 'Engineer',
          startDate: '2022-06',
          endDate: null,
          description: null,
        },
      ],
      educationHistory: [],
      skills: [],
    })

    expect(choices.currentEmployer.use).toBe(true)
    expect(choices.currentTitle.use).toBe(true)
  })
})

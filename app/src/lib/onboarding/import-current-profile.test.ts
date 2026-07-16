import { describe, expect, it, vi } from 'vitest'
import type { ProfileRepository, SelfProfile } from '@/lib/profile/contracts'
import { getImportCurrentProfile } from './import-current-profile'

const profile: SelfProfile = {
  membership: {
    id: '11111111-1111-4111-8111-111111111111',
    status: 'active',
    organization: {
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Chadwick School',
      slug: 'chadwick',
    },
  },
  identity: {
    displayName: 'Richard Lee',
    preferredName: null,
    nameOther: null,
    graduationYear: 2018,
    avatarPath: null,
  },
  current: {
    headline: 'Building BridgeCircle',
    employer: 'BridgeCircle',
    title: 'Founder',
    industry: 'Technology',
    city: 'Los Angeles',
    university: 'UCLA',
    major: 'Neuroscience',
  },
  education: [
    {
      id: '1',
      school: 'UCLA',
      degree: 'PhD',
      field: 'Neuroscience',
      startYear: 2024,
      startMonth: 9,
      endYear: null,
      endMonth: null,
      description: null,
    },
  ],
  experiences: [
    {
      id: '1',
      employer: 'BridgeCircle',
      title: 'Founder',
      startYear: 2025,
      startMonth: null,
      endYear: null,
      endMonth: null,
      description: 'Member-first warm networks.',
    },
  ],
  skills: [{ name: 'Product strategy' }],
  visibility: {},
  links: [],
  preferences: {
    bio: null,
    openToHelp: true,
    helperTopics: [],
    freshness: {
      linkedinUrl: 'https://www.linkedin.com/in/richardlee',
      refreshPolicy: 'review_before_update',
      refreshInterval: 'monthly',
      consentedAt: null,
    },
  },
}

describe('getImportCurrentProfile', () => {
  it('maps the v2 viewer-owned profile into the import comparison shape', async () => {
    const profiles: Pick<ProfileRepository, 'get'> = {
      get: vi.fn().mockResolvedValue({ ok: true, profile }),
    }

    await expect(getImportCurrentProfile(profiles, profile.membership.id)).resolves.toEqual({
      name: 'Richard Lee',
      headline: 'Building BridgeCircle',
      city: 'Los Angeles',
      currentEmployer: 'BridgeCircle',
      currentTitle: 'Founder',
      university: 'UCLA',
      major: 'Neuroscience',
      linkedinUrl: 'https://www.linkedin.com/in/richardlee',
      careerHistory: [
        {
          employer: 'BridgeCircle',
          title: 'Founder',
          start_date: '2025',
          end_date: null,
          description: 'Member-first warm networks.',
        },
      ],
      educationHistory: [
        {
          school: 'UCLA',
          degree: 'PhD',
          field: 'Neuroscience',
          start_date: '2024-09',
          end_date: null,
        },
      ],
      skills: ['Product strategy'],
    })
  })

  it('returns an empty comparison profile when the owned profile is unavailable', async () => {
    const profiles: Pick<ProfileRepository, 'get'> = {
      get: vi.fn().mockResolvedValue({ ok: false, error: 'not_found' }),
    }

    await expect(getImportCurrentProfile(profiles, profile.membership.id)).resolves.toEqual({
      name: null,
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
    })
  })
})

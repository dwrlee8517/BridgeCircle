import { describe, expect, it } from 'vitest'
import { parseProfileRow } from './profiles'

describe('profile repository result mapping', () => {
  it('parses the bounded self-edit projection', () => {
    expect(
      parseProfileRow({
        result_code: 'ok',
        profile: {
          membership: {
            id: '61000000-0000-4000-8000-000000000001',
            status: 'active',
            organization: {
              id: '60000000-0000-4000-8000-000000000001',
              name: 'Chadwick School',
              slug: 'chadwick',
            },
          },
          identity: {
            displayName: 'Maren Lee',
            preferredName: 'Maren',
            nameOther: null,
            graduationYear: 2022,
            avatarPath: null,
          },
          current: {
            headline: null,
            employer: null,
            title: null,
            city: null,
            university: null,
            major: null,
            linkedinUrl: null,
          },
          education: [],
          experiences: [],
          skills: [],
          visibility: {},
          preferences: {
            bio: null,
            openToHelp: true,
            helperTopics: [],
            freshness: {
              linkedinUrl: null,
              refreshPolicy: 'review_before_update',
              refreshInterval: 'monthly',
              consentedAt: null,
            },
          },
        },
      }),
    ).toMatchObject({ ok: true, profile: { identity: { displayName: 'Maren Lee' } } })
  })

  it('maps not-found without attempting to parse a profile', () => {
    expect(parseProfileRow({ result_code: 'not_found', profile: null })).toEqual({
      ok: false,
      error: 'not_found',
    })
  })
})

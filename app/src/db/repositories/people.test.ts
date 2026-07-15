import { describe, expect, it } from 'vitest'
import { parseMemberProfileRow, parsePeopleRow } from './people'

const UUIDS = {
  membership: '00000000-0000-4000-8000-000000000001',
  user: '00000000-0000-4000-8000-000000000002',
  conversation: '00000000-0000-4000-8000-000000000003',
  experience: '00000000-0000-4000-8000-000000000004',
}

describe('People repository contracts', () => {
  it('parses a connected directory row and rejects inconsistent relationship IDs', () => {
    const row = {
      target_membership_id: UUIDS.membership,
      target_user_id: UUIDS.user,
      display_name: 'Maya Chen',
      preferred_name: 'Maya',
      avatar_path: null,
      headline: 'Climate investor',
      current_employer: 'Common Thread',
      current_title: 'Partner',
      industry: 'Climate',
      city: 'Los Angeles, CA',
      graduation_year: 2018,
      open_to_help: true,
      helper_topics: ['Career changes'],
      relationship_state: 'connected',
      pending_request_id: null,
      conversation_id: UUIDS.conversation,
      match_evidence: [
        {
          kind: 'current_role',
          title: 'Partner',
          organization: 'Common Thread',
          sourceSection: null,
        },
      ],
      total_count: 1,
      rank_score: 2.5,
      profile_updated_at: '2026-07-15T00:00:00.000Z',
    }
    expect(parsePeopleRow(row).relationship).toEqual({
      state: 'connected',
      requestId: null,
      conversationId: UUIDS.conversation,
    })
    expect(() => parsePeopleRow({ ...row, pending_request_id: UUIDS.experience })).toThrow(
      'inconsistent durable IDs',
    )
  })

  it('strictly parses the viewer-shaped member profile', () => {
    const profile = {
      membershipId: UUIDS.membership,
      userId: UUIDS.user,
      identity: {
        displayName: 'Maya Chen',
        preferredName: 'Maya',
        avatarPath: null,
        graduationYear: 2018,
      },
      current: {
        headline: 'Climate investor',
        employer: 'Common Thread',
        title: 'Partner',
        industry: 'Climate',
        city: 'Los Angeles, CA',
      },
      about: 'I help founders think clearly about climate capital.',
      experiences: [
        {
          id: UUIDS.experience,
          employer: 'Common Thread',
          title: 'Partner',
          startYear: 2024,
          startMonth: 1,
          endYear: null,
          endMonth: null,
          description: null,
        },
      ],
      education: [],
      skills: ['Climate finance'],
      links: [],
      help: { openToHelp: true, topics: ['Career changes'] },
      relationship: {
        state: 'connected',
        requestId: null,
        conversationId: UUIDS.conversation,
      },
      sharedContext: [{ kind: 'same_city', value: 'Los Angeles, CA' }],
      updatedAt: '2026-07-15T00:00:00.000Z',
    }
    expect(parseMemberProfileRow({ result_code: 'ok', profile })).toEqual({ ok: true, profile })
    expect(parseMemberProfileRow({ result_code: 'not_available', profile: null })).toEqual({
      ok: false,
      error: 'not_available',
    })
    expect(() =>
      parseMemberProfileRow({ result_code: 'ok', profile: { ...profile, hidden: 'field' } }),
    ).toThrow()
  })
})

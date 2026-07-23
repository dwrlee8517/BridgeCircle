import { describe, expect, it } from 'vitest'
import { parseHomeNative, parseSaveAskOutcomeShare } from './home'

describe('Home repository contracts', () => {
  it('parses the exact native Home shape', () => {
    expect(
      parseHomeNative({
        resultCode: 'ok',
        weeklyPulse: { newMembers: 2, refreshedProfiles: 1 },
        recognition: null,
        outcomeStory: {
          askId: '40000000-0000-4000-8000-000000000001',
          outcomeNote: 'A warm introduction led to the first interview.',
          sharedAt: '2026-07-15T10:00:00Z',
          identityMode: 'anonymous',
        },
      }),
    ).toMatchObject({ weeklyPulse: { newMembers: 2, refreshedProfiles: 1 } })
  })

  it('rejects unexpected native projection fields', () => {
    expect(() =>
      parseHomeNative({
        resultCode: 'ok',
        weeklyPulse: { newMembers: 0, refreshedProfiles: 0 },
        recognition: null,
        outcomeStory: null,
        privateConsent: true,
      }),
    ).toThrow()
  })

  it('enforces the outcome identity boundary in both directions', () => {
    const base = {
      resultCode: 'ok' as const,
      weeklyPulse: { newMembers: 0, refreshedProfiles: 0 },
      recognition: null,
    }
    expect(() =>
      parseHomeNative({
        ...base,
        outcomeStory: {
          askId: '40000000-0000-4000-8000-000000000001',
          outcomeNote: 'A useful introduction.',
          sharedAt: '2026-07-15T10:00:00Z',
          identityMode: 'identified',
        },
      }),
    ).toThrow(/identified outcome requires both participant names/)
    expect(() =>
      parseHomeNative({
        ...base,
        outcomeStory: {
          askId: '40000000-0000-4000-8000-000000000001',
          outcomeNote: 'A useful introduction.',
          sharedAt: '2026-07-15T10:00:00Z',
          identityMode: 'anonymous',
          askerName: 'Private Asker',
        },
      }),
    ).toThrow(/anonymous outcome must not include participant names/)
  })

  it('requires a durable Ask id on a saved consent result', () => {
    expect(() =>
      parseSaveAskOutcomeShare({
        result_code: 'saved',
        ask_id: null,
        share_story: true,
        share_identity: false,
      }),
    ).toThrow(/saved without Ask/)
  })
})

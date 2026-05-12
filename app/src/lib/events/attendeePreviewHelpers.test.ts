import { describe, expect, test } from 'vitest'
import { hydrate, type RsvpRow, trimByEvent } from './attendeePreviewHelpers'

const r = (event_id: string, user_id: string, responded_at: string | null = null): RsvpRow => ({
  event_id,
  user_id,
  responded_at,
})

describe('trimByEvent', () => {
  test('returns empty map for empty input', () => {
    expect(trimByEvent([], 5).size).toBe(0)
  })

  test('groups rows by event_id preserving input order', () => {
    const out = trimByEvent([r('e1', 'u1'), r('e2', 'u2'), r('e1', 'u3')], 5)
    expect(out.get('e1')?.map((x) => x.user_id)).toEqual(['u1', 'u3'])
    expect(out.get('e2')?.map((x) => x.user_id)).toEqual(['u2'])
  })

  test('caps each event at `limit` entries, keeping the earliest', () => {
    const rows = [
      r('e1', 'u1'),
      r('e1', 'u2'),
      r('e1', 'u3'),
      r('e1', 'u4'),
      r('e1', 'u5'),
      r('e1', 'u6'),
    ]
    const out = trimByEvent(rows, 3)
    expect(out.get('e1')?.map((x) => x.user_id)).toEqual(['u1', 'u2', 'u3'])
  })

  test('limit of 0 keeps no entries', () => {
    const out = trimByEvent([r('e1', 'u1')], 0)
    expect(out.get('e1')).toBeUndefined()
  })
})

describe('hydrate', () => {
  test('joins RSVPs with profile rows by user_id', () => {
    const grouped = trimByEvent([r('e1', 'u1'), r('e1', 'u2')], 5)
    const out = hydrate(grouped, [
      { user_id: 'u1', name: 'Alice', avatar_url: 'https://x/a.jpg' },
      { user_id: 'u2', name: 'Bob', avatar_url: null },
    ])
    expect(out.get('e1')).toEqual([
      { userId: 'u1', name: 'Alice', avatarUrl: 'https://x/a.jpg' },
      { userId: 'u2', name: 'Bob', avatarUrl: null },
    ])
  })

  test('emits nulls for users with no profile row (no crash)', () => {
    const grouped = trimByEvent([r('e1', 'u-missing')], 5)
    const out = hydrate(grouped, [])
    expect(out.get('e1')).toEqual([{ userId: 'u-missing', name: null, avatarUrl: null }])
  })

  test('preserves per-event ordering from trimByEvent', () => {
    const grouped = trimByEvent([r('e1', 'u2'), r('e1', 'u1')], 5)
    const out = hydrate(grouped, [
      { user_id: 'u1', name: 'Alice', avatar_url: null },
      { user_id: 'u2', name: 'Bob', avatar_url: null },
    ])
    expect(out.get('e1')?.map((a) => a.userId)).toEqual(['u2', 'u1'])
  })
})

import { describe, expect, it } from 'vitest'
import { isoToLocalDateTime, isValidTimeZone, localDateTimeToIso } from './admin-event-time'

describe('admin event timezone conversion', () => {
  it('interprets the same wall time differently in Palos Verdes and Songdo', () => {
    expect(localDateTimeToIso('2026-07-21T18:30', 'America/Los_Angeles')).toBe(
      '2026-07-22T01:30:00.000Z',
    )
    expect(localDateTimeToIso('2026-07-21T18:30', 'Asia/Seoul')).toBe('2026-07-21T09:30:00.000Z')
  })

  it('round-trips instants using the selected timezone', () => {
    const iso = '2026-12-15T02:15:00.000Z'
    const local = isoToLocalDateTime(iso, 'America/Los_Angeles')
    expect(local).toBe('2026-12-14T18:15')
    expect(localDateTimeToIso(local, 'America/Los_Angeles')).toBe(iso)
  })

  it('rejects invalid dates, zones, and nonexistent DST wall times', () => {
    expect(localDateTimeToIso('2026-02-30T10:00', 'America/Los_Angeles')).toBeNull()
    expect(localDateTimeToIso('2026-03-08T02:30', 'America/Los_Angeles')).toBeNull()
    expect(localDateTimeToIso('2026-07-21T18:30', 'Not/A_Timezone')).toBeNull()
    expect(isValidTimeZone('Asia/Seoul')).toBe(true)
    expect(isValidTimeZone('Not/A_Timezone')).toBe(false)
  })
})

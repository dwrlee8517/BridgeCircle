import { describe, expect, it } from 'vitest'
import { announcementFilterHref, parseAnnouncementFilter, selectedSchoolEventId } from './query'

describe('School query parsing', () => {
  it('accepts only the canonical announcement filters', () => {
    expect(parseAnnouncementFilter('mentorship')).toBe('mentorship')
    expect(parseAnnouncementFilter(['hiring', 'general'])).toBe('hiring')
    expect(parseAnnouncementFilter('not-a-filter')).toBe('all')
    expect(parseAnnouncementFilter(undefined)).toBe('all')
  })

  it('builds stable archive filter URLs', () => {
    expect(announcementFilterHref('all')).toBe('/school/announcements')
    expect(announcementFilterHref('reunion')).toBe('/school/announcements?tag=reunion')
  })

  it('rejects malformed event selection values', () => {
    const eventId = 'eeee0000-0000-4000-8000-000000000001'
    expect(selectedSchoolEventId(eventId)).toBe(eventId)
    expect(selectedSchoolEventId([eventId, 'ignored'])).toBe(eventId)
    expect(selectedSchoolEventId('summer-gathering')).toBeNull()
  })
})

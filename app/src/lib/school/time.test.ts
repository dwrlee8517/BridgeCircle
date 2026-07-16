import { describe, expect, it } from 'vitest'
import {
  buildSchoolEventCalendar,
  campusTimeLabel,
  eventCalendarFilename,
  formatEventDate,
  formatEventTimeRange,
} from './time'

describe('School time and calendar formatting', () => {
  it('formats the same instant in the requested campus time zone', () => {
    const instant = '2026-07-16T01:30:00.000Z'
    expect(formatEventDate(instant, 'America/Los_Angeles')).toBe('Wed, Jul 15')
    expect(formatEventDate(instant, 'Asia/Seoul')).toBe('Thu, Jul 16')
    expect(formatEventTimeRange(instant, null, 'America/Los_Angeles')).toContain('6:30 PM')
  })

  it('labels campus time without guessing from the viewer browser', () => {
    expect(campusTimeLabel({ campus: 'songdo', timeZone: 'Asia/Seoul' })).toBe(
      'Songdo time · Asia/Seoul',
    )
  })

  it('creates stable safe calendar filenames', () => {
    expect(eventCalendarFilename('Summer Gathering — Main Court!')).toBe(
      'summer-gathering-main-court.ics',
    )
    expect(eventCalendarFilename('서울 모임')).toBe('bridgecircle-event.ics')
  })

  it('serializes UTC calendar timestamps and escapes member-facing text', () => {
    const calendar = buildSchoolEventCalendar(
      {
        id: 'eeee0000-0000-4000-8000-000000000001',
        title: 'Gathering, then dinner',
        summary: 'Line one; bring a friend\nLine two',
        startsAt: '2026-07-16T01:30:00.000Z',
        endsAt: '2026-07-16T03:30:00.000Z',
        locationName: 'Main Court, Patio',
      },
      'https://bridgecircle.org/school/events/eeee0000-0000-4000-8000-000000000001',
    )

    expect(calendar).toContain('DTSTART:20260716T013000Z')
    expect(calendar).toContain('DTEND:20260716T033000Z')
    expect(calendar).toContain('SUMMARY:Gathering\\, then dinner')
    expect(calendar).toContain('DESCRIPTION:Line one\\; bring a friend\\nLine two')
    expect(calendar.endsWith('\r\n')).toBe(true)
  })
})

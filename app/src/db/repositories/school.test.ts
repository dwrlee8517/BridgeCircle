import { describe, expect, it } from 'vitest'
import { parseAdminSchoolEvents } from './school'

const event = {
  id: 'eeee0000-0000-4000-8000-000000000001',
  status: 'published',
  title: 'Online office hours',
  description: null,
  location: null,
  startsAt: '2026-07-20T18:00:00Z',
  endsAt: null,
  capacity: null,
  goingCount: 2,
  waitlistCount: 0,
}

describe('School admin repository projection', () => {
  it('accepts the nullable event location emitted by the database contract', () => {
    expect(parseAdminSchoolEvents({ resultCode: 'ok', items: [event] })).toEqual([event])
  })

  it('rejects partial or unexpected admin event projections', () => {
    expect(() =>
      parseAdminSchoolEvents({ resultCode: 'ok', items: [{ ...event, goingCount: undefined }] }),
    ).toThrow()
    expect(() =>
      parseAdminSchoolEvents({ resultCode: 'ok', items: [{ ...event, privateNotes: 'hidden' }] }),
    ).toThrow()
  })
})

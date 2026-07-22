import { describe, expect, it } from 'vitest'
import { parseAdminEventForm } from './admin-schemas'

function validForm() {
  const form = new FormData()
  form.set('title', 'Seoul alumni evening')
  form.set('summary', 'A relaxed evening for alumni across class years.')
  form.set('description', 'Doors open at 6:00pm.')
  form.set('category', 'Community')
  form.set('format', 'hybrid')
  form.set('timeZone', 'Asia/Seoul')
  form.set('campus', 'songdo')
  form.set('startsAt', '2026-08-20T18:30')
  form.set('endsAt', '2026-08-20T20:30')
  form.set('locationName', 'Chadwick International')
  form.set('locationAddress', '45 Art center-daero 97beon-gil')
  form.set('mapsUrl', 'https://maps.example.com/chadwick')
  form.set('joinUrl', 'https://meet.example.com/alumni')
  form.set('joinWindowMinutes', '60')
  form.set('hostName', 'Alumni Office')
  form.set('capacity', '80')
  form.set('allowWaitlist', 'on')
  form.set('schedule.0.startsAt', '2026-08-20T18:30')
  form.set('schedule.0.label', 'Welcome')
  form.set('facts.0.label', 'Dress')
  form.set('facts.0.value', 'Come as you are')
  form.set('facts.0.linkLabel', 'Campus guide')
  form.set('facts.0.linkUrl', 'https://example.com/guide')
  return form
}

describe('admin event form', () => {
  it('parses complete member-facing details and applies the selected timezone', () => {
    const parsed = parseAdminEventForm(validForm())
    expect(parsed.success).toBe(true)
    if (!parsed.success) return
    expect(parsed.data.startsAt).toBe('2026-08-20T09:30:00.000Z')
    expect(parsed.data.endsAt).toBe('2026-08-20T11:30:00.000Z')
    expect(parsed.data.schedule).toEqual([
      { startsAt: '2026-08-20T09:30:00.000Z', label: 'Welcome' },
    ])
    expect(parsed.data.facts[0]).toEqual({
      label: 'Dress',
      value: 'Come as you are',
      linkLabel: 'Campus guide',
      linkUrl: 'https://example.com/guide',
    })
  })

  it.each([
    ['in_person', '', 'locationName'],
    ['online', '', 'joinUrl'],
    ['hybrid', '', 'joinUrl'],
  ])('enforces %s attendance details', (format, emptyValue, expectedPath) => {
    const form = validForm()
    form.set('format', format)
    form.set(expectedPath, emptyValue)
    const parsed = parseAdminEventForm(form)
    expect(parsed.success).toBe(false)
    if (parsed.success) return
    expect(parsed.error.issues.some((issue) => issue.path.join('.') === expectedPath)).toBe(true)
  })

  it('requires capacity for a waitlist and paired fact links', () => {
    const form = validForm()
    form.set('capacity', '')
    form.set('facts.0.linkLabel', '')
    const parsed = parseAdminEventForm(form)
    expect(parsed.success).toBe(false)
    if (parsed.success) return
    const paths = parsed.error.issues.map((issue) => issue.path.join('.'))
    expect(paths).toContain('allowWaitlist')
    expect(paths).toContain('facts.0.linkLabel')
  })

  it('rejects an end time before the start time', () => {
    const form = validForm()
    form.set('endsAt', '2026-08-20T18:00')
    const parsed = parseAdminEventForm(form)
    expect(parsed.success).toBe(false)
    if (parsed.success) return
    expect(parsed.error.issues.some((issue) => issue.path.join('.') === 'endsAt')).toBe(true)
  })

  it('rejects timezone names the database event contract cannot store', () => {
    const form = validForm()
    form.set('timeZone', 'UTC')
    const parsed = parseAdminEventForm(form)
    expect(parsed.success).toBe(false)
    if (parsed.success) return
    expect(parsed.error.issues.some((issue) => issue.path.join('.') === 'timeZone')).toBe(true)
  })
})

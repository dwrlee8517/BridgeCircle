import { describe, expect, it } from 'vitest'
import type { AdminSchoolEvent } from '@/lib/school/contracts'
import { createSchoolRepository, parseAdminSchoolEvents } from './school'

const event = {
  id: 'eeee0000-0000-4000-8000-000000000001',
  status: 'published',
  title: 'Online office hours',
  summary: 'Bring a question and meet alumni working across product and engineering.',
  description: null,
  category: 'Career',
  format: 'online',
  timeZone: 'America/Los_Angeles',
  campus: 'online',
  location: null,
  locationAddress: null,
  mapsUrl: null,
  joinUrl: 'https://meet.example.com/office-hours',
  joinWindowMinutes: 60,
  hostName: 'Alumni Office',
  startsAt: '2026-07-20T18:00:00Z',
  endsAt: '2026-07-20T19:00:00Z',
  capacity: null,
  allowWaitlist: false,
  changeNote: null,
  schedule: [{ startsAt: '2026-07-20T18:00:00Z', label: 'Welcome' }],
  facts: [{ label: 'Format', value: 'Small group', linkLabel: null, linkUrl: null }],
  goingCount: 2,
  waitlistCount: 0,
} satisfies AdminSchoolEvent

describe('School admin repository projection', () => {
  it('accepts the full authoring projection with nullable online location fields', () => {
    expect(parseAdminSchoolEvents({ resultCode: 'ok', items: [event] })).toEqual([event])
  })

  it('saves the complete authoring contract through the v2 command', async () => {
    const calls: Array<{ name: string; args: Record<string, unknown> }> = []
    const client = {
      schema: () => ({
        rpc: async (name: string, args: Record<string, unknown>) => {
          calls.push({ name, args })
          return {
            data: { resultCode: 'created', eventId: event.id },
            error: null,
          }
        },
      }),
    }

    const result = await createSchoolRepository(client as never).saveAdminEvent({
      membershipId: '11111111-1111-4111-8111-111111111111',
      eventId: null,
      title: event.title,
      summary: event.summary,
      description: event.description,
      category: event.category,
      format: event.format,
      timeZone: event.timeZone,
      campus: event.campus,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      locationName: event.location,
      locationAddress: event.locationAddress,
      mapsUrl: event.mapsUrl,
      joinUrl: event.joinUrl,
      joinWindowMinutes: event.joinWindowMinutes,
      hostName: event.hostName,
      capacity: event.capacity,
      allowWaitlist: event.allowWaitlist,
      changeNote: event.changeNote,
      schedule: event.schedule,
      facts: event.facts,
    })

    expect(result).toBe('created')
    expect(calls).toHaveLength(1)
    expect(calls[0]?.name).toBe('save_admin_school_event_v2')
    expect(calls[0]?.args).toMatchObject({
      p_membership_id: '11111111-1111-4111-8111-111111111111',
      p_summary: event.summary,
      p_time_zone: 'America/Los_Angeles',
      p_join_url: event.joinUrl,
      p_schedule: event.schedule,
      p_facts: event.facts,
    })
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

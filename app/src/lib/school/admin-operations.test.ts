import { describe, expect, it, vi } from 'vitest'
import {
  cancelAdminEvent,
  createAdminEvent,
  deleteAdminEvent,
  updateAdminEvent,
} from './operations'

const fields = {
  title: 'Community evening',
  summary: 'A practical evening for members.',
  description: null,
  category: 'Community',
  format: 'in_person' as const,
  timeZone: 'America/Los_Angeles',
  campus: 'palos_verdes' as const,
  startsAt: '2026-08-01T01:00:00.000Z',
  endsAt: '2026-08-01T03:00:00.000Z',
  locationName: 'Roessler Hall',
  locationAddress: null,
  mapsUrl: null,
  joinUrl: null,
  joinWindowMinutes: 60,
  hostName: 'the Alumni Office',
  capacity: 80,
  allowWaitlist: true,
  changeNote: null,
  schedule: [],
  facts: [],
}

describe('admin School event operations', () => {
  it('forces the create command to use a null event id', async () => {
    const saveAdminEvent = vi.fn(async () => 'created' as const)
    await createAdminEvent({ membershipId: 'membership-id', ...fields }, { saveAdminEvent })
    expect(saveAdminEvent).toHaveBeenCalledWith({
      membershipId: 'membership-id',
      eventId: null,
      ...fields,
    })
  })

  it('requires and forwards the update event id', async () => {
    const saveAdminEvent = vi.fn(async () => 'updated' as const)
    await updateAdminEvent(
      { membershipId: 'membership-id', eventId: 'event-id', ...fields },
      { saveAdminEvent },
    )
    expect(saveAdminEvent).toHaveBeenCalledWith({
      membershipId: 'membership-id',
      eventId: 'event-id',
      ...fields,
    })
  })

  it('delegates cancel and delete commands', async () => {
    const cancel = vi.fn(async () => 'cancelled' as const)
    const remove = vi.fn(async () => 'deleted' as const)
    await expect(
      cancelAdminEvent(
        { membershipId: 'membership-id', eventId: 'event-id', reason: 'Weather' },
        { cancelAdminEvent: cancel },
      ),
    ).resolves.toBe('cancelled')
    await expect(
      deleteAdminEvent(
        { membershipId: 'membership-id', eventId: 'event-id' },
        { deleteAdminEvent: remove },
      ),
    ).resolves.toBe('deleted')
  })
})

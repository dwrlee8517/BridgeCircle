import { describe, expect, it } from 'vitest'
import {
  ASK_EXPIRY_DAYS,
  ASK_REMINDER_UNLOCK_DAYS,
  askExpiryDate,
  askReminderUnlockDate,
  reminderAvailability,
} from './askLifecycle'

const SENT = '2026-06-11T12:00:00.000Z'

function daysAfter(iso: string, days: number): Date {
  return new Date(new Date(iso).getTime() + days * 24 * 60 * 60 * 1000)
}

describe('lifecycle dates', () => {
  it('unlocks the reminder after the configured window', () => {
    expect(askReminderUnlockDate(SENT).toISOString()).toBe(
      daysAfter(SENT, ASK_REMINDER_UNLOCK_DAYS).toISOString(),
    )
  })

  it('expires after the configured window', () => {
    expect(askExpiryDate(SENT).toISOString()).toBe(daysAfter(SENT, ASK_EXPIRY_DAYS).toISOString())
  })
})

describe('reminderAvailability', () => {
  const base = { status: 'pending', createdAt: SENT, reminderSentAt: null }

  it('is locked before the unlock day', () => {
    expect(reminderAvailability(base, daysAfter(SENT, 2))).toBe('locked')
    expect(reminderAvailability(base, daysAfter(SENT, 6.9))).toBe('locked')
  })

  it('becomes available at the unlock day', () => {
    expect(reminderAvailability(base, daysAfter(SENT, 7))).toBe('available')
    expect(reminderAvailability(base, daysAfter(SENT, 13))).toBe('available')
  })

  it('is spent after one send', () => {
    expect(
      reminderAvailability(
        { ...base, reminderSentAt: daysAfter(SENT, 8).toISOString() },
        daysAfter(SENT, 9),
      ),
    ).toBe('sent')
  })

  it('never applies to closed asks', () => {
    expect(reminderAvailability({ ...base, status: 'declined' }, daysAfter(SENT, 8))).toBe(
      'not_pending',
    )
    expect(reminderAvailability({ ...base, status: 'accepted' }, daysAfter(SENT, 8))).toBe(
      'not_pending',
    )
    expect(reminderAvailability({ ...base, status: 'expired' }, daysAfter(SENT, 20))).toBe(
      'not_pending',
    )
  })
})

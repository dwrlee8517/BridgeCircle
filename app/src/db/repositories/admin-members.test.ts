import { describe, expect, it } from 'vitest'
import { parseAdminMemberList, parseAdminRoleChange } from './admin-members'

const member = {
  membershipId: '20000000-0000-4000-8000-000000000002',
  userId: '10000000-0000-4000-8000-000000000002',
  displayName: 'Richard Lee',
  title: 'Investment Associate',
  employer: 'Common Capital',
  city: 'San Francisco, CA',
  graduationYear: 2018,
  status: 'active',
  joinedAt: '2026-06-01T00:00:00Z',
  createdAt: '2026-06-01T00:00:00Z',
  accountState: 'active',
  lastSeenAt: null,
  openToHelp: true,
  roles: ['event_moderator'],
}

describe('parseAdminMemberList', () => {
  it('parses the ok payload', () => {
    expect(parseAdminMemberList({ resultCode: 'ok', total: 1, items: [member] })).toEqual({
      ok: true,
      total: 1,
      items: [member],
    })
  })

  it('maps denial codes to errors', () => {
    expect(parseAdminMemberList({ resultCode: 'not_available' })).toEqual({
      ok: false,
      error: 'not_available',
    })
  })

  it('throws on unexpected member fields (contract drift)', () => {
    expect(() =>
      parseAdminMemberList({
        resultCode: 'ok',
        total: 1,
        items: [{ ...member, email: 'leak@example.com' }],
      }),
    ).toThrow()
  })
})

describe('parseAdminRoleChange', () => {
  it('maps durable outcomes to ok', () => {
    expect(parseAdminRoleChange({ resultCode: 'granted' })).toEqual({
      ok: true,
      status: 'granted',
    })
    expect(parseAdminRoleChange({ resultCode: 'not_found' })).toEqual({
      ok: true,
      status: 'not_found',
    })
  })

  it('maps refusals to errors', () => {
    expect(parseAdminRoleChange({ resultCode: 'forbidden' })).toEqual({
      ok: false,
      error: 'forbidden',
    })
  })

  it('throws on unknown result codes', () => {
    expect(() => parseAdminRoleChange({ resultCode: 'exploded' })).toThrow()
  })
})

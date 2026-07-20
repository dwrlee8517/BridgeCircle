import { describe, expect, it } from 'vitest'
import { parseAcceptInviteRow, parseVerifyInviteRow } from './invites'

describe('invite repository result mapping', () => {
  it('maps only the safe valid invite projection', () => {
    expect(
      parseVerifyInviteRow({
        result_code: 'valid',
        invite_id: '80000000-0000-4000-8000-000000000001',
        organization_id: '60000000-0000-4000-8000-000000000001',
        email: 'member@example.com',
        full_name: 'Member Name',
        graduation_year: 2020,
        organization_name: 'Chadwick School',
        organization_slug: 'chadwick',
        expires_at: '2026-07-15T00:00:00Z',
      }),
    ).toMatchObject({ ok: true, invite: { email: 'member@example.com' } })
  })

  it('maps non-secret verification failures without invite fields', () => {
    expect(
      parseVerifyInviteRow({
        result_code: 'expired',
        invite_id: null,
        organization_id: null,
        email: null,
        full_name: null,
        graduation_year: null,
        organization_name: null,
        organization_slug: null,
        expires_at: null,
      }),
    ).toEqual({ ok: false, error: 'expired' })
  })

  it('maps accepted membership state and stable denial codes', () => {
    expect(
      parseAcceptInviteRow({
        result_code: 'accepted',
        membership_id: '61000000-0000-4000-8000-000000000001',
        membership_status: 'pending',
      }),
    ).toEqual({
      ok: true,
      membershipId: '61000000-0000-4000-8000-000000000001',
      membershipStatus: 'pending',
    })
    expect(
      parseAcceptInviteRow({
        result_code: 'email_mismatch',
        membership_id: null,
        membership_status: null,
      }),
    ).toEqual({ ok: false, error: 'email_mismatch' })
  })
})

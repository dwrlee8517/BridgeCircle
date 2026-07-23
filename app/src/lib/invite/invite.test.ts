import { describe, expect, it, vi } from 'vitest'
import { acceptInvite } from './accept'
import { verifyInviteToken } from './verify'

describe('invite operations', () => {
  it('rejects malformed tokens before calling infrastructure', async () => {
    const verify = vi.fn()
    const accept = vi.fn()

    await expect(verifyInviteToken('short', { verify })).resolves.toEqual({
      ok: false,
      error: 'not_found',
    })
    await expect(acceptInvite('short', { accept })).resolves.toEqual({
      ok: false,
      error: 'not_found',
    })
    expect(verify).not.toHaveBeenCalled()
    expect(accept).not.toHaveBeenCalled()
  })

  it('returns repository results without framework behavior', async () => {
    const token = 'a'.repeat(32)
    const verify = vi.fn().mockResolvedValue({ ok: false, error: 'expired' })
    const accept = vi.fn().mockResolvedValue({
      ok: true,
      membershipId: '61000000-0000-4000-8000-000000000001',
      membershipStatus: 'active',
    })

    await expect(verifyInviteToken(token, { verify })).resolves.toEqual({
      ok: false,
      error: 'expired',
    })
    await expect(acceptInvite(token, { accept })).resolves.toMatchObject({ ok: true })
  })
})

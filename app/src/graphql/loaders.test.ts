import DataLoader from 'dataloader'
import { describe, expect, it, vi } from 'vitest'
import { batchMemberProfiles } from './loaders'

// A stand-in for a member profile — batchMemberProfiles is generic, so the test
// doesn't need a full MemberProfile fixture.
const profile = (userId: string) => ({ userId })

describe('batchMemberProfiles', () => {
  it('resolves the viewer membership once per batch, then fetches each key', async () => {
    const resolve = vi.fn().mockResolvedValue('m1')
    const getProfile = vi.fn(async (_membershipId: string, userId: string) => profile(userId))

    await batchMemberProfiles(['u1', 'u2', 'u3'], resolve, getProfile)

    expect(resolve).toHaveBeenCalledTimes(1)
    expect(getProfile).toHaveBeenCalledTimes(3)
    expect(getProfile).toHaveBeenCalledWith('m1', 'u2')
  })

  it('returns all null (and skips fetching) when the viewer has no membership', async () => {
    const getProfile = vi.fn()
    const out = await batchMemberProfiles(['u1', 'u2'], async () => null, getProfile)
    expect(out).toEqual([null, null])
    expect(getProfile).not.toHaveBeenCalled()
  })

  it('maps each userId to its profile, in order', async () => {
    const out = await batchMemberProfiles(
      ['u1', 'u2'],
      async () => 'm1',
      async (_m, userId) => profile(userId),
    )
    expect(out).toEqual([profile('u1'), profile('u2')])
  })
})

describe('memberProfileByUserId DataLoader semantics', () => {
  it('coalesces duplicate keys within a tick into a single fetch', async () => {
    const getProfile = vi.fn(async (_m: string, userId: string) => profile(userId))
    const loader = new DataLoader<string, { userId: string } | null>((ids) =>
      batchMemberProfiles(ids, async () => 'm1', getProfile),
    )

    const [a, b, c] = await Promise.all([loader.load('u1'), loader.load('u1'), loader.load('u2')])

    // u1 requested twice but fetched once; distinct keys u1, u2 → 2 fetches.
    expect(getProfile).toHaveBeenCalledTimes(2)
    expect(a).toBe(b)
    expect(c).toEqual(profile('u2'))
  })
})

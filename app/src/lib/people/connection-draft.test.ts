import { describe, expect, it, vi } from 'vitest'
import { fallbackConnectionDraft, shapeConnectionDraft } from './connection-draft'
import type { MemberProfile } from './contracts'

const membershipId = '20000000-0000-4000-8000-000000000001'
const recipientUserId = '10000000-0000-4000-8000-000000000002'

const profile: MemberProfile = {
  membershipId: '20000000-0000-4000-8000-000000000002',
  userId: recipientUserId,
  identity: {
    displayName: 'Maya Chen',
    preferredName: null,
    avatarPath: null,
    graduationYear: 2018,
  },
  current: {
    headline: null,
    employer: 'Northstar',
    title: 'Principal',
    industry: 'Climate',
    city: 'New York',
  },
  about: null,
  experiences: [],
  education: [],
  skills: [],
  links: [],
  help: { openToHelp: false, topics: [] },
  relationship: { state: 'none', requestId: null, conversationId: null },
  sharedContext: [{ kind: 'same_school', value: 'Chadwick School' }],
  updatedAt: '2026-07-15T00:00:00.000Z',
}

const input = {
  membershipId,
  recipientUserId,
  reason: 'their path is the move I am trying to make',
  signal: new AbortController().signal,
}

function dependencies() {
  return {
    repository: { getMemberProfile: vi.fn(async () => ({ ok: true as const, profile })) },
    provider: {
      shapeConnectionIntro: vi.fn(async () =>
        Promise.resolve('Hi Maya — your path stood out to me, and I would value connecting.'),
      ),
    },
    budget: { consume: vi.fn(async () => ({ status: 'allowed' as const })) },
  }
}

describe('People connection draft', () => {
  it('returns a bounded editable suggestion from visible profile context', async () => {
    const deps = dependencies()
    await expect(shapeConnectionDraft(input, deps)).resolves.toEqual({
      status: 'suggested',
      text: 'Hi Maya — your path stood out to me, and I would value connecting.',
    })
    expect(deps.provider.shapeConnectionIntro).toHaveBeenCalledWith(
      {
        recipientFirstName: 'Maya',
        reason: input.reason,
        visibleContext: ['Principal at Northstar', 'same_school: Chadwick School'],
      },
      input.signal,
    )
  })

  it('uses deterministic copy without spending budget when no provider is configured', async () => {
    const deps = dependencies()
    await expect(shapeConnectionDraft(input, { ...deps, provider: null })).resolves.toEqual({
      status: 'fallback',
      text: fallbackConnectionDraft('Maya', input.reason),
    })
    expect(deps.budget.consume).not.toHaveBeenCalled()
  })

  it('keeps first-person reasons grammatical and removes a duplicate because', () => {
    expect(fallbackConnectionDraft('Maya', 'I am exploring a similar move.')).toContain(
      'because I am exploring a similar move.',
    )
    expect(fallbackConnectionDraft('Maya', 'Because her path stood out.')).toContain(
      'because her path stood out.',
    )
  })

  it('preserves a manual path when the shared writing budget is limited', async () => {
    const deps = dependencies()
    const limited = {
      ...deps,
      budget: { consume: vi.fn(async () => ({ status: 'limited' as const })) },
    }
    await expect(shapeConnectionDraft(input, limited)).resolves.toEqual({
      status: 'limited',
      text: fallbackConnectionDraft('Maya', input.reason),
    })
    expect(deps.provider.shapeConnectionIntro).not.toHaveBeenCalled()
  })

  it('does not reveal unavailable profiles or accept unbounded input', async () => {
    const deps = dependencies()
    const unavailable = {
      ...deps,
      repository: {
        getMemberProfile: vi.fn(async () => ({
          ok: false as const,
          error: 'not_available' as const,
        })),
      },
    }
    await expect(shapeConnectionDraft(input, unavailable)).resolves.toEqual({
      status: 'not_available',
      text: null,
    })
    await expect(
      shapeConnectionDraft({ ...input, reason: 'x'.repeat(801) }, dependencies()),
    ).resolves.toEqual({ status: 'invalid_input', text: null })
  })
})

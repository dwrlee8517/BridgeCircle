import { describe, expect, it, vi } from 'vitest'
import type { HelpHome } from '@/lib/help/contracts'
import type { MessagesCounts } from '@/lib/messages/contracts'
import type { SchoolHome } from '@/lib/school/contracts'
import {
  buildSpotlight,
  composeHome,
  failedSource,
  homePulse,
  readySource,
  saveAskOutcomeShare,
} from './operations'

const help: HelpHome = {
  membershipId: '20000000-0000-4000-8000-000000000001',
  organizationId: '10000000-0000-4000-8000-000000000001',
  activeAskCount: 0,
  activeAskLimit: 5,
  openToHelp: true,
  pausedAt: null,
  pauseReason: null,
  helperTopics: [],
  recentAsks: [],
  directRequests: [],
  suggestedAsks: [],
}
const counts: MessagesCounts = {
  all: 0,
  unread: 0,
  myCircle: 0,
  openAsks: 0,
  waiting: 0,
  attention: 0,
}
const school: SchoolHome = {
  organization: { id: help.organizationId, name: 'Chadwick School' },
  events: [],
  announcements: [],
  latestNewsletter: null,
}

function input() {
  return {
    greetingName: 'Iris Lau',
    organizationName: 'Chadwick School',
    graduationYear: 2022,
    help: readySource(help),
    asks: readySource([]),
    waiting: readySource([]),
    messageCounts: readySource(counts),
    school: readySource(school),
    native: readySource({
      weeklyPulse: { newMembers: 0, refreshedProfiles: 0 },
      recognition: null,
      outcomeStory: null,
    }),
  }
}

describe('Home composition', () => {
  it('detects a true relationship cold start without treating School content as activity', () => {
    expect(composeHome(input()).coldStart).toBe(true)
  })

  it('keeps successful domains intact when Home-native data fails', () => {
    const dashboard = composeHome({ ...input(), native: failedSource() })
    expect(dashboard.native.status).toBe('failed')
    expect(dashboard.school).toEqual(readySource(school))
    expect(dashboard.pulse).toBe('Your circle is here when you need it.')
    expect(dashboard.spotlight).toEqual([])
  })

  it('keeps deck priority bounded and removes helper matches while paused', () => {
    const proposed = {
      ...help,
      suggestedAsks: [
        {
          askId: '40000000-0000-4000-8000-000000000001',
          question: 'Could someone review my portfolio?',
          anonymousUntilAccepted: false,
          asker: {
            identity: 'identified' as const,
            userId: '30000000-0000-4000-8000-000000000001',
            displayName: 'Maya Chen',
            headline: null,
            avatarPath: null,
            graduationYear: 2018,
          },
          matchReason: 'You have made a similar transition.',
          createdAt: '2026-07-15T10:00:00Z',
          expiresAt: '2026-07-29T10:00:00Z',
        },
      ],
    }
    expect(buildSpotlight({ ...input(), help: readySource(proposed) })[0]?.kind).toBe(
      'you_could_help',
    )
    expect(
      buildSpotlight({ ...input(), help: readySource({ ...proposed, openToHelp: false }) }).some(
        (item) => item.kind === 'you_could_help',
      ),
    ).toBe(false)
  })

  it('writes factual zero, singular, and plural pulse copy', () => {
    expect(
      homePulse({
        weeklyPulse: { newMembers: 0, refreshedProfiles: 0 },
        recognition: null,
        outcomeStory: null,
      }),
    ).toContain('All quiet')
    expect(
      homePulse({
        weeklyPulse: { newMembers: 1, refreshedProfiles: 1 },
        recognition: null,
        outcomeStory: null,
      }),
    ).toBe('Quiet week. 1 new member joined and 1 member refreshed their profile.')
    expect(
      homePulse({
        weeklyPulse: { newMembers: 3, refreshedProfiles: 2 },
        recognition: null,
        outcomeStory: null,
      }),
    ).toBe('Quiet week. 3 new members joined and 2 members refreshed their profiles.')
  })

  it('rejects identity sharing without story sharing before calling the repository', async () => {
    const repository = { saveAskOutcomeShare: vi.fn() }
    const result = await saveAskOutcomeShare(
      {
        askId: '40000000-0000-4000-8000-000000000001',
        shareStory: false,
        shareIdentity: true,
      },
      repository,
    )
    expect(result.status).toBe('invalid_input')
    expect(repository.saveAskOutcomeShare).not.toHaveBeenCalled()
  })
})

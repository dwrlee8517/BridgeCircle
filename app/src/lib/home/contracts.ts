import type { HelpAskSummary, HelpHome } from '@/lib/help/contracts'
import type { MessagesCounts, MessagesWaitingItem } from '@/lib/messages/contracts'
import type { SchoolHome } from '@/lib/school/contracts'

export type HomeRecognition = {
  membershipId: string
  userId: string
  displayName: string
  preferredName: string | null
  avatarPath: string | null
  graduationYear: number | null
  title: string
  employer: string
  startedAt: string
}

export type HomeOutcomeStory = {
  askId: string
  outcomeNote: string
  sharedAt: string
  identityMode: 'anonymous' | 'identified'
  askerName: string | null
  helperName: string | null
}

export type HomeNative = {
  weeklyPulse: {
    newMembers: number
    refreshedProfiles: number
  }
  recognition: HomeRecognition | null
  outcomeStory: HomeOutcomeStory | null
}

export type SaveAskOutcomeShareResult =
  | {
      status: 'saved'
      askId: string
      shareStory: boolean
      shareIdentity: boolean
    }
  | {
      status: 'invalid_input' | 'not_available'
      askId: string | null
      shareStory: false
      shareIdentity: false
    }

export type HomeRepository = {
  getNative(membershipId: string): Promise<HomeNative | null>
  saveAskOutcomeShare(input: {
    askId: string
    shareStory: boolean
    shareIdentity: boolean
  }): Promise<SaveAskOutcomeShareResult>
}

export type HomeSpotlight = {
  kind: 'you_could_help' | 'people_are_asking' | 'event' | 'recognition' | 'school_news' | 'outcome'
  label: string
  tone: 'green' | 'blue' | 'neutral'
  meta: string
  title: string
  body: string | null
  href: string | null
  actionLabel: string | null
  moreHref: string | null
  moreLabel: string | null
}

export type HomeSource<T> =
  | { status: 'ready'; data: T }
  | { status: 'unavailable'; data: null }
  | { status: 'failed'; data: null }

export type HomeDashboard = {
  greetingName: string | null
  organizationName: string
  graduationYear: number | null
  pulse: string
  coldStart: boolean
  paused: boolean
  spotlight: HomeSpotlight[]
  help: HomeSource<HelpHome>
  asks: HomeSource<HelpAskSummary[]>
  waiting: HomeSource<MessagesWaitingItem[]>
  messageCounts: HomeSource<MessagesCounts>
  school: HomeSource<SchoolHome>
  native: HomeSource<HomeNative>
}

export type ComposeHomeInput = {
  greetingName: string | null
  organizationName: string
  graduationYear: number | null
  help: HomeSource<HelpHome>
  asks: HomeSource<HelpAskSummary[]>
  waiting: HomeSource<MessagesWaitingItem[]>
  messageCounts: HomeSource<MessagesCounts>
  school: HomeSource<SchoolHome>
  native: HomeSource<HomeNative>
}

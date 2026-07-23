import type {
  ComposeHomeInput,
  HomeDashboard,
  HomeNative,
  HomeRepository,
  HomeSource,
  HomeSpotlight,
  SaveAskOutcomeShareResult,
} from './contracts'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function readySource<T>(data: T): HomeSource<T> {
  return { status: 'ready', data }
}

export function failedSource<T>(): HomeSource<T> {
  return { status: 'failed', data: null }
}

export function unavailableSource<T>(): HomeSource<T> {
  return { status: 'unavailable', data: null }
}

export function homePulse(native: HomeNative | null): string {
  if (!native) return 'Your circle is here when you need it.'
  const { newMembers, refreshedProfiles } = native.weeklyPulse
  if (newMembers === 0 && refreshedProfiles === 0) {
    return 'All quiet. No new circle updates this week.'
  }

  const parts: string[] = []
  if (newMembers > 0) {
    parts.push(`${newMembers} new ${newMembers === 1 ? 'member joined' : 'members joined'}`)
  }
  if (refreshedProfiles > 0) {
    parts.push(
      `${refreshedProfiles} ${refreshedProfiles === 1 ? 'member refreshed their profile' : 'members refreshed their profiles'}`,
    )
  }
  return `Quiet week. ${sentenceJoin(parts)}.`
}

export function composeHome(input: ComposeHomeInput): HomeDashboard {
  const help = input.help.status === 'ready' ? input.help.data : null
  const waiting = input.waiting.status === 'ready' ? input.waiting.data : null
  const counts = input.messageCounts.status === 'ready' ? input.messageCounts.data : null
  const asks = input.asks.status === 'ready' ? input.asks.data : null
  const native = input.native.status === 'ready' ? input.native.data : null
  const paused = Boolean(help && !help.openToHelp)
  const coldStart = Boolean(
    help &&
      asks &&
      waiting &&
      counts &&
      help.activeAskCount === 0 &&
      waiting.length === 0 &&
      counts.all === 0,
  )

  return {
    ...input,
    pulse: homePulse(native),
    coldStart,
    paused,
    spotlight: buildSpotlight(input),
  }
}

export function buildSpotlight(input: ComposeHomeInput): HomeSpotlight[] {
  const help = input.help.status === 'ready' ? input.help.data : null
  const school = input.school.status === 'ready' ? input.school.data : null
  const native = input.native.status === 'ready' ? input.native.data : null
  const items: HomeSpotlight[] = []

  if (help?.openToHelp) {
    const suggested = help.suggestedAsks.find((ask) => ask.asker.identity === 'identified')
    if (suggested) {
      items.push({
        kind: 'you_could_help',
        label: 'You could help',
        tone: 'green',
        meta: profileMeta(suggested.asker.displayName, suggested.asker.graduationYear),
        title: suggested.question,
        body: suggested.matchReason,
        href: `/help/asks/${suggested.askId}/offer`,
        actionLabel: 'Offer to help',
        moreHref: '/help?mode=give',
        moreLabel: 'More you could help with',
      })
    }
  }

  const circleAsk = help?.suggestedAsks.find((ask) => ask.asker.identity === 'anonymous')
  if (circleAsk) {
    items.push({
      kind: 'people_are_asking',
      label: 'People are asking',
      tone: 'blue',
      meta: circleAsk.asker.graduationYear
        ? `A member · Class of ’${String(circleAsk.asker.graduationYear).slice(-2)}`
        : 'A member of your circle',
      title: circleAsk.question,
      body: 'Asked to the circle, with their name held back until help is accepted.',
      href: '/help',
      actionLabel: 'Ask yours',
      moreHref: '/help?mode=give',
      moreLabel: 'Help',
    })
  }

  const event = school?.events[0]
  if (event) {
    items.push({
      kind: 'event',
      label: 'Event',
      tone: 'neutral',
      meta: [formatShortDate(event.startsAt, event.timeZone), event.locationName ?? 'Online'].join(
        ' · ',
      ),
      title: event.title,
      body: event.summary,
      href: `/school/events/${event.id}`,
      actionLabel: 'See the event',
      moreHref: '/school',
      moreLabel: 'All events',
    })
  }

  if (native?.recognition) {
    const recognition = native.recognition
    items.push({
      kind: 'recognition',
      label: 'Recognition',
      tone: 'neutral',
      meta: profileMeta(recognition.displayName, recognition.graduationYear),
      title: `${recognition.preferredName ?? recognition.displayName} just started at ${recognition.employer}.`,
      body: `A quiet congratulations goes a long way — they’d hear it from you first.`,
      href: `/profile/${recognition.userId}`,
      actionLabel: 'Say congrats',
      moreHref: '/people',
      moreLabel: 'People',
    })
  }

  const announcement = school?.announcements.find((item) => item.pinned)
  if (announcement) {
    items.push({
      kind: 'school_news',
      label: 'School news',
      tone: 'neutral',
      meta: `${titleCase(announcement.tag)} · ${formatRelativeDate(announcement.publishedAt)}`,
      title: announcement.title,
      body: announcement.summary,
      href: `/school/announcements/${announcement.id}`,
      actionLabel: 'Read it',
      moreHref: '/school/announcements',
      moreLabel: 'All announcements',
    })
  }

  if (native?.outcomeStory) {
    const story = native.outcomeStory
    const identified = story.identityMode === 'identified' && story.askerName && story.helperName
    items.push({
      kind: 'outcome',
      label: 'It worked',
      tone: 'neutral',
      meta: identified
        ? `${story.askerName} and ${story.helperName} shared this`
        : 'Shared with both members’ okay',
      title: 'A little help carried forward.',
      body: story.outcomeNote,
      href: null,
      actionLabel: null,
      moreHref: null,
      moreLabel: null,
    })
  }

  return items.slice(0, 6)
}

export async function saveAskOutcomeShare(
  input: { askId: string; shareStory: boolean; shareIdentity: boolean },
  repository: Pick<HomeRepository, 'saveAskOutcomeShare'>,
): Promise<SaveAskOutcomeShareResult> {
  if (!UUID_PATTERN.test(input.askId) || (input.shareIdentity && !input.shareStory)) {
    return {
      status: 'invalid_input',
      askId: input.askId && UUID_PATTERN.test(input.askId) ? input.askId : null,
      shareStory: false,
      shareIdentity: false,
    }
  }
  return repository.saveAskOutcomeShare(input)
}

function sentenceJoin(parts: string[]) {
  if (parts.length <= 1) return parts[0] ?? ''
  return `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`
}

function profileMeta(name: string, year: number | null) {
  return year ? `${name} · Class of ’${String(year).slice(-2)}` : name
}

function formatShortDate(value: string, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatRelativeDate(value: string) {
  const days = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 86_400_000))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(value),
  )
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

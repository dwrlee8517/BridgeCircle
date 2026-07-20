import type { MemberProfile, PeopleRepository } from './contracts'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type PeopleConnectionDraftProvider = {
  shapeConnectionIntro(
    input: {
      recipientFirstName: string
      reason: string
      visibleContext: readonly string[]
    },
    signal: AbortSignal,
  ): Promise<string>
}

export type ConnectionDraftBudget = {
  consume(): Promise<{ status: 'allowed' | 'limited' | 'not_available' }>
}

export type ConnectionDraftResult =
  | { status: 'suggested' | 'fallback' | 'limited'; text: string }
  | { status: 'invalid_input' | 'not_available'; text: null }

export async function shapeConnectionDraft(
  input: {
    membershipId: string
    recipientUserId: string
    reason: string
    signal: AbortSignal
  },
  dependencies: {
    repository: Pick<PeopleRepository, 'getMemberProfile'>
    provider: PeopleConnectionDraftProvider | null
    budget: ConnectionDraftBudget
  },
): Promise<ConnectionDraftResult> {
  const reason = normalize(input.reason)
  if (
    !UUID_PATTERN.test(input.membershipId) ||
    !UUID_PATTERN.test(input.recipientUserId) ||
    !reason ||
    reason.length > 800
  ) {
    return { status: 'invalid_input', text: null }
  }

  const profileResult = await dependencies.repository.getMemberProfile(
    input.membershipId,
    input.recipientUserId,
  )
  if (!profileResult.ok) return { status: 'not_available', text: null }

  const profile = profileResult.profile
  const recipientFirstName = firstName(
    profile.identity.preferredName || profile.identity.displayName,
  )
  const fallback = fallbackConnectionDraft(recipientFirstName, reason)
  if (!dependencies.provider) return { status: 'fallback', text: fallback }

  const budget = await dependencies.budget.consume()
  if (budget.status !== 'allowed') return { status: 'limited', text: fallback }

  try {
    const suggestion = normalize(
      await dependencies.provider.shapeConnectionIntro(
        {
          recipientFirstName,
          reason,
          visibleContext: visibleProfileContext(profile),
        },
        input.signal,
      ),
    )
    return suggestion && suggestion.length <= 2_000
      ? { status: 'suggested', text: suggestion }
      : { status: 'fallback', text: fallback }
  } catch {
    return { status: 'fallback', text: fallback }
  }
}

export function fallbackConnectionDraft(recipientFirstName: string, reason: string): string {
  const cleanReason = normalize(reason)
    .replace(/^because\s+/i, '')
    .replace(/[.!?]+$/, '')
  return `Hi ${recipientFirstName} — I’m reaching out because ${lowercaseFirst(cleanReason)}. I’d be glad to connect if you’re open to it.`
}

function visibleProfileContext(profile: MemberProfile): string[] {
  const role = [profile.current.title, profile.current.employer].filter(Boolean).join(' at ')
  return [role, ...profile.sharedContext.map((context) => `${context.kind}: ${context.value}`)]
    .map(normalize)
    .filter(Boolean)
    .slice(0, 6)
}

function firstName(name: string): string {
  return name.split(/\s+/).filter(Boolean)[0] || 'there'
}

function lowercaseFirst(value: string): string {
  if (!value) return value
  if (/^I(?:\s|['’]|$)/.test(value)) return value
  return `${value[0]?.toLowerCase()}${value.slice(1)}`
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

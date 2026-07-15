export const HELP_DRAFT_TTL_MS = 24 * 60 * 60 * 1_000

const MAX_QUESTION_LENGTH = 2_000
const STORAGE_VERSION = 1

export type HelpDraftCandidate = {
  membershipId: string
  userId: string
  displayName: string
  headline: string | null
  avatarUrl: string | null
  graduationYear: number | null
  matchReason: string
}

export type HelpDraft = {
  question: string
  candidate: HelpDraftCandidate | null
  expiresAt: number
}

function draftKey(membershipId: string) {
  return `bridgecircle:help-question:v1:${membershipId}`
}

export function readHelpDraft(
  storage: Pick<Storage, 'getItem' | 'removeItem'>,
  membershipId: string,
  now = Date.now(),
): HelpDraft | null {
  try {
    const raw = storage.getItem(draftKey(membershipId))
    if (!raw) return null
    const parsed = parseHelpDraft(raw, now)
    if (!parsed) storage.removeItem(draftKey(membershipId))
    return parsed
  } catch {
    return null
  }
}

export function writeHelpQuestionDraft(
  storage: Pick<Storage, 'setItem' | 'removeItem'>,
  membershipId: string,
  question: string,
  now = Date.now(),
) {
  try {
    if (!question.trim()) {
      storage.removeItem(draftKey(membershipId))
      return
    }
    storage.setItem(
      draftKey(membershipId),
      JSON.stringify({
        version: STORAGE_VERSION,
        question: question.slice(0, MAX_QUESTION_LENGTH),
        candidate: null,
        expiresAt: now + HELP_DRAFT_TTL_MS,
      }),
    )
  } catch {
    // Draft persistence is a convenience. The in-memory form remains usable
    // when session storage is unavailable or full.
  }
}

export function writeHelpCandidateDraft(
  storage: Pick<Storage, 'setItem'>,
  membershipId: string,
  question: string,
  candidate: HelpDraftCandidate,
  now = Date.now(),
) {
  try {
    storage.setItem(
      draftKey(membershipId),
      JSON.stringify({
        version: STORAGE_VERSION,
        question: question.slice(0, MAX_QUESTION_LENGTH),
        candidate,
        expiresAt: now + HELP_DRAFT_TTL_MS,
      }),
    )
  } catch {
    // The composer will show a recovery state if this convenience write fails.
  }
}

export function clearHelpDraft(storage: Pick<Storage, 'removeItem'>, membershipId: string) {
  try {
    storage.removeItem(draftKey(membershipId))
  } catch {
    // The durable Ask is already committed; stale session state is harmless.
  }
}

export function parseHelpDraft(raw: string, now = Date.now()): HelpDraft | null {
  try {
    const parsed = JSON.parse(raw) as {
      version?: unknown
      question?: unknown
      candidate?: unknown
      expiresAt?: unknown
    }
    if (
      (parsed.version !== undefined && parsed.version !== STORAGE_VERSION) ||
      typeof parsed.question !== 'string' ||
      !parsed.question.trim() ||
      parsed.question.length > MAX_QUESTION_LENGTH ||
      typeof parsed.expiresAt !== 'number' ||
      parsed.expiresAt <= now
    ) {
      return null
    }
    return {
      question: parsed.question,
      candidate: parseCandidate(parsed.candidate),
      expiresAt: parsed.expiresAt,
    }
  } catch {
    return null
  }
}

function parseCandidate(value: unknown): HelpDraftCandidate | null {
  if (value === undefined || value === null) return null
  if (!value || typeof value !== 'object') return null
  const candidate = value as Record<string, unknown>
  if (
    typeof candidate.membershipId !== 'string' ||
    typeof candidate.userId !== 'string' ||
    typeof candidate.displayName !== 'string' ||
    (candidate.headline !== null && typeof candidate.headline !== 'string') ||
    (candidate.avatarUrl !== null && typeof candidate.avatarUrl !== 'string') ||
    (candidate.graduationYear !== null && typeof candidate.graduationYear !== 'number') ||
    typeof candidate.matchReason !== 'string'
  ) {
    return null
  }
  return {
    membershipId: candidate.membershipId,
    userId: candidate.userId,
    displayName: candidate.displayName,
    headline: candidate.headline,
    avatarUrl: candidate.avatarUrl,
    graduationYear: candidate.graduationYear,
    matchReason: candidate.matchReason,
  }
}

import type { ConversationMessage } from '@/lib/conversations/contracts'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type PendingSendAttempt = {
  body: string
  nonce: string
  status: 'sending' | 'uncertain'
}

export type ThreadComposerState = {
  draft: string
  pending: PendingSendAttempt | null
}

export const EMPTY_THREAD_COMPOSER: ThreadComposerState = { draft: '', pending: null }

export function restoreThreadComposer(raw: string | null): ThreadComposerState {
  if (!raw) return EMPTY_THREAD_COMPOSER
  try {
    const value = JSON.parse(raw) as Record<string, unknown>
    if (value.version !== 1 || typeof value.draft !== 'string' || value.draft.length > 10_000) {
      return EMPTY_THREAD_COMPOSER
    }
    if (value.pendingBody === null && value.pendingNonce === null) {
      return { draft: value.draft, pending: null }
    }
    if (
      typeof value.pendingBody !== 'string' ||
      value.pendingBody.length < 1 ||
      value.pendingBody.length > 10_000 ||
      typeof value.pendingNonce !== 'string' ||
      !UUID_PATTERN.test(value.pendingNonce)
    ) {
      return EMPTY_THREAD_COMPOSER
    }
    return {
      draft: value.pendingBody,
      pending: { body: value.pendingBody, nonce: value.pendingNonce, status: 'uncertain' },
    }
  } catch {
    return EMPTY_THREAD_COMPOSER
  }
}

export function serializeThreadComposer(state: ThreadComposerState): string | null {
  if (!state.draft && !state.pending) return null
  return JSON.stringify({
    version: 1,
    draft: state.draft.slice(0, 10_000),
    pendingBody: state.pending?.body ?? null,
    pendingNonce: state.pending?.nonce ?? null,
  })
}

export function beginSendAttempt(
  state: ThreadComposerState,
  createNonce: () => string,
): { state: ThreadComposerState; attempt: PendingSendAttempt } | null {
  if (state.pending) {
    const attempt = { ...state.pending, status: 'sending' as const }
    return { state: { draft: attempt.body, pending: attempt }, attempt }
  }
  const body = state.draft.trim()
  if (!body || body.length > 10_000) return null
  const nonce = createNonce()
  if (!UUID_PATTERN.test(nonce)) return null
  const attempt = { body, nonce, status: 'sending' as const }
  return { state: { draft: body, pending: attempt }, attempt }
}

export function markSendUncertain(state: ThreadComposerState): ThreadComposerState {
  if (!state.pending) return state
  return { draft: state.pending.body, pending: { ...state.pending, status: 'uncertain' } }
}

export function rejectSendAttempt(state: ThreadComposerState): ThreadComposerState {
  return { draft: state.pending?.body ?? state.draft, pending: null }
}

export function discardSendAttempt(state: ThreadComposerState): ThreadComposerState {
  return { draft: state.pending?.body ?? state.draft, pending: null }
}

export function confirmSendAttempt(): ThreadComposerState {
  return EMPTY_THREAD_COMPOSER
}

export function conversationReconnectDelayMs(attempt: number): number {
  const delays = [1_000, 2_000, 5_000, 10_000, 30_000] as const
  const index = Math.max(0, Math.min(Math.trunc(attempt), delays.length - 1))
  return delays[index]
}

export function newestOutgoingReceiptId(
  messages: ConversationMessage[],
  viewerUserId: string,
): number | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message?.kind === 'user' && message.senderUserId === viewerUserId) return message.id
  }
  return null
}

export function readCandidate(input: {
  messages: ConversationMessage[]
  viewerUserId: string
  currentReadMessageId: number | null
  documentVisible: boolean
  endVisible: boolean
}): number | null {
  if (!input.documentVisible || !input.endVisible) return null
  const latest = input.messages.at(-1)
  if (!latest || latest.kind !== 'user' || latest.senderUserId === input.viewerUserId) return null
  if (latest.id <= (input.currentReadMessageId ?? 0)) return null
  return latest.id
}

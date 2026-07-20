import { describe, expect, it } from 'vitest'
import {
  HELP_DRAFT_TTL_MS,
  parseHelpDraft,
  readHelpDraft,
  writeHelpCandidateDraft,
  writeHelpQuestionDraft,
} from './help-draft-storage'

function storage() {
  const values = new Map<string, string>()
  return {
    getItem(key: string) {
      return values.get(key) ?? null
    },
    setItem(key: string, value: string) {
      values.set(key, value)
    },
    removeItem(key: string) {
      values.delete(key)
    },
  }
}

const candidate = {
  membershipId: '20000000-0000-4000-8000-000000000002',
  userId: '10000000-0000-4000-8000-000000000002',
  displayName: 'Maya Chen',
  headline: 'Product designer',
  avatarUrl: null,
  graduationYear: 2018,
  matchReason: 'Made the same career move.',
}

describe('Help draft storage', () => {
  it('reads the existing question-only v1 shape without losing the draft', () => {
    expect(
      parseHelpDraft(
        JSON.stringify({ question: 'How did you make the move?', expiresAt: 2_000 }),
        1_000,
      ),
    ).toEqual({
      question: 'How did you make the move?',
      candidate: null,
      expiresAt: 2_000,
    })
  })

  it('keeps the selected candidate scoped to the viewer membership', () => {
    const session = storage()
    writeHelpCandidateDraft(session, 'viewer-a', 'How did you make the move?', candidate, 1_000)

    expect(readHelpDraft(session, 'viewer-a', 1_001)).toEqual({
      question: 'How did you make the move?',
      candidate,
      expiresAt: 1_000 + HELP_DRAFT_TTL_MS,
    })
    expect(readHelpDraft(session, 'viewer-b', 1_001)).toBeNull()
  })

  it('clears a stale candidate whenever the question changes', () => {
    const session = storage()
    writeHelpCandidateDraft(session, 'viewer', 'First question', candidate, 1_000)
    writeHelpQuestionDraft(session, 'viewer', 'Revised question', 1_500)

    expect(readHelpDraft(session, 'viewer', 1_501)?.candidate).toBeNull()
    expect(readHelpDraft(session, 'viewer', 1_501)?.question).toBe('Revised question')
  })

  it('removes expired or malformed drafts', () => {
    const session = storage()
    writeHelpQuestionDraft(session, 'viewer', 'Question', 1_000)

    expect(readHelpDraft(session, 'viewer', 1_000 + HELP_DRAFT_TTL_MS + 1)).toBeNull()
    expect(readHelpDraft(session, 'viewer', 1_001)).toBeNull()
    expect(parseHelpDraft('{broken', 1_000)).toBeNull()
  })
})

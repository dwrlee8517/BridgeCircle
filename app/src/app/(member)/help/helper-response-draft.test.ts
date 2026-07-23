import { describe, expect, it } from 'vitest'
import {
  buildDirectOpeningDraft,
  buildOfferDraft,
  reviseHelperReplyFallback,
} from './helper-response-draft'

describe('helper response drafts', () => {
  it('builds editable copy only from visible Ask facts', () => {
    expect(buildDirectOpeningDraft('Lena Petrova', 'Could you review my portfolio?')).toBe(
      'Hi Lena — glad you reached out. I’m happy to share what I know and talk through “Could you review my portfolio”.',
    )
    expect(buildOfferDraft(null, 'How should I approach this?')).toContain('Hi — I may be able')
  })

  it('keeps deterministic fallback edits reversible', () => {
    const original = 'Hi Lena — glad you reached out. I can help with this.'
    expect(reviseHelperReplyFallback(`${original} Let’s find a time.`, 'Shorter', original)).toBe(
      'Hi Lena — glad you reached out.',
    )
    expect(reviseHelperReplyFallback('Changed', 'Start over', original)).toBe(original)
  })
})

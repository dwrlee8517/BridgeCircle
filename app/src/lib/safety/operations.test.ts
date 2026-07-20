import { describe, expect, it, vi } from 'vitest'
import { blockMember, reportMessage, reportProfile } from './operations'

describe('Safety operations', () => {
  it('normalizes a valid report note', async () => {
    const report = vi.fn(async () => ({ status: 'submitted' as const, reportId: 'report-id' }))
    await reportMessage(
      { messageId: 42, reason: 'spam', note: '  Context  ' },
      { reportMessage: report },
    )
    expect(report).toHaveBeenCalledWith({ messageId: 42, reason: 'spam', note: 'Context' })
  })

  it('rejects invalid report and block inputs without I/O', async () => {
    const report = vi.fn()
    const block = vi.fn()
    await expect(
      reportMessage({ messageId: 0, reason: 'spam', note: null }, { reportMessage: report }),
    ).resolves.toEqual({ status: 'invalid_input' })
    await expect(blockMember('bad', { blockMember: block })).resolves.toEqual({
      status: 'not_available',
    })
    await expect(
      reportProfile({ userId: 'bad', reason: 'spam', note: null }, { reportProfile: report }),
    ).resolves.toEqual({ status: 'invalid_input' })
    expect(report).not.toHaveBeenCalled()
    expect(block).not.toHaveBeenCalled()
  })
})

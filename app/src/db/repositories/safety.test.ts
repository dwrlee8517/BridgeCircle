import { describe, expect, it, vi } from 'vitest'
import { createSafetyRepository, parseBlockMemberRow } from './safety'

describe('Safety repository result rows', () => {
  it('parses the stable block result and fails on drift', () => {
    expect(parseBlockMemberRow({ result_code: 'blocked' })).toEqual({ status: 'blocked' })
    expect(() => parseBlockMemberRow({ result_code: 'blocked', user_id: 'hidden' })).toThrow()
    expect(() => parseBlockMemberRow({ result_code: 'failed' })).toThrow()
  })

  it('submits only immutable message evidence identifiers and maps denied access', async () => {
    const reportRpc = vi.fn(async () => ({ data: null, error: { code: '42501' } }))
    const result = await createSafetyRepository({
      schema: vi.fn(() => ({ rpc: reportRpc })),
    } as never).reportMessage({ messageId: 42, reason: 'spam', note: null })
    expect(reportRpc).toHaveBeenCalledWith('submit_report', {
      p_target_type: 'message',
      p_target_id: '42',
      p_reason: 'spam',
    })
    expect(result).toEqual({ status: 'not_available' })
  })

  it('submits a profile report through the fixed report command', async () => {
    const reportRpc = vi.fn(async () => ({
      data: '00000000-0000-4000-8000-000000000009',
      error: null,
    }))
    const result = await createSafetyRepository({
      schema: vi.fn(() => ({ rpc: reportRpc })),
    } as never).reportProfile({
      userId: '00000000-0000-4000-8000-000000000002',
      reason: 'impersonation',
      note: 'This profile appears misleading.',
    })
    expect(reportRpc).toHaveBeenCalledWith('submit_report', {
      p_target_type: 'profile',
      p_target_id: '00000000-0000-4000-8000-000000000002',
      p_reason: 'impersonation',
      p_note: 'This profile appears misleading.',
    })
    expect(result).toEqual({
      status: 'submitted',
      reportId: '00000000-0000-4000-8000-000000000009',
    })
  })
})

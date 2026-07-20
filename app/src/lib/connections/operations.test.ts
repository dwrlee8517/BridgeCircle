import { describe, expect, it, vi } from 'vitest'
import { disconnectMember, respondToConnectionRequest, sendConnectionRequest } from './operations'

const userId = '10000000-0000-4000-8000-000000000002'
const organizationId = '20000000-0000-4000-8000-000000000001'
const requestId = '30000000-0000-4000-8000-000000000001'

describe('Connection operations', () => {
  it('normalizes an optional intro exactly once', async () => {
    const sendRequest = vi.fn(async () => ({ status: 'created' as const, requestId }))
    await expect(
      sendConnectionRequest(
        {
          recipientUserId: userId,
          originOrganizationId: organizationId,
          introMessage: '  I enjoyed our Ask conversation.  ',
          clientRequestId: requestId,
        },
        { sendRequest },
      ),
    ).resolves.toEqual({ status: 'created', requestId })
    expect(sendRequest).toHaveBeenCalledWith({
      recipientUserId: userId,
      originOrganizationId: organizationId,
      introMessage: 'I enjoyed our Ask conversation.',
      clientRequestId: requestId,
    })
  })

  it('fails invalid mutations locally without repository I/O', async () => {
    const sendRequest = vi.fn()
    const respondToRequest = vi.fn()
    const disconnect = vi.fn()
    await expect(
      sendConnectionRequest(
        {
          recipientUserId: 'bad',
          originOrganizationId: organizationId,
          introMessage: null,
          clientRequestId: requestId,
        },
        { sendRequest },
      ),
    ).resolves.toEqual({ status: 'invalid_input' })
    await expect(
      respondToConnectionRequest({ requestId: 'bad', decision: 'accept' }, { respondToRequest }),
    ).resolves.toEqual({ status: 'invalid_input' })
    await expect(disconnectMember('bad', { disconnect })).resolves.toEqual({
      status: 'not_available',
    })
    expect(sendRequest).not.toHaveBeenCalled()
    expect(respondToRequest).not.toHaveBeenCalled()
    expect(disconnect).not.toHaveBeenCalled()
  })
})

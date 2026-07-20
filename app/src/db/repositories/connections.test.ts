import { describe, expect, it, vi } from 'vitest'
import {
  createConnectionsRepository,
  parseDisconnectRow,
  parseRespondToConnectionRequestRow,
  parseSendConnectionRequestRow,
} from './connections'

const requestId = '30000000-0000-4000-8000-000000000001'
const connectionId = '40000000-0000-4000-8000-000000000001'
const conversationId = '50000000-0000-4000-8000-000000000001'

describe('Connection repository result rows', () => {
  it('preserves stable send outcomes and required IDs', () => {
    expect(
      parseSendConnectionRequestRow({ result_code: 'created', request_id: requestId }),
    ).toEqual({ status: 'created', requestId })
    expect(
      parseSendConnectionRequestRow({ result_code: 'already_connected', request_id: null }),
    ).toEqual({ status: 'already_connected' })
    expect(() =>
      parseSendConnectionRequestRow({ result_code: 'created', request_id: null }),
    ).toThrow('without request ID')
  })

  it('requires both acceptance IDs and permits a terminal declined retry', () => {
    expect(
      parseRespondToConnectionRequestRow({
        result_code: 'accepted',
        connection_id: connectionId,
        conversation_id: conversationId,
      }),
    ).toEqual({ status: 'accepted', connectionId, conversationId })
    expect(
      parseRespondToConnectionRequestRow({
        result_code: 'already_decided',
        connection_id: null,
        conversation_id: null,
      }),
    ).toEqual({ status: 'already_decided', connectionId: null, conversationId: null })
    expect(() =>
      parseRespondToConnectionRequestRow({
        result_code: 'accepted',
        connection_id: connectionId,
        conversation_id: null,
      }),
    ).toThrow('without durable IDs')
  })

  it('parses only fixed disconnect statuses', () => {
    expect(parseDisconnectRow({ result_code: 'unchanged' })).toEqual({ status: 'unchanged' })
    expect(() => parseDisconnectRow({ result_code: 'maybe' })).toThrow()
  })

  it('calls each fixed command with its exact public arguments', async () => {
    const sendSingle = vi.fn(async () => ({
      data: { result_code: 'created', request_id: requestId },
      error: null,
    }))
    const sendRpc = vi.fn(() => ({ single: sendSingle }))
    await createConnectionsRepository({
      schema: vi.fn(() => ({ rpc: sendRpc })),
    } as never).sendRequest({
      recipientUserId: '10000000-0000-4000-8000-000000000002',
      originOrganizationId: '20000000-0000-4000-8000-000000000001',
      introMessage: 'Hello',
      clientRequestId: requestId,
    })
    expect(sendRpc).toHaveBeenCalledWith('send_connection_request', {
      p_recipient_user_id: '10000000-0000-4000-8000-000000000002',
      p_origin_organization_id: '20000000-0000-4000-8000-000000000001',
      p_intro_message: 'Hello',
      p_client_request_id: requestId,
    })

    const responseSingle = vi.fn(async () => ({
      data: {
        result_code: 'accepted',
        connection_id: connectionId,
        conversation_id: conversationId,
      },
      error: null,
    }))
    const responseRpc = vi.fn(() => ({ single: responseSingle }))
    await createConnectionsRepository({
      schema: vi.fn(() => ({ rpc: responseRpc })),
    } as never).respondToRequest({ requestId, decision: 'accept' })
    expect(responseRpc).toHaveBeenCalledWith('respond_to_connection_request', {
      p_request_id: requestId,
      p_decision: 'accept',
    })

    const disconnectSingle = vi.fn(async () => ({
      data: { result_code: 'disconnected' },
      error: null,
    }))
    const disconnectRpc = vi.fn(() => ({ single: disconnectSingle }))
    await createConnectionsRepository({
      schema: vi.fn(() => ({ rpc: disconnectRpc })),
    } as never).disconnect('10000000-0000-4000-8000-000000000002')
    expect(disconnectRpc).toHaveBeenCalledWith('disconnect', {
      p_other_user_id: '10000000-0000-4000-8000-000000000002',
    })
  })
})

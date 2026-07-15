import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/db/database.types'
import type {
  ConnectionsRepository,
  DisconnectResult,
  RespondToConnectionRequestResult,
  SendConnectionRequestResult,
} from '@/lib/connections/contracts'

const sendRowSchema = z
  .object({
    result_code: z.enum([
      'created',
      'existing',
      'incoming_pending',
      'already_connected',
      'not_available',
      'invalid_input',
      'idempotency_conflict',
    ]),
    request_id: z.uuid().nullable(),
  })
  .strict()

const respondRowSchema = z
  .object({
    result_code: z.enum([
      'accepted',
      'declined',
      'already_decided',
      'not_available',
      'invalid_input',
    ]),
    connection_id: z.uuid().nullable(),
    conversation_id: z.uuid().nullable(),
  })
  .strict()

const disconnectRowSchema = z
  .object({ result_code: z.enum(['disconnected', 'unchanged', 'not_available']) })
  .strict()

function contractError(operation: string, detail: string): never {
  throw new Error(`Connection ${operation} contract violated: ${detail}`)
}

function transportError(operation: string, error: { code?: string } | null): never {
  const code = error?.code ? ` (${error.code})` : ''
  throw new Error(`Connection ${operation} transport failed${code}`)
}

export function parseSendConnectionRequestRow(row: unknown): SendConnectionRequestResult {
  const parsed = sendRowSchema.parse(row)
  if (
    parsed.result_code === 'created' ||
    parsed.result_code === 'existing' ||
    parsed.result_code === 'incoming_pending'
  ) {
    if (!parsed.request_id) return contractError('send', 'durable result without request ID')
    return {
      status: parsed.result_code,
      requestId: parsed.request_id,
    }
  }
  if (parsed.request_id) return contractError('send', 'denial included request ID')
  return { status: parsed.result_code }
}

export function parseRespondToConnectionRequestRow(row: unknown): RespondToConnectionRequestResult {
  const parsed = respondRowSchema.parse(row)
  if (parsed.result_code === 'accepted') {
    if (!parsed.connection_id || !parsed.conversation_id) {
      return contractError('respond', 'accepted without durable IDs')
    }
    return {
      status: 'accepted',
      connectionId: parsed.connection_id,
      conversationId: parsed.conversation_id,
    }
  }
  if (parsed.result_code === 'already_decided') {
    if (Boolean(parsed.connection_id) !== Boolean(parsed.conversation_id)) {
      return contractError('respond', 'partial already-decided IDs')
    }
    return {
      status: 'already_decided',
      connectionId: parsed.connection_id,
      conversationId: parsed.conversation_id,
    }
  }
  if (parsed.connection_id || parsed.conversation_id) {
    return contractError('respond', 'nonaccepted result included IDs')
  }
  return { status: parsed.result_code }
}

export function parseDisconnectRow(row: unknown): DisconnectResult {
  return { status: disconnectRowSchema.parse(row).result_code }
}

export function createConnectionsRepository(
  memberClient: SupabaseClient<Database>,
): ConnectionsRepository {
  return {
    async sendRequest(input) {
      const { data, error } = await memberClient
        .schema('api')
        .rpc('send_connection_request', {
          p_recipient_user_id: input.recipientUserId,
          p_origin_organization_id: input.originOrganizationId,
          p_intro_message: input.introMessage ?? '',
          p_client_request_id: input.clientRequestId,
        })
        .single()
      if (error) transportError('sendRequest', error)
      return parseSendConnectionRequestRow(data)
    },

    async respondToRequest(input) {
      const { data, error } = await memberClient
        .schema('api')
        .rpc('respond_to_connection_request', {
          p_request_id: input.requestId,
          p_decision: input.decision,
        })
        .single()
      if (error) transportError('respondToRequest', error)
      return parseRespondToConnectionRequestRow(data)
    },

    async disconnect(otherUserId) {
      const { data, error } = await memberClient
        .schema('api')
        .rpc('disconnect', { p_other_user_id: otherUserId })
        .single()
      if (error) transportError('disconnect', error)
      return parseDisconnectRow(data)
    },
  }
}

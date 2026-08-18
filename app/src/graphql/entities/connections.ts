import { createConnectionsRepository } from '@/db/repositories/connections'
import { getMemberContext } from '@/db/repositories/member-context'
import type {
  DisconnectResult,
  RespondToConnectionRequestResult,
  SendConnectionRequestResult,
} from '@/lib/connections/contracts'
import { builder } from '../builder'

/**
 * Connections — the mutual-connection commands, delegating to
 * `db/repositories/connections` (send_connection_request /
 * respond_to_connection_request / disconnect).
 *
 * Connections are the DM gate (mutual, unlike one-sided Help), so these
 * commands pair with startDirectConversation's CONNECTION_REQUIRED terminal.
 * The circle READ surface already exists as peopleSearch(scope: IN_CIRCLE);
 * pending requests surface on conversations/profile relationship states.
 *
 * Status vocabularies verbatim, per the established convention. The one worth
 * calling out: INCOMING_PENDING on sendConnectionRequest — when the other
 * member already sent the viewer a request, v2 surfaces THAT pending request's
 * id instead of creating a crossing one; the client should pivot to
 * accept/decline. originOrganizationId is resolved server-side from the
 * viewer's selected membership, never client-supplied.
 */

const SendConnectionRequestStatus = builder.enumType('SendConnectionRequestStatus', {
  values: [
    'CREATED',
    'EXISTING',
    'INCOMING_PENDING',
    'ALREADY_CONNECTED',
    'IDEMPOTENCY_CONFLICT',
    'INVALID_INPUT',
    'NOT_AVAILABLE',
  ] as const,
})

const RespondConnectionStatus = builder.enumType('RespondConnectionStatus', {
  values: ['ACCEPTED', 'DECLINED', 'ALREADY_DECIDED', 'INVALID_INPUT', 'NOT_AVAILABLE'] as const,
})

const DisconnectStatus = builder.enumType('DisconnectStatus', {
  values: ['DISCONNECTED', 'UNCHANGED', 'NOT_AVAILABLE'] as const,
})

const ConnectionDecisionInput = builder.enumType('ConnectionDecisionInput', {
  values: ['ACCEPT', 'DECLINE'] as const,
})

const upper = <T extends string>(v: T) => v.toUpperCase() as Uppercase<T>

const SendConnectionRequestPayload = builder.objectRef<SendConnectionRequestResult>(
  'SendConnectionRequestPayload',
)
SendConnectionRequestPayload.implement({
  fields: (t) => ({
    status: t.field({
      type: SendConnectionRequestStatus,
      nullable: false,
      resolve: (r) => upper(r.status),
    }),
    // For CREATED/EXISTING this is the viewer's outgoing request; for
    // INCOMING_PENDING it is the OTHER member's pending request to act on.
    requestId: t.id({
      nullable: true,
      resolve: (r) => ('requestId' in r ? r.requestId : null),
    }),
  }),
})

const RespondConnectionPayload = builder.objectRef<RespondToConnectionRequestResult>(
  'RespondConnectionPayload',
)
RespondConnectionPayload.implement({
  fields: (t) => ({
    status: t.field({
      type: RespondConnectionStatus,
      nullable: false,
      resolve: (r) => upper(r.status),
    }),
    connectionId: t.id({
      nullable: true,
      resolve: (r) => ('connectionId' in r ? r.connectionId : null),
    }),
    // Accepting opens the direct conversation; set on ACCEPTED (and echoed on
    // ALREADY_DECIDED when the prior decision was an accept).
    conversationId: t.id({
      nullable: true,
      resolve: (r) => ('conversationId' in r ? r.conversationId : null),
    }),
  }),
})

const DisconnectPayload = builder.objectRef<DisconnectResult>('DisconnectPayload')
DisconnectPayload.implement({
  fields: (t) => ({
    status: t.field({ type: DisconnectStatus, nullable: false, resolve: (r) => upper(r.status) }),
  }),
})

builder.mutationFields((t) => ({
  /**
   * Ask to connect with another member. `clientRequestId` is the idempotency
   * key (replay → EXISTING). If the other member already asked, returns
   * INCOMING_PENDING with THEIR requestId — pivot to respond, don't re-send.
   */
  sendConnectionRequest: t.field({
    type: SendConnectionRequestPayload,
    nullable: false,
    args: {
      recipientUserId: t.arg.id({ required: true }),
      introMessage: t.arg.string({ required: false }),
      clientRequestId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx): Promise<SendConnectionRequestResult> => {
      if (!ctx.session) return { status: 'not_available' }
      const context = await getMemberContext(ctx.supabase)
      const membership =
        context.memberships.find((m) => m.membershipId === context.selectedMembershipId) ??
        context.memberships[0]
      if (!membership) return { status: 'not_available' }
      return createConnectionsRepository(ctx.supabase).sendRequest({
        recipientUserId: String(args.recipientUserId),
        originOrganizationId: membership.organization.id,
        introMessage: args.introMessage ?? null,
        clientRequestId: args.clientRequestId,
      })
    },
  }),

  /** Accept or decline an incoming connection request. Accepting opens the
   * direct conversation (connections are the DM gate). */
  respondToConnectionRequest: t.field({
    type: RespondConnectionPayload,
    nullable: false,
    args: {
      requestId: t.arg.id({ required: true }),
      decision: t.arg({ type: ConnectionDecisionInput, required: true }),
    },
    resolve: async (_root, args, ctx): Promise<RespondToConnectionRequestResult> => {
      if (!ctx.session) return { status: 'not_available' }
      return createConnectionsRepository(ctx.supabase).respondToRequest({
        requestId: String(args.requestId),
        decision: args.decision === 'ACCEPT' ? 'accept' : 'decline',
      })
    },
  }),

  /** Remove a mutual connection. Idempotent — UNCHANGED when not connected. */
  disconnect: t.field({
    type: DisconnectPayload,
    nullable: false,
    args: { otherUserId: t.arg.id({ required: true }) },
    resolve: async (_root, args, ctx): Promise<DisconnectResult> => {
      if (!ctx.session) return { status: 'not_available' }
      return createConnectionsRepository(ctx.supabase).disconnect(String(args.otherUserId))
    },
  }),
}))

import { closeOpenAsk, createOpenAsk, getOpenAskForUser, type OpenAsk } from '@/lib/asks/openAsks'
import { getActiveOrganizationId } from '@/lib/members/getActiveOrganizationId'
import { builder } from '../builder'

/**
 * Open Asks — the first vertical slice migrated to the graph. Reads and
 * mutations both delegate to `lib/asks/openAsks.ts`, so GraphQL output matches
 * the existing `/lib` path by construction; the parity harness guards the
 * shape (camelCase, enum casing) and the auth/RLS behavior. See the parity
 * manifest for the exact old↔new mapping.
 *
 * `createdAt` / `expiresAt` are exposed as ISO-8601 strings — the same strings
 * the `/lib` function returns — so parity is a literal equality. A shared
 * DateTime scalar is a later hardening step.
 */
const OpenAskRef = builder.objectRef<OpenAsk>('OpenAsk')
OpenAskRef.implement({
  description: "A member's standing ask, left open for background matching.",
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    question: t.exposeString('question', { nullable: false }),
    createdAt: t.exposeString('createdAt', { nullable: false }),
    expiresAt: t.exposeString('expiresAt', { nullable: false }),
  }),
})

// Mirrors CreateOpenAskResult['error'] (uppercased), plus the two auth failures
// the GraphQL wrapper adds on top of the /lib function.
const OpenAskError = builder.enumType('OpenAskError', {
  values: [
    'INVALID_QUESTION',
    'ALREADY_OPEN',
    'INSERT_FAILED',
    'NOT_AUTHENTICATED',
    'NO_MEMBERSHIP',
  ] as const,
})

const OpenAskCloseReason = builder.enumType('OpenAskCloseReason', {
  values: ['MEMBER_CLOSED', 'RESOLVED'] as const,
})

type OpenAskErrorValue =
  | 'INVALID_QUESTION'
  | 'ALREADY_OPEN'
  | 'INSERT_FAILED'
  | 'NOT_AUTHENTICATED'
  | 'NO_MEMBERSHIP'

// The {ok,error} result union → a GraphQL payload: exactly one of the two
// fields is non-null. This is the pattern every mutation slice reuses.
type CreateOpenAskPayload = { openAsk: OpenAsk | null; error: OpenAskErrorValue | null }
const CreateOpenAskPayloadRef = builder.objectRef<CreateOpenAskPayload>('CreateOpenAskPayload')
CreateOpenAskPayloadRef.implement({
  fields: (t) => ({
    openAsk: t.field({ type: OpenAskRef, nullable: true, resolve: (p) => p.openAsk }),
    error: t.field({ type: OpenAskError, nullable: true, resolve: (p) => p.error }),
  }),
})

builder.queryFields((t) => ({
  /** The signed-in member's live standing ask, or null. */
  myOpenAsk: t.field({
    type: OpenAskRef,
    nullable: true,
    resolve: (_root, _args, ctx) =>
      ctx.session ? getOpenAskForUser(ctx.supabase, { userId: ctx.session.userId }) : null,
  }),
}))

builder.mutationFields((t) => ({
  /** Leave a standing ask open. Org is derived from the caller's membership. */
  createOpenAsk: t.field({
    type: CreateOpenAskPayloadRef,
    nullable: false,
    args: { question: t.arg.string({ required: true }) },
    resolve: async (_root, { question }, ctx): Promise<CreateOpenAskPayload> => {
      if (!ctx.session) return { openAsk: null, error: 'NOT_AUTHENTICATED' }
      const organizationId = await getActiveOrganizationId(ctx.supabase, ctx.session.userId)
      if (!organizationId) return { openAsk: null, error: 'NO_MEMBERSHIP' }

      const result = await createOpenAsk(ctx.supabase, {
        userId: ctx.session.userId,
        organizationId,
        question,
      })
      return result.ok
        ? { openAsk: result.openAsk, error: null }
        : { openAsk: null, error: result.error.toUpperCase() as OpenAskErrorValue }
    },
  }),

  /** Close the caller's standing ask. Returns false if nothing was closed. */
  closeOpenAsk: t.boolean({
    nullable: false,
    args: {
      openAskId: t.arg.id({ required: true }),
      reason: t.arg({ type: OpenAskCloseReason, required: true }),
    },
    resolve: (_root, { openAskId, reason }, ctx) => {
      if (!ctx.session) return false
      return closeOpenAsk(ctx.supabase, {
        userId: ctx.session.userId,
        openAskId: String(openAskId),
        reason: reason === 'RESOLVED' ? 'resolved' : 'member_closed',
      })
    },
  }),
}))

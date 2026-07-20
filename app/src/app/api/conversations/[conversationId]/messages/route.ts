import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createConversationRepository } from '@/db/repositories/conversations'
import { createClient } from '@/db/server'
import { sendMessage } from '@/lib/conversations/sendMessage'

export const dynamic = 'force-dynamic'

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store, max-age=0' }
const sendSchema = z
  .object({ body: z.string().trim().min(1).max(10_000), clientNonce: z.uuid() })
  .strict()

async function authenticatedRepository() {
  const client = await createClient()
  const { data, error } = await client.auth.getUser()
  return error || !data.user ? null : createConversationRepository(client)
}

export async function GET(
  request: Request,
  context: { params: Promise<{ conversationId: string }> },
) {
  const repository = await authenticatedRepository()
  if (!repository) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: NO_STORE_HEADERS })
  }
  const { conversationId } = await context.params
  if (!z.uuid().safeParse(conversationId).success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400, headers: NO_STORE_HEADERS })
  }
  const url = new URL(request.url)
  const parsed = z
    .object({
      after: z.coerce.number().int().positive().safe().optional(),
      before: z.coerce.number().int().positive().safe().optional(),
      limit: z.coerce.number().int().min(1).max(100).default(50),
    })
    .refine((value) => !(value.after && value.before))
    .safeParse(Object.fromEntries(url.searchParams.entries()))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_cursor' },
      { status: 400, headers: NO_STORE_HEADERS },
    )
  }

  try {
    const messages = parsed.data.after
      ? await repository.listAfter({
          conversationId,
          afterMessageId: parsed.data.after,
          limit: parsed.data.limit,
        })
      : await repository.listBefore({
          conversationId,
          beforeMessageId: parsed.data.before ?? null,
          limit: parsed.data.limit,
        })
    return NextResponse.json({ messages }, { headers: NO_STORE_HEADERS })
  } catch (error) {
    Sentry.captureException(error, { tags: { scope: 'conversation-messages-list' } })
    return NextResponse.json(
      { error: 'messages_unavailable' },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ conversationId: string }> },
) {
  const repository = await authenticatedRepository()
  if (!repository) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: NO_STORE_HEADERS })
  }
  const { conversationId } = await context.params
  if (!z.uuid().safeParse(conversationId).success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400, headers: NO_STORE_HEADERS })
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400, headers: NO_STORE_HEADERS })
  }
  const parsed = sendSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_message' },
      { status: 400, headers: NO_STORE_HEADERS },
    )
  }
  try {
    const result = await sendMessage({ conversationId, ...parsed.data }, repository)
    const status =
      result.status === 'not_available'
        ? 404
        : result.status === 'invalid_message'
          ? 400
          : result.status === 'rate_limited'
            ? 429
            : 200
    return NextResponse.json(result, { status, headers: NO_STORE_HEADERS })
  } catch (error) {
    Sentry.captureException(error, { tags: { scope: 'conversation-message-send' } })
    return NextResponse.json(
      { error: 'send_unavailable' },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }
}

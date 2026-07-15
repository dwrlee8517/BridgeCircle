import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createConversationRepository } from '@/db/repositories/conversations'
import { createClient } from '@/db/server'
import { publishTyping } from '@/lib/conversations/publishTyping'

export const dynamic = 'force-dynamic'
const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store, max-age=0' }
const bodySchema = z.object({ isTyping: z.boolean() }).strict()

export async function POST(
  request: Request,
  context: { params: Promise<{ conversationId: string }> },
) {
  const client = await createClient()
  const { data: auth, error: authError } = await client.auth.getUser()
  if (authError || !auth.user) {
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
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400, headers: NO_STORE_HEADERS })
  }
  try {
    const result = await publishTyping(
      { conversationId, isTyping: parsed.data.isTyping },
      createConversationRepository(client),
    )
    return NextResponse.json(result, { headers: NO_STORE_HEADERS })
  } catch (error) {
    Sentry.captureException(error, { tags: { scope: 'conversation-typing' } })
    return NextResponse.json(
      { status: 'not_available' },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }
}

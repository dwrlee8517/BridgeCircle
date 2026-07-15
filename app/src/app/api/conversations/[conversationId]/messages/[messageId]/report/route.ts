import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createConversationRepository } from '@/db/repositories/conversations'
import { createHelpRepository } from '@/db/repositories/help'
import { createClient } from '@/db/server'

export const dynamic = 'force-dynamic'
const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store, max-age=0' }
const bodySchema = z
  .object({
    reason: z.enum(['harassment', 'spam', 'inappropriate', 'impersonation', 'other']),
    note: z.string().trim().min(1).max(4_000).nullable(),
  })
  .strict()

export async function POST(
  request: Request,
  context: { params: Promise<{ conversationId: string; messageId: string }> },
) {
  const client = await createClient()
  const { data: auth, error: authError } = await client.auth.getUser()
  if (authError || !auth.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: NO_STORE_HEADERS })
  }
  const { conversationId, messageId } = await context.params
  const parsedId = z.coerce.number().int().positive().safe().safeParse(messageId)
  if (!z.uuid().safeParse(conversationId).success || !parsedId.success) {
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
    const detail = await createConversationRepository(client).getDetail(conversationId)
    if (!detail) {
      return NextResponse.json(
        { error: 'not_available' },
        { status: 404, headers: NO_STORE_HEADERS },
      )
    }
    const result = await createHelpRepository(client).reportMessage({
      messageId: parsedId.data,
      ...parsed.data,
    })
    return NextResponse.json(
      { status: 'submitted', reportId: result.reportId },
      { headers: NO_STORE_HEADERS },
    )
  } catch (error) {
    Sentry.captureException(error, { tags: { scope: 'conversation-message-report' } })
    return NextResponse.json(
      { error: 'report_unavailable' },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }
}

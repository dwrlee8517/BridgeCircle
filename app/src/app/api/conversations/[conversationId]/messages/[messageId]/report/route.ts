import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSafetyRepository } from '@/db/repositories/safety'
import { createClient } from '@/db/server'
import { reportMessage } from '@/lib/safety/operations'

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
    const result = await reportMessage(
      { messageId: parsedId.data, ...parsed.data },
      createSafetyRepository(client),
    )
    const status =
      result.status === 'invalid_input' ? 400 : result.status === 'not_available' ? 404 : 200
    return NextResponse.json(result, { status, headers: NO_STORE_HEADERS })
  } catch {
    Sentry.captureException(new Error('Conversation message report failed'), {
      tags: { scope: 'conversation-message-report' },
    })
    return NextResponse.json(
      { error: 'report_unavailable' },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }
}

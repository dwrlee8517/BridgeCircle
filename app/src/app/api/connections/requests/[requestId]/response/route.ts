import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createConnectionsRepository } from '@/db/repositories/connections'
import { createClient } from '@/db/server'
import { respondToConnectionRequest } from '@/lib/connections/operations'

export const dynamic = 'force-dynamic'
const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store, max-age=0' }
const bodySchema = z.object({ decision: z.enum(['accept', 'decline']) }).strict()

export async function POST(request: Request, context: { params: Promise<{ requestId: string }> }) {
  const client = await createClient()
  const { data: auth, error: authError } = await client.auth.getUser()
  if (authError || !auth.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: NO_STORE_HEADERS })
  }
  const { requestId } = await context.params
  if (!z.uuid().safeParse(requestId).success) {
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
    const result = await respondToConnectionRequest(
      { requestId, decision: parsed.data.decision },
      createConnectionsRepository(client),
    )
    const status =
      result.status === 'invalid_input' ? 400 : result.status === 'not_available' ? 404 : 200
    return NextResponse.json(result, { status, headers: NO_STORE_HEADERS })
  } catch {
    Sentry.captureException(new Error('Connection response failed'), {
      tags: { scope: 'connection-response' },
    })
    return NextResponse.json(
      { error: 'response_unavailable' },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }
}

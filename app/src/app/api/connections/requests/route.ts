import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createConnectionsRepository } from '@/db/repositories/connections'
import { createClient } from '@/db/server'
import { sendConnectionRequest } from '@/lib/connections/operations'

export const dynamic = 'force-dynamic'
const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store, max-age=0' }
const bodySchema = z
  .object({
    recipientUserId: z.uuid(),
    originOrganizationId: z.uuid(),
    introMessage: z.string().trim().max(2_000).nullable(),
    clientRequestId: z.uuid(),
  })
  .strict()

export async function POST(request: Request) {
  const client = await createClient()
  const { data: auth, error: authError } = await client.auth.getUser()
  if (authError || !auth.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: NO_STORE_HEADERS })
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
    const result = await sendConnectionRequest(parsed.data, createConnectionsRepository(client))
    const status =
      result.status === 'invalid_input'
        ? 400
        : result.status === 'not_available'
          ? 404
          : result.status === 'idempotency_conflict'
            ? 409
            : 200
    return NextResponse.json(result, { status, headers: NO_STORE_HEADERS })
  } catch {
    Sentry.captureException(new Error('Connection request failed'), {
      tags: { scope: 'connection-request' },
    })
    return NextResponse.json(
      { error: 'request_unavailable' },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }
}

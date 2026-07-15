import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createConnectionsRepository } from '@/db/repositories/connections'
import { createClient } from '@/db/server'
import { disconnectMember } from '@/lib/connections/operations'

export const dynamic = 'force-dynamic'
const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store, max-age=0' }

export async function POST(_request: Request, context: { params: Promise<{ userId: string }> }) {
  const client = await createClient()
  const { data: auth, error: authError } = await client.auth.getUser()
  if (authError || !auth.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: NO_STORE_HEADERS })
  }
  const { userId } = await context.params
  if (!z.uuid().safeParse(userId).success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  try {
    const result = await disconnectMember(userId, createConnectionsRepository(client))
    return NextResponse.json(result, {
      status: result.status === 'not_available' ? 404 : 200,
      headers: NO_STORE_HEADERS,
    })
  } catch {
    Sentry.captureException(new Error('Connection disconnect failed'), {
      tags: { scope: 'connection-disconnect' },
    })
    return NextResponse.json(
      { error: 'disconnect_unavailable' },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }
}

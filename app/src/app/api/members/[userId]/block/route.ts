import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSafetyRepository } from '@/db/repositories/safety'
import { createClient } from '@/db/server'
import { blockMember } from '@/lib/safety/operations'

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
    const result = await blockMember(userId, createSafetyRepository(client))
    return NextResponse.json(result, {
      status: result.status === 'not_available' ? 404 : 200,
      headers: NO_STORE_HEADERS,
    })
  } catch {
    Sentry.captureException(new Error('Member block failed'), { tags: { scope: 'member-block' } })
    return NextResponse.json(
      { error: 'block_unavailable' },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }
}

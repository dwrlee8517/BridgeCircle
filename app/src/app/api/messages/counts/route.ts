import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { createMessagesRepository } from '@/db/repositories/messages'
import { createClient } from '@/db/server'
import { getMessagesCounts } from '@/lib/messages/operations'

export const dynamic = 'force-dynamic'
const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store, max-age=0' }

export async function GET() {
  const client = await createClient()
  const { data: auth, error: authError } = await client.auth.getUser()
  if (authError || !auth.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: NO_STORE_HEADERS })
  }

  try {
    const counts = await getMessagesCounts(createMessagesRepository(client))
    return NextResponse.json(counts, { headers: NO_STORE_HEADERS })
  } catch {
    Sentry.captureException(new Error('Messages counts refresh failed'), {
      tags: { scope: 'messages-counts' },
    })
    return NextResponse.json(
      { error: 'counts_unavailable' },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }
}

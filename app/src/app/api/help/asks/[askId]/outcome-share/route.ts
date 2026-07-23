import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createHomeRepository } from '@/db/repositories/home'
import { createClient } from '@/db/server'
import { saveAskOutcomeShare } from '@/lib/home/operations'

export const dynamic = 'force-dynamic'

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store, max-age=0' }
const bodySchema = z.object({ shareStory: z.boolean(), shareIdentity: z.boolean() }).strict()

export async function POST(request: Request, context: { params: Promise<{ askId: string }> }) {
  const client = await createClient()
  const { data: auth, error: authError } = await client.auth.getUser()
  if (authError || !auth.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: NO_STORE_HEADERS })
  }

  const { askId } = await context.params
  if (!z.uuid().safeParse(askId).success) {
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
    const result = await saveAskOutcomeShare(
      { askId, ...parsed.data },
      createHomeRepository(client),
    )
    const status =
      result.status === 'not_available' ? 404 : result.status === 'invalid_input' ? 400 : 200
    return NextResponse.json(result, { status, headers: NO_STORE_HEADERS })
  } catch (error) {
    Sentry.captureException(error, { tags: { scope: 'help-ask-outcome-share' } })
    return NextResponse.json(
      { error: 'share_unavailable' },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }
}

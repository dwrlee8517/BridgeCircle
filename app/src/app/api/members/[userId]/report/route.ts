import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSafetyRepository } from '@/db/repositories/safety'
import { createClient } from '@/db/server'
import { reportProfile } from '@/lib/safety/operations'

export const dynamic = 'force-dynamic'
const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store, max-age=0' }
const bodySchema = z
  .object({
    reason: z.enum(['harassment', 'spam', 'inappropriate', 'impersonation', 'other']),
    note: z.string().trim().max(4_000).nullable(),
  })
  .strict()

export async function POST(request: Request, context: { params: Promise<{ userId: string }> }) {
  const client = await createClient()
  const { data: auth, error: authError } = await client.auth.getUser()
  if (authError || !auth.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: NO_STORE_HEADERS })
  }
  const { userId } = await context.params
  if (!z.uuid().safeParse(userId).success) {
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
    const result = await reportProfile({ userId, ...parsed.data }, createSafetyRepository(client))
    return NextResponse.json(result, {
      status:
        result.status === 'invalid_input' ? 400 : result.status === 'not_available' ? 404 : 200,
      headers: NO_STORE_HEADERS,
    })
  } catch (error) {
    Sentry.captureException(error, { tags: { scope: 'profile-report' } })
    return NextResponse.json(
      { error: 'report_unavailable' },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }
}

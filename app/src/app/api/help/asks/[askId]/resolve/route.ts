import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { resolveHelpAsk } from '@/lib/help/operations'
import { authenticatedHelpRepository } from '../../../_lib/authenticated-repository'

export const dynamic = 'force-dynamic'

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store, max-age=0' }
const bodySchema = z.object({ outcomeNote: z.string().trim().max(2_000).nullable() }).strict()

export async function POST(request: Request, context: { params: Promise<{ askId: string }> }) {
  const repository = await authenticatedHelpRepository()
  if (!repository) {
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
    const result = await resolveHelpAsk({ askId, outcomeNote: parsed.data.outcomeNote }, repository)
    const status =
      result.status === 'not_available' ? 404 : result.status === 'invalid_input' ? 400 : 200
    return NextResponse.json(result, { status, headers: NO_STORE_HEADERS })
  } catch (error) {
    Sentry.captureException(error, { tags: { scope: 'help-ask-resolve' } })
    return NextResponse.json(
      { error: 'resolve_unavailable' },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }
}

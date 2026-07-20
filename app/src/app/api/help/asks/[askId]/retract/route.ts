import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticatedHelpRepository } from '../../../_lib/authenticated-repository'

export const dynamic = 'force-dynamic'

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store, max-age=0' }

export async function POST(_request: Request, context: { params: Promise<{ askId: string }> }) {
  const repository = await authenticatedHelpRepository()
  if (!repository) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: NO_STORE_HEADERS })
  }

  const { askId } = await context.params
  if (!z.guid().safeParse(askId).success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  try {
    const result = await repository.retractAsk(askId)
    const status =
      result.status === 'not_available' ? 404 : result.status === 'invalid_input' ? 400 : 200
    return NextResponse.json(result, { status, headers: NO_STORE_HEADERS })
  } catch (error) {
    Sentry.captureException(error, {
      tags: { scope: 'help-ask-retract' },
    })
    return NextResponse.json(
      { error: 'retract_unavailable' },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }
}

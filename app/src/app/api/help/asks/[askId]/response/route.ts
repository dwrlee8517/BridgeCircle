import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { respondToDirectHelpAsk } from '@/lib/help/operations'
import { authenticatedHelpRepository } from '../../../_lib/authenticated-repository'

export const dynamic = 'force-dynamic'

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store, max-age=0' }
const bodySchema = z.discriminatedUnion('decision', [
  z
    .object({
      decision: z.literal('accept'),
      openingMessage: z.string().trim().min(1).max(10_000),
      clientNonce: z.uuid(),
    })
    .strict(),
  z
    .object({
      decision: z.literal('decline'),
      declineReasonCode: z.enum(['unavailable', 'outside_expertise', 'other']),
      declineNote: z.string().trim().min(1).max(2_000),
    })
    .strict(),
])

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
    const result = await respondToDirectHelpAsk(
      parsed.data.decision === 'accept'
        ? {
            askId,
            decision: 'accept',
            openingMessage: parsed.data.openingMessage,
            declineReasonCode: null,
            declineNote: null,
            clientNonce: parsed.data.clientNonce,
          }
        : {
            askId,
            decision: 'decline',
            openingMessage: null,
            declineReasonCode: parsed.data.declineReasonCode,
            declineNote: parsed.data.declineNote,
            clientNonce: null,
          },
      repository,
    )
    const status =
      result.status === 'not_available' ? 404 : result.status === 'invalid_input' ? 400 : 200
    return NextResponse.json(result, { status, headers: NO_STORE_HEADERS })
  } catch (error) {
    Sentry.captureException(error, { tags: { scope: 'help-direct-response' } })
    return NextResponse.json(
      { error: 'response_unavailable' },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }
}

import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { decideHelpOffer } from '@/lib/help/operations'
import { authenticatedHelpRepository } from '../../../_lib/authenticated-repository'

export const dynamic = 'force-dynamic'

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store, max-age=0' }
const bodySchema = z.discriminatedUnion('decision', [
  z
    .object({
      decision: z.literal('accept'),
      openingMessage: z.string().trim().min(1).max(10_000),
      clientNonce: z.guid(),
    })
    .strict(),
  z
    .object({
      decision: z.literal('decline'),
      declineReasonCode: z.enum(['went_another_direction', 'not_right_fit', 'other']),
      declineNote: z.string().trim().min(1).max(2_000),
    })
    .strict(),
])

export async function POST(request: Request, context: { params: Promise<{ offerId: string }> }) {
  const repository = await authenticatedHelpRepository()
  if (!repository) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: NO_STORE_HEADERS })
  }

  const { offerId } = await context.params
  if (!z.guid().safeParse(offerId).success) {
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
    const result = await decideHelpOffer(
      parsed.data.decision === 'accept'
        ? {
            offerId,
            decision: 'accept',
            openingMessage: parsed.data.openingMessage,
            declineReasonCode: null,
            declineNote: null,
            clientNonce: parsed.data.clientNonce,
          }
        : {
            offerId,
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
    Sentry.captureException(error, {
      tags: { scope: 'help-offer-decision' },
    })
    return NextResponse.json(
      { error: 'decision_unavailable' },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }
}

import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { createHelpRepository } from '@/db/repositories/help'
import { createPeopleRepository } from '@/db/repositories/people'
import { createAnthropicPeopleProviderFromEnvironment } from '@/integrations/ai/people-anthropic'
import { selectedMembership } from '@/lib/membership/selection'
import { shapeConnectionDraft } from '@/lib/people/connection-draft'

export const dynamic = 'force-dynamic'
const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store, max-age=0' }
const bodySchema = z
  .object({
    recipientUserId: z.uuid(),
    reason: z.string().trim().min(1).max(800),
  })
  .strict()

export async function POST(request: Request) {
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
    const { client, context } = await loadMemberContext()
    const membership = selectedMembership(context)
    if (!membership || membership.status !== 'active') {
      return NextResponse.json(
        { error: 'not_available' },
        { status: 404, headers: NO_STORE_HEADERS },
      )
    }
    const helpRepository = createHelpRepository(client)
    const result = await shapeConnectionDraft(
      {
        membershipId: membership.membershipId,
        recipientUserId: parsed.data.recipientUserId,
        reason: parsed.data.reason,
        signal: request.signal,
      },
      {
        repository: createPeopleRepository(client),
        provider: createAnthropicPeopleProviderFromEnvironment(),
        budget: {
          consume: async () => {
            const budget = await helpRepository.consumeAiBudget('ask_draft')
            return { status: budget.status }
          },
        },
      },
    )
    const status =
      result.status === 'invalid_input' ? 400 : result.status === 'not_available' ? 404 : 200
    return NextResponse.json(result, { status, headers: NO_STORE_HEADERS })
  } catch (error) {
    Sentry.captureException(error, { tags: { scope: 'people-connection-draft' } })
    return NextResponse.json(
      { error: 'draft_unavailable' },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }
}

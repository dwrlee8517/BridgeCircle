import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { readMembershipPreference } from '@/app/_lib/membership-cookie'
import { createHelpRepository } from '@/db/repositories/help'
import { getMemberContext } from '@/db/repositories/member-context'
import { createClient } from '@/db/server'
import { createCircleHelpAsk } from '@/lib/help/operations'
import { selectedMembership } from '@/lib/membership/selection'

export const dynamic = 'force-dynamic'

const bodySchema = z
  .object({
    question: z.string().trim().min(1).max(2_000),
    reach: z.enum(['matched', 'organization']),
    anonymousUntilAccepted: z.boolean(),
    clientRequestId: z.uuid(),
  })
  .strict()

const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
}

export async function POST(request: Request) {
  const client = await createClient()
  const { data: auth, error: authError } = await client.auth.getUser()
  if (authError || !auth.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: NO_STORE_HEADERS })
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
    const preferredMembershipId = await readMembershipPreference()
    const context = await getMemberContext(client, preferredMembershipId)
    const membership = selectedMembership(context)
    if (!membership || membership.status !== 'active') {
      return NextResponse.json(
        { error: 'membership_unavailable' },
        { status: 403, headers: NO_STORE_HEADERS },
      )
    }

    const result = await createCircleHelpAsk(
      { membershipId: membership.membershipId, ...parsed.data },
      createHelpRepository(client),
    )
    return NextResponse.json(result, { headers: NO_STORE_HEADERS })
  } catch {
    Sentry.captureException(new Error('Help circle Ask request failed'), {
      tags: { scope: 'help-circle-ask' },
    })
    return NextResponse.json(
      { error: 'post_unavailable' },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }
}

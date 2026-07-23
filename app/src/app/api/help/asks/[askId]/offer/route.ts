import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { readMembershipPreference } from '@/app/_lib/membership-cookie'
import { createHelpRepository } from '@/db/repositories/help'
import { getMemberContext } from '@/db/repositories/member-context'
import { createClient } from '@/db/server'
import { offerHelp } from '@/lib/help/operations'
import { selectedMembership } from '@/lib/membership/selection'

export const dynamic = 'force-dynamic'

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store, max-age=0' }
const bodySchema = z
  .object({
    offerNote: z.string().trim().min(1).max(4_000),
    clientRequestId: z.uuid(),
  })
  .strict()

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
    const preferredMembershipId = await readMembershipPreference()
    const memberContext = await getMemberContext(client, preferredMembershipId)
    const membership = selectedMembership(memberContext)
    if (!membership || membership.status !== 'active') {
      return NextResponse.json(
        { error: 'membership_unavailable' },
        { status: 403, headers: NO_STORE_HEADERS },
      )
    }

    const result = await offerHelp(
      {
        askId,
        membershipId: membership.membershipId,
        ...parsed.data,
      },
      createHelpRepository(client),
    )
    const status =
      result.status === 'not_available' ? 404 : result.status === 'invalid_input' ? 400 : 200
    return NextResponse.json(result, { status, headers: NO_STORE_HEADERS })
  } catch (error) {
    Sentry.captureException(error, { tags: { scope: 'help-offer-create' } })
    return NextResponse.json(
      { error: 'offer_unavailable' },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }
}

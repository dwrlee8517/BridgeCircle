import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { readMembershipPreference } from '@/app/_lib/membership-cookie'
import { createHelpRepository } from '@/db/repositories/help'
import { getMemberContext } from '@/db/repositories/member-context'
import { createClient } from '@/db/server'
import { createAnthropicHelpProviderFromEnvironment } from '@/integrations/ai/help-anthropic'
import { assistHelpText } from '@/lib/help/assistance'
import { selectedMembership } from '@/lib/membership/selection'

export const dynamic = 'force-dynamic'

const bodySchema = z
  .object({
    task: z.enum(['ask_draft', 'offer_note', 'decline_note']),
    currentText: z.string().trim().min(1).max(4_000),
    context: z.array(z.string().trim().min(1).max(800)).max(10),
    fallbackText: z.string().trim().min(1).max(4_000),
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

    const result = await assistHelpText(
      { ...parsed.data, signal: request.signal },
      {
        repository: createHelpRepository(client),
        provider: createAnthropicHelpProviderFromEnvironment(),
      },
    )
    return NextResponse.json(result, { headers: NO_STORE_HEADERS })
  } catch (error) {
    Sentry.captureException(error, {
      tags: { scope: 'help-assistance' },
    })
    return NextResponse.json(
      { status: 'not_available', text: null, remaining: 0 },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }
}

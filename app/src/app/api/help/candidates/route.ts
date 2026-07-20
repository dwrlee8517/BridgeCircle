import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { readMembershipPreference } from '@/app/_lib/membership-cookie'
import { createHelpRepository } from '@/db/repositories/help'
import { getMemberContext } from '@/db/repositories/member-context'
import { createClient } from '@/db/server'
import { createVoyageHelpProviderFromEnvironment } from '@/integrations/ai/help-voyage'
import { findMemberHelpCandidates } from '@/lib/help/matching'
import { selectedMembership } from '@/lib/membership/selection'

export const dynamic = 'force-dynamic'

const bodySchema = z
  .object({
    question: z.string().trim().min(1).max(2_000),
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

    const repository = createHelpRepository(client)
    const voyage = createVoyageHelpProviderFromEnvironment()
    const result = await findMemberHelpCandidates(
      {
        membershipId: membership.membershipId,
        question: parsed.data.question,
        limit: 10,
        signal: request.signal,
      },
      {
        repository,
        embeddings: voyage,
        reranker: voyage,
      },
    )

    const candidates = result.candidates.map((candidate) => ({
      membershipId: candidate.membershipId,
      userId: candidate.userId,
      displayName: candidate.displayName,
      headline: candidate.headline,
      avatarUrl: candidate.avatarPath
        ? client.storage.from('avatars').getPublicUrl(candidate.avatarPath).data.publicUrl
        : null,
      graduationYear: candidate.graduationYear,
      matchReason: candidate.matchReason,
    }))

    return NextResponse.json({ candidates }, { headers: NO_STORE_HEADERS })
  } catch (error) {
    if (request.signal.aborted) {
      return new NextResponse(null, { status: 499, headers: NO_STORE_HEADERS })
    }
    Sentry.captureException(error, { tags: { scope: 'help-candidate-search' } })
    return NextResponse.json(
      { error: 'search_unavailable' },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }
}

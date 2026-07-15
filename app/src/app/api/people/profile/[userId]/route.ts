import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { createAvatarStorageRepository } from '@/db/repositories/avatar-storage'
import { createPeopleRepository } from '@/db/repositories/people'
import { selectedMembership } from '@/lib/membership/selection'
import { getMemberProfile } from '@/lib/people/operations'

export const dynamic = 'force-dynamic'
const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store, max-age=0' }

export async function GET(_request: Request, context: { params: Promise<{ userId: string }> }) {
  const { userId } = await context.params
  if (!z.uuid().safeParse(userId).success) {
    return NextResponse.json({ error: 'not_available' }, { status: 404, headers: NO_STORE_HEADERS })
  }

  try {
    const { client, context: memberContext } = await loadMemberContext()
    const membership = selectedMembership(memberContext)
    if (!membership || membership.status !== 'active') {
      return NextResponse.json(
        { error: 'not_available' },
        { status: 404, headers: NO_STORE_HEADERS },
      )
    }
    const result = await getMemberProfile(
      membership.membershipId,
      userId,
      createPeopleRepository(client),
    )
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404, headers: NO_STORE_HEADERS })
    }
    const avatarUrl = result.profile.identity.avatarPath
      ? createAvatarStorageRepository(client).publicUrl(result.profile.identity.avatarPath)
      : null
    return NextResponse.json(
      { profile: result.profile, avatarUrl },
      { status: 200, headers: NO_STORE_HEADERS },
    )
  } catch (error) {
    Sentry.captureException(error, { tags: { scope: 'people-profile-preview' } })
    return NextResponse.json(
      { error: 'preview_unavailable' },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }
}

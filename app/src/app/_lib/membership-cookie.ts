import 'server-only'
import { cookies } from 'next/headers'
import { z } from 'zod'

export const MEMBERSHIP_COOKIE = 'bc_membership_id'

export async function readMembershipPreference(): Promise<string | undefined> {
  const value = (await cookies()).get(MEMBERSHIP_COOKIE)?.value
  const parsed = z.guid().safeParse(value)
  return parsed.success ? parsed.data : undefined
}

export async function setMembershipPreference(membershipId: string): Promise<void> {
  const parsed = z.guid().parse(membershipId)
  ;(await cookies()).set(MEMBERSHIP_COOKIE, parsed, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
}

export async function clearMembershipPreference(): Promise<void> {
  ;(await cookies()).delete(MEMBERSHIP_COOKIE)
}

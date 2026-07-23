import 'server-only'

import { createAdminClient } from '@/db/admin'
import { createInviteVerificationRepository } from '@/db/repositories/invites'
import { verifyInviteToken } from '@/lib/invite/verify'

export function verifyInviteFromServer(token: string) {
  return verifyInviteToken(token, createInviteVerificationRepository(createAdminClient()))
}

export async function createInvitedAuthUser(email: string, password: string) {
  return createAdminClient().auth.admin.createUser({ email, password, email_confirm: true })
}

export async function deleteAuthUser(userId: string) {
  await createAdminClient().auth.admin.deleteUser(userId)
}

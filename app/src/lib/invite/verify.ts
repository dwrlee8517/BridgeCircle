import type { InviteVerificationRepository, VerifyResult } from './contracts'

export async function verifyInviteToken(
  token: string,
  repository: InviteVerificationRepository,
): Promise<VerifyResult> {
  if (token.length < 32 || token.length > 512) {
    return { ok: false, error: 'not_found' }
  }
  return repository.verify(token)
}

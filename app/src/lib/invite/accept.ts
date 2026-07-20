import type { AcceptInviteResult, InviteAcceptanceRepository } from './contracts'

export async function acceptInvite(
  token: string,
  repository: InviteAcceptanceRepository,
): Promise<AcceptInviteResult> {
  if (token.length < 32 || token.length > 512) {
    return { ok: false, error: 'not_found' }
  }
  return repository.accept(token)
}

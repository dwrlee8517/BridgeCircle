import type {
  MembershipDecisionInput,
  MembershipDecisionRepository,
  MembershipDecisionRequest,
  MembershipDecisionResult,
} from './contracts'

export function decideMembership(
  repository: MembershipDecisionRepository,
  input: MembershipDecisionRequest,
): Promise<MembershipDecisionResult> {
  const privateNote = input.privateNote?.trim() || null
  let command: MembershipDecisionInput

  if (input.decision === 'approve') {
    if (input.reasonCode || privateNote) {
      return Promise.resolve({ ok: false, error: 'invalid_reason', membershipStatus: null })
    }
    command = { membershipId: input.membershipId, decision: 'approve' }
  } else {
    if (!input.reasonCode || (privateNote?.length ?? 0) > 4_000) {
      return Promise.resolve({ ok: false, error: 'invalid_reason', membershipStatus: null })
    }
    command = {
      membershipId: input.membershipId,
      decision: 'reject',
      reasonCode: input.reasonCode,
      privateNote,
    }
  }

  return repository.decide(command)
}

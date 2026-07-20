import type {
  MembershipDecision,
  MembershipDecisionRepository,
  MembershipDecisionResult,
} from './contracts'

export type DecideInput = { membershipId: string; decision: MembershipDecision }

export function decideMembership(
  repository: MembershipDecisionRepository,
  input: DecideInput,
): Promise<MembershipDecisionResult> {
  return repository.decide(input.membershipId, input.decision)
}

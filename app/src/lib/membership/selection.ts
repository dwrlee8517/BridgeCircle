import type { MemberContext } from '@/db/repositories/member-context'

export type MemberContextMembership = MemberContext['memberships'][number]

export function selectedMembership(context: MemberContext): MemberContextMembership | null {
  if (!context.selectedMembershipId) return null
  return (
    context.memberships.find(
      (membership) => membership.membershipId === context.selectedMembershipId,
    ) ?? null
  )
}

export function selectableMemberships(context: MemberContext): MemberContextMembership[] {
  return context.memberships.filter(
    (membership) => membership.status === 'active' || membership.status === 'pending',
  )
}

export type MemberDestination =
  | 'cancel-delete'
  | 'select-circle'
  | 'onboarding'
  | 'pending-approval'
  | 'member-shell'
  | 'reject-session'

export function memberDestination(context: MemberContext): MemberDestination {
  if (
    context.accountState === 'deletion_scheduled' &&
    !context.deleteInitiatedByAdmin &&
    !context.deletedAt
  ) {
    return 'cancel-delete'
  }
  if (context.accountState !== 'active') return 'reject-session'
  if (context.requiresCircleChoice) return 'select-circle'

  const membership = selectedMembership(context)
  if (!membership) return 'reject-session'
  if (!context.onboardingCompletedAt) return 'onboarding'
  if (membership.status === 'pending') return 'pending-approval'
  if (membership.status === 'active') return 'member-shell'
  return 'reject-session'
}

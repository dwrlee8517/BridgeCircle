import { getMemberContext } from '@/db/repositories/member-context'
import { builder } from '../builder'

/**
 * `Member` — the hub entity, re-pointed onto v2. v2 is membership-centric and
 * RPC-based, so the node is keyed by `membershipId` and sourced from the
 * `get_my_member_context` repository (the typed wrapper over the RPC). The
 * lightweight profile on the selected membership is enough for `me`; richer
 * fields (via `get_member_profile`) land with the profile-detail slice.
 */
export type MemberRecord = {
  membershipId: string
  userId: string
  displayName: string | null
  preferredName: string | null
  avatarPath: string | null
  graduationYear: number | null
  bio: string | null
  organizationName: string
}

export const MemberRef = builder.objectRef<MemberRecord>('Member')

MemberRef.implement({
  description: 'A member of an organization — the hub entity of the graph.',
  fields: (t) => ({
    // v2 identity is the membership; expose the raw user id alongside it.
    id: t.exposeID('membershipId', { nullable: false }),
    userId: t.exposeID('userId', { nullable: false }),
    displayName: t.exposeString('displayName', { nullable: true }),
    preferredName: t.exposeString('preferredName', { nullable: true }),
    // Prefer the chosen name; fall back to the display name.
    name: t.string({ nullable: true, resolve: (m) => m.preferredName ?? m.displayName }),
    avatarPath: t.exposeString('avatarPath', { nullable: true }),
    graduationYear: t.exposeInt('graduationYear', { nullable: true }),
    bio: t.exposeString('bio', { nullable: true }),
    organizationName: t.exposeString('organizationName', { nullable: false }),
  }),
})

builder.queryFields((t) => ({
  /** The signed-in member (their selected membership), or null when anon. */
  me: t.field({
    type: MemberRef,
    nullable: true,
    resolve: async (_root, _args, ctx): Promise<MemberRecord | null> => {
      if (!ctx.session) return null
      const context = await getMemberContext(ctx.supabase)
      const selected =
        context.memberships.find((m) => m.membershipId === context.selectedMembershipId) ??
        context.memberships[0]
      if (!selected) return null
      return {
        membershipId: selected.membershipId,
        userId: ctx.session.userId,
        displayName: selected.profile.displayName,
        preferredName: selected.profile.preferredName,
        avatarPath: selected.profile.avatarPath,
        graduationYear: selected.profile.graduationYear,
        bio: selected.profile.bio,
        organizationName: selected.organization.name,
      }
    },
  }),
}))

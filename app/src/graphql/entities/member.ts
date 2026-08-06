import type { MemberRecord } from '@/lib/members/loadMembersByIds'
import { builder } from '../builder'

/**
 * `Member` — the composed identity entity and hub of the graph (see the
 * entity/edge map). Backed today by `base_profiles`; the org overlay,
 * availability, and relationship connections (asks, events, friends) attach in
 * Phase 1.
 */
export const MemberRef = builder.objectRef<MemberRecord>('Member')

MemberRef.implement({
  description: 'A member of an organization — the hub entity of the graph.',
  fields: (t) => ({
    id: t.exposeID('userId'),
    name: t.exposeString('name', { nullable: true }),
    preferredName: t.exposeString('preferredName', { nullable: true }),
    // Prefer the chosen display name; fall back to the canonical name.
    displayName: t.string({
      nullable: true,
      resolve: (m) => m.preferredName ?? m.name,
    }),
    headline: t.exposeString('headline', { nullable: true }),
    employer: t.exposeString('currentEmployer', { nullable: true }),
    title: t.exposeString('currentTitle', { nullable: true }),
    city: t.exposeString('city', { nullable: true }),
    university: t.exposeString('university', { nullable: true }),
    major: t.exposeString('major', { nullable: true }),
    avatarUrl: t.exposeString('avatarUrl', { nullable: true }),
  }),
})

builder.queryFields((t) => ({
  /** The signed-in member, or null when unauthenticated. */
  me: t.field({
    type: MemberRef,
    nullable: true,
    resolve: (_root, _args, ctx) =>
      ctx.session ? ctx.loaders.memberById.load(ctx.session.userId) : null,
  }),
  /** A member by id. Returns null when RLS hides the row from the viewer. */
  member: t.field({
    type: MemberRef,
    nullable: true,
    args: { id: t.arg.id({ required: true }) },
    resolve: (_root, args, ctx) => ctx.loaders.memberById.load(String(args.id)),
  }),
}))

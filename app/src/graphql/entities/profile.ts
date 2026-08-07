import type {
  MemberProfile,
  MemberProfileEducation,
  MemberProfileExperience,
  MemberProfileLink,
} from '@/lib/people/contracts'
import { builder } from '../builder'

/**
 * Profile detail — the `/profile/[id]` surface, re-pointed onto v2. The
 * `memberProfile` query delegates to `ctx.loaders.memberProfileByUserId` (the
 * DataLoader over `db/repositories/people.getMemberProfile`), so repeated
 * lookups of the same person within a request coalesce. Enums are uppercased
 * from the v2 string values; the relationship union is flattened to a single
 * object with a `state` enum plus nullable durable ids.
 */

const ProfileLinkKind = builder.enumType('ProfileLinkKind', {
  values: ['LINKEDIN', 'PORTFOLIO', 'WEBSITE', 'SOCIAL', 'EMAIL', 'OTHER'] as const,
})

const ProfileLinkAudience = builder.enumType('ProfileLinkAudience', {
  values: ['ORGANIZATION', 'CONNECTIONS', 'SELF'] as const,
})

const SharedContextKind = builder.enumType('SharedContextKind', {
  values: ['SAME_CITY', 'SAME_SCHOOL'] as const,
})

const RelationshipState = builder.enumType('RelationshipState', {
  values: ['SELF', 'NONE', 'PENDING_OUTGOING', 'PENDING_INCOMING', 'CONNECTED'] as const,
})

const ProfileIdentity = builder.objectRef<MemberProfile['identity']>('ProfileIdentity')
ProfileIdentity.implement({
  fields: (t) => ({
    displayName: t.exposeString('displayName', { nullable: false }),
    preferredName: t.exposeString('preferredName', { nullable: true }),
    avatarPath: t.exposeString('avatarPath', { nullable: true }),
    graduationYear: t.exposeInt('graduationYear', { nullable: true }),
  }),
})

const ProfileCurrent = builder.objectRef<MemberProfile['current']>('ProfileCurrent')
ProfileCurrent.implement({
  fields: (t) => ({
    headline: t.exposeString('headline', { nullable: true }),
    employer: t.exposeString('employer', { nullable: true }),
    title: t.exposeString('title', { nullable: true }),
    industry: t.exposeString('industry', { nullable: true }),
    city: t.exposeString('city', { nullable: true }),
  }),
})

const ProfileExperience = builder.objectRef<MemberProfileExperience>('ProfileExperience')
ProfileExperience.implement({
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    employer: t.exposeString('employer', { nullable: false }),
    title: t.exposeString('title', { nullable: false }),
    startYear: t.exposeInt('startYear', { nullable: true }),
    startMonth: t.exposeInt('startMonth', { nullable: true }),
    endYear: t.exposeInt('endYear', { nullable: true }),
    endMonth: t.exposeInt('endMonth', { nullable: true }),
    description: t.exposeString('description', { nullable: true }),
  }),
})

const ProfileEducation = builder.objectRef<MemberProfileEducation>('ProfileEducation')
ProfileEducation.implement({
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    school: t.exposeString('school', { nullable: false }),
    degree: t.exposeString('degree', { nullable: true }),
    field: t.exposeString('field', { nullable: true }),
    startYear: t.exposeInt('startYear', { nullable: true }),
    startMonth: t.exposeInt('startMonth', { nullable: true }),
    endYear: t.exposeInt('endYear', { nullable: true }),
    endMonth: t.exposeInt('endMonth', { nullable: true }),
    description: t.exposeString('description', { nullable: true }),
  }),
})

const ProfileLink = builder.objectRef<MemberProfileLink>('ProfileLink')
ProfileLink.implement({
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    kind: t.field({
      type: ProfileLinkKind,
      nullable: false,
      resolve: (l) => l.kind.toUpperCase() as Uppercase<MemberProfileLink['kind']>,
    }),
    label: t.exposeString('label', { nullable: true }),
    value: t.exposeString('value', { nullable: false }),
    audience: t.field({
      type: ProfileLinkAudience,
      nullable: false,
      resolve: (l) => l.audience.toUpperCase() as Uppercase<MemberProfileLink['audience']>,
    }),
  }),
})

const ProfileHelp = builder.objectRef<MemberProfile['help']>('ProfileHelp')
ProfileHelp.implement({
  fields: (t) => ({
    openToHelp: t.exposeBoolean('openToHelp', { nullable: false }),
    topics: t.exposeStringList('topics', { nullable: false }),
  }),
})

const ProfileRelationship = builder.objectRef<MemberProfile['relationship']>('ProfileRelationship')
ProfileRelationship.implement({
  description: 'Viewer-relative relationship. Durable ids are set only in the matching state.',
  fields: (t) => ({
    state: t.field({
      type: RelationshipState,
      nullable: false,
      resolve: (r) => r.state.toUpperCase() as Uppercase<MemberProfile['relationship']['state']>,
    }),
    requestId: t.string({ nullable: true, resolve: (r) => r.requestId }),
    conversationId: t.string({ nullable: true, resolve: (r) => r.conversationId }),
  }),
})

const SharedContext = builder.objectRef<MemberProfile['sharedContext'][number]>('SharedContext')
SharedContext.implement({
  fields: (t) => ({
    kind: t.field({
      type: SharedContextKind,
      nullable: false,
      resolve: (s) =>
        s.kind.toUpperCase() as Uppercase<MemberProfile['sharedContext'][number]['kind']>,
    }),
    value: t.exposeString('value', { nullable: false }),
  }),
})

export const MemberProfileRef = builder.objectRef<MemberProfile>('MemberProfile')
MemberProfileRef.implement({
  description: "A member's full profile as seen by the viewer (privacy-redacted server-side).",
  fields: (t) => ({
    membershipId: t.exposeID('membershipId', { nullable: false }),
    userId: t.exposeID('userId', { nullable: false }),
    identity: t.field({ type: ProfileIdentity, nullable: false, resolve: (p) => p.identity }),
    current: t.field({ type: ProfileCurrent, nullable: false, resolve: (p) => p.current }),
    about: t.exposeString('about', { nullable: true }),
    experiences: t.field({
      type: [ProfileExperience],
      nullable: { list: false, items: false },
      resolve: (p) => p.experiences,
    }),
    education: t.field({
      type: [ProfileEducation],
      nullable: { list: false, items: false },
      resolve: (p) => p.education,
    }),
    skills: t.exposeStringList('skills', { nullable: false }),
    links: t.field({
      type: [ProfileLink],
      nullable: { list: false, items: false },
      resolve: (p) => p.links,
    }),
    help: t.field({ type: ProfileHelp, nullable: false, resolve: (p) => p.help }),
    relationship: t.field({
      type: ProfileRelationship,
      nullable: false,
      resolve: (p) => p.relationship,
    }),
    sharedContext: t.field({
      type: [SharedContext],
      nullable: { list: false, items: false },
      resolve: (p) => p.sharedContext,
    }),
    updatedAt: t.exposeString('updatedAt', { nullable: false }),
  }),
})

builder.queryFields((t) => ({
  /** A member's profile detail by user id, or null when RLS hides it / it's
   * unavailable. Batched + request-cached via the memberProfile DataLoader. */
  memberProfile: t.field({
    type: MemberProfileRef,
    nullable: true,
    args: { userId: t.arg.id({ required: true }) },
    resolve: (_root, { userId }, ctx) =>
      ctx.session ? ctx.loaders.memberProfileByUserId.load(String(userId)) : null,
  }),
}))

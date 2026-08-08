import { getMemberContext } from '@/db/repositories/member-context'
import { createPeopleRepository } from '@/db/repositories/people'
import type {
  PeopleDirectoryItem,
  PeopleDirectoryResult,
  PeopleMatchEvidence,
  PeopleScope,
} from '@/lib/people/contracts'
import { builder } from '../builder'
import { ProfileRelationship } from './profile'

/**
 * People directory search — the `/people` surface, re-pointed onto v2. Delegates
 * to `db/repositories/people.list` (the `list_people` RPC): a bounded, ranked
 * top-N, NOT a cursor page — so it's modeled honestly as `PeopleSearchResult
 * { items, totalCount, capped }`, not a Relay connection. The viewer's
 * membership is resolved server-side; the client never supplies it.
 */

const PeopleScopeEnum = builder.enumType('PeopleScope', {
  values: ['ALL', 'OPEN_TO_HELP', 'IN_CIRCLE'] as const,
})

const PeopleMatchEvidenceKind = builder.enumType('PeopleMatchEvidenceKind', {
  values: [
    'DIRECTORY',
    'CURRENT_ROLE',
    'PROFILE',
    'CAREER_HISTORY',
    'EDUCATION_HISTORY',
    'BIO',
    'SKILLS',
    'HELPER_TOPICS',
    'CAREER_PATH_SUMMARY',
    'HELP_TOPICS_SUMMARY',
  ] as const,
})

const PeopleFiltersInput = builder.inputType('PeopleFiltersInput', {
  fields: (t) => ({
    industry: t.string({ required: false }),
    classYearStart: t.int({ required: false }),
    classYearEnd: t.int({ required: false }),
    location: t.string({ required: false }),
    employer: t.string({ required: false }),
    education: t.string({ required: false }),
    topic: t.string({ required: false }),
  }),
})

const MatchEvidenceRef = builder.objectRef<PeopleMatchEvidence>('PeopleMatchEvidence')
MatchEvidenceRef.implement({
  fields: (t) => ({
    kind: t.field({
      type: PeopleMatchEvidenceKind,
      nullable: false,
      resolve: (e) => e.kind.toUpperCase() as Uppercase<PeopleMatchEvidence['kind']>,
    }),
    title: t.exposeString('title', { nullable: true }),
    organization: t.exposeString('organization', { nullable: true }),
    sourceSection: t.exposeString('sourceSection', { nullable: true }),
  }),
})

const PeopleDirectoryItemRef = builder.objectRef<PeopleDirectoryItem>('PeopleDirectoryItem')
PeopleDirectoryItemRef.implement({
  description: 'A ranked directory result for the viewer, from bounded People search.',
  fields: (t) => ({
    membershipId: t.exposeID('membershipId', { nullable: false }),
    userId: t.exposeID('userId', { nullable: false }),
    displayName: t.exposeString('displayName', { nullable: false }),
    preferredName: t.exposeString('preferredName', { nullable: true }),
    avatarPath: t.exposeString('avatarPath', { nullable: true }),
    headline: t.exposeString('headline', { nullable: true }),
    currentEmployer: t.exposeString('currentEmployer', { nullable: true }),
    currentTitle: t.exposeString('currentTitle', { nullable: true }),
    industry: t.exposeString('industry', { nullable: true }),
    city: t.exposeString('city', { nullable: true }),
    graduationYear: t.exposeInt('graduationYear', { nullable: true }),
    openToHelp: t.exposeBoolean('openToHelp', { nullable: false }),
    helperTopics: t.exposeStringList('helperTopics', { nullable: false }),
    // Reuses the profile relationship shape (directory items never carry 'self').
    relationship: t.field({
      type: ProfileRelationship,
      nullable: false,
      resolve: (item) => item.relationship,
    }),
    matchEvidence: t.field({
      type: [MatchEvidenceRef],
      nullable: { list: false, items: false },
      resolve: (item) => item.matchEvidence,
    }),
    rankScore: t.exposeFloat('rankScore', { nullable: false }),
    profileUpdatedAt: t.exposeString('profileUpdatedAt', { nullable: false }),
  }),
})

const PeopleSearchResultRef = builder.objectRef<PeopleDirectoryResult>('PeopleSearchResult')
PeopleSearchResultRef.implement({
  description:
    'A bounded, ranked People search result. `capped` is true when more matched than returned.',
  fields: (t) => ({
    items: t.field({
      type: [PeopleDirectoryItemRef],
      nullable: { list: false, items: false },
      resolve: (r) => r.items,
    }),
    totalCount: t.exposeInt('totalCount', { nullable: false }),
    capped: t.exposeBoolean('capped', { nullable: false }),
  }),
})

const DEFAULT_LIMIT = 25
const MAX_LIMIT = 50

const EMPTY: PeopleDirectoryResult = { items: [], totalCount: 0, capped: false }

builder.queryFields((t) => ({
  /** Bounded, ranked People directory search for the viewer's org. Empty when
   * unauthenticated or the viewer has no active membership. */
  peopleSearch: t.field({
    type: PeopleSearchResultRef,
    nullable: false,
    args: {
      scope: t.arg({ type: PeopleScopeEnum, required: false }),
      query: t.arg.string({ required: false }),
      filters: t.arg({ type: PeopleFiltersInput, required: false }),
      first: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, ctx): Promise<PeopleDirectoryResult> => {
      if (!ctx.session) return EMPTY
      const context = await getMemberContext(ctx.supabase)
      const membershipId =
        context.selectedMembershipId ?? context.memberships[0]?.membershipId ?? null
      if (!membershipId) return EMPTY

      const scope = (args.scope?.toLowerCase() ?? 'all') as PeopleScope
      const limit = Math.min(Math.max(args.first ?? DEFAULT_LIMIT, 1), MAX_LIMIT)

      return createPeopleRepository(ctx.supabase).list({
        membershipId,
        query: args.query ?? null,
        scope,
        filters: {
          industry: args.filters?.industry ?? null,
          classYearStart: args.filters?.classYearStart ?? null,
          classYearEnd: args.filters?.classYearEnd ?? null,
          location: args.filters?.location ?? null,
          employer: args.filters?.employer ?? null,
          education: args.filters?.education ?? null,
          topic: args.filters?.topic ?? null,
        },
        // NL query embedding is a server-side matching concern, not part of the
        // public search input; the directory path passes none.
        queryEmbedding: null,
        limit,
      })
    },
  }),
}))

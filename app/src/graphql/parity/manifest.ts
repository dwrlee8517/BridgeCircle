/**
 * Parity manifest — the contract the integration-test harness diffs against.
 *
 * Each entry pairs a GraphQL operation with the v2 `db/repositories/*` function
 * it delegates to. The harness runs the GraphQL operation over HTTP
 * (`/api/graphql`, bearer auth) and calls the repository function directly, both
 * as the SAME authenticated user, then asserts equivalence per `shapeNotes`.
 * See `docs/architecture/graphql-parity.md` for the full protocol.
 *
 * Re-pointed onto v2: main's rebuild removed the pre-v2 tables/lib this migration
 * originally targeted, so entries now map to the v2 repository layer.
 */

export type ParityOperation = {
  feature: string
  kind: 'query' | 'mutation'
  /** GraphQL root field name. */
  name: string
  /** A runnable operation document. */
  document: string
  variables?: Record<string, unknown>
  lib: {
    /** Import path of the equivalent v2 repository function. */
    module: string
    fn: string
    /** How GraphQL args + session map onto the repository call. */
    argsNote: string
  }
  /** Shape/semantics notes the diff must account for. */
  shapeNotes: string
}

export const PARITY_MANIFEST: ParityOperation[] = [
  {
    feature: 'members',
    kind: 'query',
    name: 'me',
    document: `query { me { id userId displayName preferredName name avatarPath graduationYear bio organizationName } }`,
    lib: {
      module: '@/db/repositories/member-context',
      fn: 'getMemberContext',
      argsNote:
        'getMemberContext(db) → pick membership where membershipId === selectedMembershipId (else first). Member.id = membershipId; userId from session.',
    },
    shapeNotes:
      'Fields come from the selected membership: displayName/preferredName/avatarPath/graduationYear/bio from membership.profile, organizationName from membership.organization.name. name = preferredName ?? displayName (derived). null when unauthenticated or no membership.',
  },
  {
    feature: 'people',
    kind: 'query',
    name: 'memberProfile',
    document: `query ($userId: ID!) { memberProfile(userId: $userId) { membershipId userId identity { displayName graduationYear } current { headline employer } about experiences { id employer title } education { id school } skills links { kind value audience } help { openToHelp topics } relationship { state requestId conversationId } sharedContext { kind value } updatedAt } }`,
    variables: { userId: '<target-user-id>' },
    lib: {
      module: '@/db/repositories/people',
      fn: 'createPeopleRepository(db).getMemberProfile',
      argsNote:
        'viewerMembershipId = getMemberContext(db) selected membership; getMemberProfile(viewerMembershipId, userId). GraphQL routes this through the memberProfileByUserId DataLoader — same result, deduped per request.',
    },
    shapeNotes:
      'Returns the MemberProfile on { ok: true }, null on { ok: false, error: "not_available" } (RLS / unavailable). Enums uppercased: link.kind/audience, sharedContext.kind, relationship.state (self→SELF … connected→CONNECTED). relationship union flattened to { state, requestId, conversationId } with durable ids only in the matching state.',
  },
  {
    feature: 'people',
    kind: 'query',
    name: 'peopleSearch',
    document: `query ($scope: PeopleScope, $query: String, $filters: PeopleFiltersInput, $first: Int) { peopleSearch(scope: $scope, query: $query, filters: $filters, first: $first) { totalCount capped items { membershipId userId displayName openToHelp helperTopics relationship { state } matchEvidence { kind } rankScore } } }`,
    variables: { scope: 'ALL', first: 25 },
    lib: {
      module: '@/db/repositories/people',
      fn: 'createPeopleRepository(db).list',
      argsNote:
        'membershipId = getMemberContext(db) selected membership; list({ membershipId, query: query ?? null, scope: scope.toLowerCase() ?? "all", filters: {…7 keys, absent → null}, queryEmbedding: null, limit: clamp(first ?? 25, 1..50) }).',
    },
    shapeNotes:
      'Bounded ranked top-N — NOT paginated. { items, totalCount, capped } maps 1:1 to the repo result. scope enum ALL/OPEN_TO_HELP/IN_CIRCLE → all/open_to_help/in_circle; matchEvidence.kind + relationship.state uppercased; relationship reuses ProfileRelationship (never SELF here). Empty result when unauthenticated / no membership. GraphQL passes no queryEmbedding.',
  },
]

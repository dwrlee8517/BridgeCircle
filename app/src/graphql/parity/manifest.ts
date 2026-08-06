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
]

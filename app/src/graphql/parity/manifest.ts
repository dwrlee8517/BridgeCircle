/**
 * Parity manifest — the contract the integration-test harness diffs against.
 *
 * Each entry pairs a GraphQL operation with the `/lib` function it delegates
 * to. The harness runs the GraphQL operation over HTTP (`/api/graphql`, bearer
 * auth) and calls the `/lib` function directly, both as the SAME authenticated
 * user, then asserts equivalence per `shapeNotes`. See
 * `docs/architecture/graphql-parity.md` for the full protocol.
 *
 * This file is the single source of truth for what has been migrated. Add an
 * entry when a slice lands; remove the legacy path only once its entry is green
 * and its last caller is migrated.
 */

export type ParityOperation = {
  /** Feature slice this operation belongs to. */
  feature: string
  kind: 'query' | 'mutation'
  /** GraphQL root field name. */
  name: string
  /** A runnable operation document. */
  document: string
  /** Example variables, if the operation takes any. */
  variables?: Record<string, unknown>
  lib: {
    /** Import path of the equivalent `/lib` function. */
    module: string
    fn: string
    /** How GraphQL args + session map onto the `/lib` call. */
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
    document: `query { me { id displayName name preferredName headline employer title city university major avatarUrl } }`,
    lib: {
      module: '@/lib/members/loadMembersByIds',
      fn: 'loadMembersByIds',
      argsNote: 'loadMembersByIds(db, [session.userId]) → .get(session.userId) ?? null',
    },
    shapeNotes:
      'camelCase already. displayName = preferredName ?? name (derived, no /lib field). null when unauthenticated or RLS hides the row.',
  },
  {
    feature: 'members',
    kind: 'query',
    name: 'member',
    document: `query ($id: ID!) { member(id: $id) { id displayName headline } }`,
    variables: { id: '<user-id>' },
    lib: {
      module: '@/lib/members/loadMembersByIds',
      fn: 'loadMembersByIds',
      argsNote: 'loadMembersByIds(db, [id]) → .get(id) ?? null',
    },
    shapeNotes: 'null when RLS hides the row (cross-org). Same camelCase fields as `me`.',
  },
  {
    feature: 'openAsks',
    kind: 'query',
    name: 'myOpenAsk',
    document: `query { myOpenAsk { id question createdAt expiresAt } }`,
    lib: {
      module: '@/lib/asks/openAsks',
      fn: 'getOpenAskForUser',
      argsNote: 'getOpenAskForUser(db, { userId: session.userId })',
    },
    shapeNotes:
      'Field-for-field equal to the /lib OpenAsk. createdAt/expiresAt are the same ISO-8601 strings (exposed as String). null when no open ask.',
  },
  {
    feature: 'openAsks',
    kind: 'mutation',
    name: 'createOpenAsk',
    document: `mutation ($question: String!) { createOpenAsk(question: $question) { openAsk { id question createdAt expiresAt } error } }`,
    variables: { question: 'Looking for a PM mentor in fintech' },
    lib: {
      module: '@/lib/asks/openAsks',
      fn: 'createOpenAsk',
      argsNote:
        'organizationId = getActiveOrganizationId(db, session.userId); createOpenAsk(db, { userId: session.userId, organizationId, question })',
    },
    shapeNotes:
      'payload.openAsk ↔ result.openAsk. payload.error = result.error.toUpperCase() (INVALID_QUESTION|ALREADY_OPEN|INSERT_FAILED). GraphQL-only guards NOT_AUTHENTICATED / NO_MEMBERSHIP have no /lib equivalent — test them separately (unauth request, or member with no active org).',
  },
  {
    feature: 'openAsks',
    kind: 'mutation',
    name: 'closeOpenAsk',
    document: `mutation ($openAskId: ID!, $reason: OpenAskCloseReason!) { closeOpenAsk(openAskId: $openAskId, reason: $reason) }`,
    variables: { openAskId: '<open-ask-id>', reason: 'MEMBER_CLOSED' },
    lib: {
      module: '@/lib/asks/openAsks',
      fn: 'closeOpenAsk',
      argsNote:
        'closeOpenAsk(db, { userId: session.userId, openAskId, reason }); enum MEMBER_CLOSED→"member_closed", RESOLVED→"resolved"',
    },
    shapeNotes:
      'Boolean, identical. false when nothing was closed (wrong id / not owner / already closed).',
  },
  {
    feature: 'events',
    kind: 'query',
    name: 'event',
    document: `query ($id: ID!) { event(id: $id) { id title description location startsAt publishedAt goingCount waitlistCount capacity viewerRsvp } }`,
    variables: { id: '<event-id>' },
    lib: {
      module: '@/lib/events/getEvent',
      fn: 'getEvent',
      argsNote: 'getEvent(db, id, session.userId)',
    },
    shapeNotes:
      "GraphQL exposes the EventRow subset of getEvent's EventDetail (no endsAt/isPast/isCanceled/createdBy yet). viewerRsvp is enum-cased (going → GOING). null when RLS hides the event.",
  },
  {
    feature: 'events',
    kind: 'query',
    name: 'eventsConnection',
    document: `query ($first: Int, $after: String) { eventsConnection(first: $first, after: $after) { edges { cursor node { id startsAt viewerRsvp } } pageInfo { hasNextPage endCursor } } }`,
    variables: { first: 20 },
    lib: {
      module: '@/lib/events/listEvents',
      fn: 'listEvents',
      argsNote:
        'organizationId = getActiveOrganizationId(db, session.userId); listEvents(db, organizationId, session.userId, { includePast: false })',
    },
    shapeNotes:
      'Pagination is NEW (no /lib cursor equivalent) — diff CONTENTS, not pageInfo: page through the whole connection and compare the concatenated edge nodes (set + order) to listEvents(...). Both are upcoming published events for the org, ordered by starts_at then id. Node is the EventRow subset; viewerRsvp enum-cased.',
  },
  {
    feature: 'events',
    kind: 'mutation',
    name: 'respondRsvp',
    document: `mutation ($eventId: ID!, $status: RsvpResponse!) { respondRsvp(eventId: $eventId, status: $status) { status error } }`,
    variables: { eventId: '<event-id>', status: 'GOING' },
    lib: {
      module: '@/lib/events/respondRsvp',
      fn: 'respondRsvp',
      argsNote:
        'respondRsvp(getAppOrigin(), session.userId, session.email, { eventId, status: GOING→"going" | NOT_GOING→"not_going" })',
    },
    shapeNotes:
      'SIDE-EFFECTING: respondRsvp uses the admin client and sends email (confirmation, waitlist promotion) — run against a seeded DB with Resend in test mode, and compare BOTH payload.status (enum-cased resolved status, may be WAITLISTED) AND the resulting event_rsvps row state. payload.error = result.error.toUpperCase() (EVENT_NOT_FOUND | DB_ERROR). GraphQL-only NOT_AUTHENTICATED guard has no /lib equivalent. Input enum RsvpResponse is GOING|NOT_GOING only; WAITLISTED is derived, never submitted.',
  },
]

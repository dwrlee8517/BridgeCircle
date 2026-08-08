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
  {
    feature: 'help',
    kind: 'query',
    name: 'helpHome',
    document: `query { helpHome { membershipId organizationId activeAskCount activeAskLimit openToHelp pausedAt pauseReason helperTopics } }`,
    lib: {
      module: '@/db/repositories/help',
      fn: 'createHelpRepository(db).getHome',
      argsNote: 'membershipId = getMemberContext(db) selected membership; getHome(membershipId).',
    },
    shapeNotes:
      'Scalar fields map 1:1 to HelpHome. The list projections (recentAsks, directRequests, suggestedAsks) are NOT exposed yet — diff only the scalar/topic fields. null when unauthenticated / no membership.',
  },
  {
    feature: 'help',
    kind: 'query',
    name: 'ask',
    document: `query ($id: ID!) { ask(id: $id) { id kind status question requestMessage reach anonymousUntilAccepted asker { isAnonymous displayName userId } recipient { displayName userId } offerCount conversationId acceptedAt endedAt expiresAt createdAt } }`,
    variables: { id: '<ask-id>' },
    lib: {
      module: '@/db/repositories/help',
      fn: 'createHelpRepository(db).getAskDetail',
      argsNote: 'getAskDetail(id) — RLS scopes visibility; no membership arg.',
    },
    shapeNotes:
      "kind/status/reach uppercased. asker/recipient flatten v2's identified|anonymous union into HelpProfile with isAnonymous; userId/headline/avatarPath are null for anonymous asks (the privacy contract). offerCount = offers.length; nested offers[] and history[] are NOT exposed yet.",
  },
  {
    feature: 'help',
    kind: 'query',
    name: 'myAsksConnection',
    document: `query ($first: Int, $after: String) { myAsksConnection(first: $first, after: $after) { edges { cursor node { id status question createdAt } } pageInfo { hasNextPage endCursor } } }`,
    variables: { first: 20 },
    lib: {
      module: '@/db/repositories/help',
      fn: 'createHelpRepository(db).listMyAsks',
      argsNote:
        "membershipId = selected membership; listMyAsks({ membershipId, cursor: decodeHelpCursor(after), limit: min(first, 50) }). GraphQL reuses v2's OWN cursor codec (lib/help/cursors), so edge.cursor === encodeHelpCursor({createdAt,id}) of the node.",
    },
    shapeNotes:
      'TRUE cursor connection (v2 already pages Help). Forward-only — the RPC has no backward mode, so last/before are not supported. Diff page contents against successive listMyAsks calls threading the same cursor; edge.cursor should equal the repo cursor for that row.',
  },
  {
    feature: 'help',
    kind: 'mutation',
    name: 'createDirectAsk',
    document: `mutation ($recipientMembershipId: ID!, $question: String!, $requestMessage: String!, $clientRequestId: String!) { createDirectAsk(recipientMembershipId: $recipientMembershipId, question: $question, requestMessage: $requestMessage, clientRequestId: $clientRequestId) { status askId activeCount created } }`,
    variables: {
      recipientMembershipId: '<recipient-membership-id>',
      question: 'How did you move from consulting into product?',
      requestMessage: 'Would value 20 minutes if you have it.',
      clientRequestId: '<uuid-v4, REUSE across retries>',
    },
    lib: {
      module: '@/db/repositories/help',
      fn: 'createHelpRepository(db).createDirectAsk',
      argsNote:
        'membershipId = getMemberContext(db) selected membership (never client-supplied); createDirectAsk({ membershipId, recipientMembershipId, question, requestMessage, clientRequestId }).',
    },
    shapeNotes:
      'SIDE-EFFECTING + IDEMPOTENT. status uppercased from v2 (CREATED|EXISTING|IDEMPOTENCY_CONFLICT|ACTIVE_LIMIT_REACHED|HELPER_LIMIT_REACHED|INVALID_INPUT|NOT_AVAILABLE) — do NOT collapse to a boolean; the two *_LIMIT_REACHED statuses are the capacity valves and need explicit coverage (seed a member at the active-ask cap). Replaying the same clientRequestId must return EXISTING (created:false), not a second ask; reusing the key with different inputs returns IDEMPOTENCY_CONFLICT. Seed the DB and diff both payload and the resulting asks row. Unauthenticated / no membership → NOT_AVAILABLE (GraphQL-only guard, no repo call).',
  },
  {
    feature: 'help',
    kind: 'mutation',
    name: 'createCircleAsk',
    document: `mutation ($question: String!, $reach: HelpReachInput!, $anonymousUntilAccepted: Boolean!, $clientRequestId: String!) { createCircleAsk(question: $question, reach: $reach, anonymousUntilAccepted: $anonymousUntilAccepted, clientRequestId: $clientRequestId) { status askId activeCount created } }`,
    variables: {
      question: 'Anyone worked in climate policy?',
      reach: 'MATCHED',
      anonymousUntilAccepted: true,
      clientRequestId: '<uuid-v4, REUSE across retries>',
    },
    lib: {
      module: '@/db/repositories/help',
      fn: 'createHelpRepository(db).createCircleAsk',
      argsNote:
        'membershipId = selected membership; createCircleAsk({ membershipId, question, reach: reach.toLowerCase(), anonymousUntilAccepted, clientRequestId }).',
    },
    shapeNotes:
      "Same idempotency + status semantics as createDirectAsk. reach enum MATCHED|ORGANIZATION → matched|organization. anonymousUntilAccepted drives whether later reads expose the asker identity — cross-check against the ask query's HelpProfile.isAnonymous.",
  },
  {
    feature: 'help',
    kind: 'mutation',
    name: 'respondToDirectAsk',
    document: `mutation ($askId: ID!, $decision: AskDecisionInput!, $openingMessage: String, $declineReasonCode: AskDeclineReason, $declineNote: String, $clientNonce: String) { respondToDirectAsk(askId: $askId, decision: $decision, openingMessage: $openingMessage, declineReasonCode: $declineReasonCode, declineNote: $declineNote, clientNonce: $clientNonce) { status askId conversationId } }`,
    variables: { askId: '<ask-id>', decision: 'ACCEPT' },
    lib: {
      module: '@/db/repositories/help',
      fn: 'createHelpRepository(db).respondToDirectAsk',
      argsNote:
        'respondToDirectAsk({ askId, decision: ACCEPT→accept|DECLINE→decline, openingMessage ?? null, declineReasonCode: lowercased ?? null, declineNote ?? null, clientNonce ?? null }). No membership arg — RLS scopes it.',
    },
    shapeNotes:
      'ACCEPT opens a conversation → conversationId is non-null; DECLINE leaves it null. Re-deciding returns ALREADY_DECIDED (not an error). Diff payload AND the asks/conversations rows.',
  },
  {
    feature: 'help',
    kind: 'mutation',
    name: 'retractAsk',
    document: `mutation ($askId: ID!) { retractAsk(askId: $askId) { status askId conversationId } }`,
    variables: { askId: '<ask-id>' },
    lib: {
      module: '@/db/repositories/help',
      fn: 'createHelpRepository(db).retractAsk',
      argsNote: 'retractAsk(askId).',
    },
    shapeNotes: 'RETRACTED on success; ALREADY_DECIDED when the ask already ended.',
  },
  {
    feature: 'help',
    kind: 'mutation',
    name: 'resolveAsk',
    document: `mutation ($askId: ID!, $outcomeNote: String) { resolveAsk(askId: $askId, outcomeNote: $outcomeNote) { status askId conversationId } }`,
    variables: { askId: '<ask-id>', outcomeNote: 'Got what I needed, thank you.' },
    lib: {
      module: '@/db/repositories/help',
      fn: 'createHelpRepository(db).resolveAsk',
      argsNote: 'resolveAsk({ askId, outcomeNote: outcomeNote ?? null }).',
    },
    shapeNotes: 'RESOLVED on success; ALREADY_DECIDED when already ended.',
  },
  {
    feature: 'help',
    kind: 'mutation',
    name: 'offerToHelp',
    document: `mutation ($askId: ID!, $offerNote: String!, $clientRequestId: String!) { offerToHelp(askId: $askId, offerNote: $offerNote, clientRequestId: $clientRequestId) { status askId offerId created } }`,
    variables: {
      askId: '<circle-ask-id>',
      offerNote: 'I did this transition in 2021 — happy to talk.',
      clientRequestId: '<uuid-v4, REUSE across retries>',
    },
    lib: {
      module: '@/db/repositories/help',
      fn: 'createHelpRepository(db).offerToHelp',
      argsNote:
        'membershipId = selected membership; offerToHelp({ askId, membershipId, offerNote, clientRequestId }).',
    },
    shapeNotes:
      'Idempotent on clientRequestId (EXISTING on replay). offerId is null on IDEMPOTENCY_CONFLICT / INVALID_INPUT / NOT_AVAILABLE — the nullability is meaningful, not incidental.',
  },
  {
    feature: 'help',
    kind: 'mutation',
    name: 'decideOffer',
    document: `mutation ($offerId: ID!, $decision: AskDecisionInput!, $openingMessage: String, $declineReasonCode: OfferDeclineReason, $declineNote: String, $clientNonce: String) { decideOffer(offerId: $offerId, decision: $decision, openingMessage: $openingMessage, declineReasonCode: $declineReasonCode, declineNote: $declineNote, clientNonce: $clientNonce) { status askId offerId conversationId } }`,
    variables: { offerId: '<offer-id>', decision: 'ACCEPT' },
    lib: {
      module: '@/db/repositories/help',
      fn: 'createHelpRepository(db).decideOffer',
      argsNote:
        'decideOffer({ offerId, decision: ACCEPT→accept|DECLINE→decline, openingMessage ?? null, declineReasonCode: lowercased ?? null, declineNote ?? null, clientNonce ?? null }).',
    },
    shapeNotes:
      'Offer decline reasons are a DIFFERENT enum than ask declines (WENT_ANOTHER_DIRECTION|NOT_RIGHT_FIT|OTHER). ACCEPT opens a conversation. ALREADY_DECIDED on replay.',
  },
  {
    feature: 'help',
    kind: 'mutation',
    name: 'saveHelperPreferences',
    document: `mutation ($openToHelp: Boolean!, $topics: [String!]!) { saveHelperPreferences(openToHelp: $openToHelp, topics: $topics) { status openToHelp pausedAt pauseReason topics } }`,
    variables: { openToHelp: true, topics: ['product', 'climate'] },
    lib: {
      module: '@/db/repositories/help',
      fn: 'createHelpRepository(db).saveHelperPreferences',
      argsNote:
        'membershipId = selected membership; saveHelperPreferences({ membershipId, openToHelp, topics }).',
    },
    shapeNotes:
      'Returns the resulting state on BOTH success and failure (v2 echoes current prefs on invalid_input) — so diff every field, not just status. Topics are normalized server-side; compare as sets if order is unspecified. Cross-check against helpHome.openToHelp/helperTopics.',
  },
  {
    feature: 'messages',
    kind: 'query',
    name: 'messagesCounts',
    document: `query { messagesCounts { all unread myCircle openAsks waiting attention } }`,
    lib: {
      module: '@/db/repositories/messages',
      fn: 'createMessagesRepository(db).getCounts',
      argsNote: 'getCounts() — no args; RLS scopes it to the caller.',
    },
    shapeNotes: 'Field-for-field identical to MessagesCounts. null when unauthenticated.',
  },
  {
    feature: 'messages',
    kind: 'query',
    name: 'conversationsConnection',
    document: `query ($filter: MessagesFilter, $query: String, $first: Int, $after: String) { conversationsConnection(filter: $filter, query: $query, first: $first, after: $after) { edges { cursor node { conversationId kind unreadCount needsReply priority activityAt counterpart { userId displayName } } } pageInfo { hasNextPage endCursor } } }`,
    variables: { filter: 'ALL', first: 20 },
    lib: {
      module: '@/db/repositories/messages',
      fn: 'createMessagesRepository(db).listConversations',
      argsNote:
        'listConversations({ filter: filter.toLowerCase() ?? "all", query: query ?? null, cursor: decodeMessagesCursor(after), limit: min(first, 50) }).',
    },
    shapeNotes:
      'TRUE cursor connection over a THREE-part composite (priority, activityAt, conversationId) — encoded by lib/pagination/messages-cursor (new; v2 had no encoder because server actions passed the object in-process). Forward-only. A malformed/stale cursor decodes to null = page from the beginning, NOT an error — worth an explicit test. filter enum ALL|UNREAD|MY_CIRCLE|OPEN_ASKS → lowercased.',
  },
  {
    feature: 'messages',
    kind: 'query',
    name: 'conversation',
    document: `query ($id: ID!) { conversation(id: $id) { id kind askId canSend readOnlyReason connectionState canRequestConnection viewerLastReadMessageId latestMessageId } }`,
    variables: { id: '<conversation-id>' },
    lib: {
      module: '@/db/repositories/conversations',
      fn: 'createConversationRepository(db).getDetail',
      argsNote: 'getDetail(conversationId).',
    },
    shapeNotes:
      'Scalars map 1:1 to ConversationDetail; enums uppercased (readOnlyReason, connectionState, kind). counterpart/askContext sub-objects are NOT fully exposed yet — diff only the listed fields. null when RLS hides it.',
  },
  {
    feature: 'messages',
    kind: 'query',
    name: 'conversation.messagesConnection',
    document: `query ($id: ID!, $last: Int, $before: String) { conversation(id: $id) { messagesConnection(last: $last, before: $before) { edges { cursor node { id kind body createdAt senderUserId } } pageInfo { hasPreviousPage startCursor } } } }`,
    variables: { id: '<conversation-id>', last: 30 },
    lib: {
      module: '@/db/repositories/conversations',
      fn: 'createConversationRepository(db).listBefore',
      argsNote:
        'listBefore({ conversationId, beforeMessageId: before ? Number(before) : null, limit: min(last, 50) }), then REVERSE the rows (the RPC returns newest-first; the connection reads oldest-first).',
    },
    shapeNotes:
      "NESTED connection on Conversation. BACKWARD-only — last/before walks into older history (the chat idiom); forward paging is deliberately not exposed (catching up on new messages is realtime's job via listAfter, not a connection). Cursor is the numeric message id as a string. The user|system union is flattened: senderUserId set for USER, eventType/actorUserId for SYSTEM.",
  },
]

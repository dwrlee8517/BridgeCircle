import { printSchema } from 'graphql'
import { describe, expect, it } from 'vitest'
import { PARITY_MANIFEST } from './parity/manifest'
import { schema } from './schema'

// Building the schema exercises the Pothos builder + Relay/Dataloader plugins.
// If a type or field is misconfigured, `toSchema()` throws at import time, so
// this doubles as the "the graph compiles" smoke test.
describe('graphql schema', () => {
  const sdl = printSchema(schema)

  it('exposes the Member entity and the me query', () => {
    expect(sdl).toContain('type Member')
    expect(sdl).toContain('me: Member')
    const q = schema.getQueryType()?.getFields() ?? {}
    expect(String(q.me?.type)).toBe('Member')
  })

  it('exposes the profile-detail slice (memberProfile + nested types + enums)', () => {
    expect(sdl).toContain('type MemberProfile')
    expect(sdl).toContain('type ProfileExperience')
    expect(sdl).toContain('type ProfileRelationship')
    expect(sdl).toContain('enum RelationshipState')
    expect(sdl).toContain('enum ProfileLinkKind')

    const q = schema.getQueryType()?.getFields() ?? {}
    expect(String(q.memberProfile?.type)).toBe('MemberProfile')
    expect((q.memberProfile?.args ?? []).map((a) => a.name)).toContain('userId')
    // relationship is required and non-null on the profile.
    const rel = String(
      (
        schema.getType('MemberProfile') as { getFields?: () => Record<string, { type: unknown }> }
      )?.getFields?.()?.relationship?.type,
    )
    expect(rel).toBe('ProfileRelationship!')
  })

  it('exposes the People search slice (peopleSearch + result/item + enums)', () => {
    expect(sdl).toContain('type PeopleSearchResult')
    expect(sdl).toContain('type PeopleDirectoryItem')
    expect(sdl).toContain('type PeopleMatchEvidence')
    expect(sdl).toContain('enum PeopleScope')
    expect(sdl).toContain('input PeopleFiltersInput')

    const q = schema.getQueryType()?.getFields() ?? {}
    // Bounded result, not a connection — non-null PeopleSearchResult.
    expect(String(q.peopleSearch?.type)).toBe('PeopleSearchResult!')
    expect((q.peopleSearch?.args ?? []).map((a) => a.name)).toEqual(
      expect.arrayContaining(['scope', 'query', 'filters', 'first']),
    )
    // The directory item reuses the shared relationship type.
    const itemFields = (
      schema.getType('PeopleDirectoryItem') as {
        getFields?: () => Record<string, { type: unknown }>
      }
    )?.getFields?.()
    expect(String(itemFields?.relationship?.type)).toBe('ProfileRelationship!')
  })

  it('exposes the Help slice with a true cursor connection', () => {
    expect(sdl).toContain('type HelpHome')
    expect(sdl).toContain('type HelpAsk')
    expect(sdl).toContain('type HelpAskSummary')
    expect(sdl).toContain('type HelpAskConnection')
    expect(sdl).toContain('type HelpAskEdge')
    expect(sdl).toContain('enum HelpAskStatus')
    expect(sdl).toContain('enum HelpAskKind')

    const q = schema.getQueryType()?.getFields() ?? {}
    expect(String(q.helpHome?.type)).toBe('HelpHome')
    expect(String(q.ask?.type)).toBe('HelpAsk')
    expect(String(q.myAsksConnection?.type)).toMatch(/^HelpAskConnection!?$/)
    expect((q.myAsksConnection?.args ?? []).map((a) => a.name)).toEqual(
      expect.arrayContaining(['first', 'after']),
    )
  })

  it('flattens the anonymous/identified asker union behind isAnonymous', () => {
    const fields = (
      schema.getType('HelpProfile') as { getFields?: () => Record<string, { type: unknown }> }
    )?.getFields?.()
    expect(String(fields?.isAnonymous?.type)).toBe('Boolean!')
    // Identity-bearing fields stay nullable — they're null for anonymous asks.
    expect(String(fields?.userId?.type)).toBe('ID')
    expect(String(fields?.displayName?.type)).toBe('String!')
  })

  it('exposes the Help command surface with v2 status enums', () => {
    const m = schema.getMutationType()?.getFields() ?? {}
    expect(Object.keys(m)).toEqual(
      expect.arrayContaining([
        'createDirectAsk',
        'createCircleAsk',
        'respondToDirectAsk',
        'retractAsk',
        'resolveAsk',
        'offerToHelp',
        'decideOffer',
        'saveHelperPreferences',
      ]),
    )
    // Payloads are non-null: a command always reports a status.
    expect(String(m.createDirectAsk?.type)).toBe('CreateAskPayload!')
    expect(String(m.decideOffer?.type)).toBe('OfferDecisionPayload!')

    // v2's status vocabulary is preserved verbatim, not collapsed to a boolean.
    const createStatus = schema.getType('CreateAskStatus') as {
      getValues?: () => { name: string }[]
    }
    // Compare as a set — the schema orders enum values alphabetically.
    expect(
      createStatus
        ?.getValues?.()
        .map((v) => v.name)
        .sort(),
    ).toEqual(
      [
        'CREATED',
        'EXISTING',
        'IDEMPOTENCY_CONFLICT',
        // The capacity valves — surfaced, not collapsed into a generic failure.
        'ACTIVE_LIMIT_REACHED',
        'HELPER_LIMIT_REACHED',
        'INVALID_INPUT',
        'NOT_AVAILABLE',
      ].sort(),
    )
  })

  it('requires client-supplied idempotency keys on the create commands', () => {
    const m = schema.getMutationType()?.getFields() ?? {}
    for (const name of ['createDirectAsk', 'createCircleAsk', 'offerToHelp']) {
      const arg = (m[name]?.args ?? []).find((a) => a.name === 'clientRequestId')
      expect(String(arg?.type), `${name}.clientRequestId`).toBe('String!')
    }
  })

  it('keeps ask and offer decline reasons as distinct enums', () => {
    const askReasons = (
      schema.getType('AskDeclineReason') as { getValues?: () => { name: string }[] }
    )
      ?.getValues?.()
      .map((v) => v.name)
    const offerReasons = (
      schema.getType('OfferDeclineReason') as { getValues?: () => { name: string }[] }
    )
      ?.getValues?.()
      .map((v) => v.name)
    expect(askReasons).toContain('OUTSIDE_EXPERTISE')
    expect(offerReasons).toContain('WENT_ANOTHER_DIRECTION')
    expect(askReasons).not.toEqual(offerReasons)
  })

  it('exposes the Messages slice with inbox and nested history connections', () => {
    expect(sdl).toContain('type MessagesCounts')
    expect(sdl).toContain('type Conversation')
    expect(sdl).toContain('type ConversationConnection')
    expect(sdl).toContain('type ConversationMessageConnection')
    expect(sdl).toContain('enum MessagesFilter')

    const q = schema.getQueryType()?.getFields() ?? {}
    expect(String(q.conversation?.type)).toBe('Conversation')
    expect(String(q.messagesCounts?.type)).toBe('MessagesCounts')
    expect((q.conversationsConnection?.args ?? []).map((a) => a.name)).toEqual(
      expect.arrayContaining(['filter', 'query', 'first', 'after']),
    )

    // Message history is a NESTED connection on Conversation.
    const convFields = (
      schema.getType('Conversation') as {
        getFields?: () => Record<string, { type: unknown; args?: { name: string }[] }>
      }
    )?.getFields?.()
    const history = convFields?.messagesConnection
    expect(String(history?.type)).toMatch(/^ConversationMessageConnection!?$/)
    // Backward paging is the chat idiom — last/before must be present.
    expect((history?.args ?? []).map((a) => a.name)).toEqual(
      expect.arrayContaining(['last', 'before']),
    )
  })

  it('exposes the Messages commands with per-command status vocabularies', () => {
    const m = schema.getMutationType()?.getFields() ?? {}
    expect(String(m.startDirectConversation?.type)).toBe('StartConversationPayload!')
    expect(String(m.sendMessage?.type)).toBe('SendMessagePayload!')
    expect(String(m.markConversationRead?.type)).toBe('MarkReadPayload!')
    expect(String(m.publishTyping?.type)).toBe('PublishTypingPayload!')

    // sendMessage's idempotency key is client-supplied and required.
    const nonce = (m.sendMessage?.args ?? []).find((a) => a.name === 'clientNonce')
    expect(String(nonce?.type)).toBe('String!')

    // DUPLICATE (nonce replay) and RATE_LIMITED are first-class outcomes.
    const sendStatus = (
      schema.getType('SendMessageStatus') as { getValues?: () => { name: string }[] }
    )
      ?.getValues?.()
      .map((v) => v.name)
    expect(sendStatus).toEqual(
      expect.arrayContaining(['SENT', 'DUPLICATE', 'RATE_LIMITED', 'CONNECTION_REQUIRED']),
    )
  })

  it('exposes the School slice (hub, event detail, announcements, newsletter)', () => {
    expect(sdl).toContain('type SchoolHome')
    expect(sdl).toContain('type SchoolEventCard')
    expect(sdl).toContain('type SchoolEvent')
    expect(sdl).toContain('type SchoolEventAttendees')
    expect(sdl).toContain('type SchoolAnnouncement')
    expect(sdl).toContain('type NewsletterIssue')

    const q = schema.getQueryType()?.getFields() ?? {}
    expect(String(q.schoolHome?.type)).toBe('SchoolHome')
    expect(String(q.schoolEvent?.type)).toBe('SchoolEvent')
    expect(String(q.newsletterIssue?.type)).toBe('NewsletterIssue')
    // The archive is keyed by slug, not id.
    expect((q.newsletterIssue?.args ?? []).map((a) => a.name)).toContain('slug')

    // SchoolEvent extends the card: shares viewerRsvp, adds schedule/facts.
    const detail = (
      schema.getType('SchoolEvent') as { getFields?: () => Record<string, { type: unknown }> }
    )?.getFields?.()
    expect(String(detail?.viewerRsvp?.type)).toBe('SchoolRsvpStatus!')
    expect(String(detail?.schedule?.type)).toBe('[SchoolEventScheduleItem!]!')
    expect(String(detail?.facts?.type)).toBe('[SchoolEventFact!]!')
  })

  it('exposes the event-capacity state machine verbatim on the RSVP command', () => {
    const m = schema.getMutationType()?.getFields() ?? {}
    expect(String(m.respondToSchoolEvent?.type)).toBe('RespondSchoolEventPayload!')
    expect(String(m.markAnnouncementRead?.type)).toBe('MarkAnnouncementReadStatus!')

    const intents = (
      schema.getType('SchoolResponseIntent') as { getValues?: () => { name: string }[] }
    )
      ?.getValues?.()
      .map((v) => v.name)
    // The waitlist-offer flow is part of the intent vocabulary.
    expect(intents).toEqual(
      expect.arrayContaining(['GOING', 'JOIN_WAITLIST', 'ACCEPT_OFFER', 'PASS_OFFER']),
    )
    const results = (
      schema.getType('SchoolResponseResult') as { getValues?: () => { name: string }[] }
    )
      ?.getValues?.()
      .map((v) => v.name)
    // Capacity outcomes are first-class, not errors.
    expect(results).toEqual(expect.arrayContaining(['FULL', 'NOT_OFFERED', 'OFFER_EXPIRED']))
  })

  it('exposes the Connections commands (the DM gate)', () => {
    const m = schema.getMutationType()?.getFields() ?? {}
    expect(String(m.sendConnectionRequest?.type)).toBe('SendConnectionRequestPayload!')
    expect(String(m.respondToConnectionRequest?.type)).toBe('RespondConnectionPayload!')
    expect(String(m.disconnect?.type)).toBe('DisconnectPayload!')

    // Idempotency key required on send, like every create command.
    const key = (m.sendConnectionRequest?.args ?? []).find((a) => a.name === 'clientRequestId')
    expect(String(key?.type)).toBe('String!')

    // INCOMING_PENDING (a crossing request surfaces the other member's
    // pending request) is part of the vocabulary.
    const sendStatus = (
      schema.getType('SendConnectionRequestStatus') as { getValues?: () => { name: string }[] }
    )
      ?.getValues?.()
      .map((v) => v.name)
    expect(sendStatus).toEqual(
      expect.arrayContaining(['CREATED', 'EXISTING', 'INCOMING_PENDING', 'ALREADY_CONNECTED']),
    )

    // Accepting opens the conversation — the payload carries both ids.
    const respondFields = (
      schema.getType('RespondConnectionPayload') as {
        getFields?: () => Record<string, { type: unknown }>
      }
    )?.getFields?.()
    expect(String(respondFields?.connectionId?.type)).toBe('ID')
    expect(String(respondFields?.conversationId?.type)).toBe('ID')
  })

  it('exposes the Notifications slice with a keyset connection and prefs', () => {
    expect(sdl).toContain('type Notification')
    expect(sdl).toContain('type NotificationConnection')
    expect(sdl).toContain('type NotificationPreference')
    expect(sdl).toContain('type CommunicationPreferences')
    expect(sdl).toContain('type BlockedMember')

    const q = schema.getQueryType()?.getFields() ?? {}
    expect(String(q.notificationsConnection?.type)).toMatch(/^NotificationConnection!?$/)
    expect((q.notificationsConnection?.args ?? []).map((a) => a.name)).toEqual(
      expect.arrayContaining(['first', 'after', 'unreadOnly']),
    )

    // The type enum is derived from NOTIFICATION_TYPES — all 20 values, no drift.
    const typeEnum = (
      schema.getType('NotificationType') as { getValues?: () => { name: string }[] }
    )
      ?.getValues?.()
      .map((v) => v.name)
    expect(typeEnum).toHaveLength(20)
    expect(typeEnum).toEqual(
      expect.arrayContaining(['ASK_RECEIVED', 'MESSAGE_RECEIVED', 'EVENT_WAITLIST_SPOT_OPENED']),
    )

    const m = schema.getMutationType()?.getFields() ?? {}
    expect(String(m.markNotificationsRead?.type)).toBe('MarkNotificationsReadPayload!')
    expect(String(m.markAllNotificationsRead?.type)).toBe('MarkNotificationsReadPayload!')
    expect(String(m.saveNotificationPreference?.type)).toBe('SavePreferenceStatus!')
    expect(String(m.saveCommunicationPreferences?.type)).toBe('SaveCommunicationStatus!')
  })

  it('exposes the Account lifecycle slice', () => {
    expect(sdl).toContain('type AccountStatus')
    expect(sdl).toContain('type AccountExport')
    expect(sdl).toContain('enum AccountState')
    expect(sdl).toContain('enum AccountExportStatus')

    const q = schema.getQueryType()?.getFields() ?? {}
    expect(String(q.accountStatus?.type)).toBe('AccountStatus')
    expect(String(q.accountExport?.type)).toBe('AccountExport')
    // The download is a signed URL string — bucket/path never cross the graph.
    expect(String(q.accountExportDownloadUrl?.type)).toBe('String')
    expect(sdl).not.toContain('storageBucket')
    expect(sdl).not.toContain('storagePath')

    const m = schema.getMutationType()?.getFields() ?? {}
    expect(String(m.scheduleAccountDeletion?.type)).toBe('ScheduleDeletionPayload!')
    expect(String(m.cancelAccountDeletion?.type)).toBe('CancelDeletionPayload!')
    expect(String(m.requestAccountExport?.type)).toBe('AccountExport')
    expect(String(m.changeAccountEmail?.type)).toBe('ChangeEmailStatus!')

    // The export request keeps the house idempotency-key convention.
    const key = (m.requestAccountExport?.args ?? []).find((a) => a.name === 'clientRequestId')
    expect(String(key?.type)).toBe('String!')

    // TOO_LATE (worker already finalized) is a first-class outcome.
    const cancelStatus = (
      schema.getType('CancelDeletionStatus') as { getValues?: () => { name: string }[] }
    )
      ?.getValues?.()
      .map((v) => v.name)
    expect(cancelStatus).toEqual(
      expect.arrayContaining(['CANCELLED', 'ACTIVE', 'TOO_LATE', 'NOT_AVAILABLE']),
    )
  })
})

// Guard against manifest drift: every operation the parity harness expects must
// actually exist on the schema, or the test session builds against a lie.
describe('parity manifest', () => {
  const queryFields = schema.getQueryType()?.getFields() ?? {}
  const mutationFields = schema.getMutationType()?.getFields() ?? {}

  it.each(
    PARITY_MANIFEST.map((op) => [op.kind, op.name] as const),
  )('schema has %s field %s', (kind, name) => {
    const roots = kind === 'query' ? queryFields : mutationFields

    // Nested operations are named "rootField.childField" (e.g.
    // conversation.messagesConnection) — resolve through the root's type so
    // the guard covers nested connections, not just root fields.
    const [rootName, childName] = name.split('.')
    expect(Object.keys(roots)).toContain(rootName)
    if (!childName) return

    const rootType = String(roots[rootName as string]?.type).replace(/!$/, '')
    const childFields = (
      schema.getType(rootType) as { getFields?: () => Record<string, unknown> }
    )?.getFields?.()
    expect(Object.keys(childFields ?? {})).toContain(childName)
  })
})

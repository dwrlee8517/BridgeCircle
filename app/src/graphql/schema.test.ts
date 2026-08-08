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
})

// Guard against manifest drift: every operation the parity harness expects must
// actually exist on the schema, or the test session builds against a lie.
describe('parity manifest', () => {
  const queryFields = schema.getQueryType()?.getFields() ?? {}
  const mutationFields = schema.getMutationType()?.getFields() ?? {}

  it.each(
    PARITY_MANIFEST.map((op) => [op.kind, op.name] as const),
  )('schema has %s field %s', (kind, name) => {
    const fields = kind === 'query' ? queryFields : mutationFields
    expect(Object.keys(fields)).toContain(name)
  })
})

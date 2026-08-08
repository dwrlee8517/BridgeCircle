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

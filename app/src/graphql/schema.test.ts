import { printSchema } from 'graphql'
import { describe, expect, it } from 'vitest'
import { PARITY_MANIFEST } from './parity/manifest'
import { schema } from './schema'

// Building the schema exercises the Pothos builder + Relay/Dataloader plugins.
// If a type or field is misconfigured, `toSchema()` throws at import time, so
// this doubles as the "the graph compiles" smoke test.
describe('graphql schema', () => {
  const sdl = printSchema(schema)

  it('exposes the Member entity', () => {
    expect(sdl).toContain('type Member')
    expect(sdl).toContain('displayName: String')
    expect(sdl).toContain('avatarUrl: String')
  })

  it('exposes the Member root queries', () => {
    expect(sdl).toContain('me: Member')
    expect(sdl).toMatch(/member\(id: ID!\): Member/)
  })

  it('exposes the Open Asks slice (read + mutations)', () => {
    expect(sdl).toContain('type OpenAsk')
    expect(sdl).toContain('type CreateOpenAskPayload')
    expect(sdl).toContain('enum OpenAskError')
    expect(sdl).toContain('enum OpenAskCloseReason')

    // Assert field return types via the schema (robust to SDL line-wrapping).
    const q = schema.getQueryType()?.getFields() ?? {}
    const m = schema.getMutationType()?.getFields() ?? {}
    expect(String(q.myOpenAsk?.type)).toBe('OpenAsk')
    expect(String(m.createOpenAsk?.type)).toBe('CreateOpenAskPayload!')
    expect(String(m.closeOpenAsk?.type)).toBe('Boolean!')
  })

  it('exposes the Events slice with a Relay keyset connection', () => {
    expect(sdl).toContain('type Event')
    expect(sdl).toContain('type EventConnection')
    expect(sdl).toContain('type EventEdge')
    expect(sdl).toContain('enum RsvpStatus')

    const q = schema.getQueryType()?.getFields() ?? {}
    expect(String(q.event?.type)).toBe('Event')
    expect(String(q.eventsConnection?.type)).toMatch(/^EventConnection!?$/)
    // The connection exposes the Relay pagination args.
    expect((q.eventsConnection?.args ?? []).map((a) => a.name)).toEqual(
      expect.arrayContaining(['first', 'after', 'last', 'before']),
    )
  })

  it('exposes the RSVP mutation', () => {
    expect(sdl).toContain('type RespondRsvpPayload')
    expect(sdl).toContain('enum RsvpResponse')
    const m = schema.getMutationType()?.getFields() ?? {}
    expect(String(m.respondRsvp?.type)).toBe('RespondRsvpPayload!')
    expect((m.respondRsvp?.args ?? []).map((a) => a.name)).toEqual(
      expect.arrayContaining(['eventId', 'status']),
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
    const fields = kind === 'query' ? queryFields : mutationFields
    expect(Object.keys(fields)).toContain(name)
  })
})

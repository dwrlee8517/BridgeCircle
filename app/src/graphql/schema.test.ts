import { printSchema } from 'graphql'
import { describe, expect, it } from 'vitest'
import { schema } from './schema'

// Building the schema exercises the Pothos builder + Relay/Dataloader plugins.
// If a type or field is misconfigured, `toSchema()` throws at import time, so
// this doubles as the Phase 0 "the graph compiles" smoke test.
describe('graphql schema', () => {
  const sdl = printSchema(schema)

  it('exposes the Member entity', () => {
    expect(sdl).toContain('type Member')
    expect(sdl).toContain('displayName: String')
    expect(sdl).toContain('avatarUrl: String')
  })

  it('exposes the root queries for the Member slice', () => {
    expect(sdl).toContain('me: Member')
    expect(sdl).toMatch(/member\(id: ID!\): Member/)
  })
})

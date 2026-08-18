import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { PARITY_MANIFEST } from '@/graphql/parity/manifest'
import { teardownScope } from '../harness/resetDb'
import { SeedScope } from '../harness/seedScope'
import { PARITY_CASES, PARITY_PENDING } from './harness/parityCases'
import { graphqlAs, repositoryAs } from './harness/parityRunner'
import { buildParityWorld, type ParityWorld } from './harness/world'

/**
 * The parity harness ADR 0017 promised: every manifest operation run BOTH ways
 * as the same user against a real database, and diffed.
 *
 * Before this suite the manifest was checked only by `src/graphql/schema.test.ts`,
 * which asserts each entry's root field exists in the schema — a name-existence
 * guard that would pass just as happily against a resolver returning garbage.
 * Here the graph's answer has to equal the answer the app's own repository layer
 * gives the same person.
 */

const scope = new SeedScope()
let world: ParityWorld

beforeAll(async () => {
  world = await buildParityWorld(scope)
}, 120_000)
afterAll(async () => {
  await teardownScope(scope)
})

const key = (op: { kind: string; name: string }) => `${op.kind}:${op.name}`

/** Empty equals empty, so a case that returns nothing has tested nothing. */
function isSubstantive(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value as object).length > 0
  return true
}

describe('manifest coverage', () => {
  it('every manifest operation is either executed or explicitly pending', () => {
    const undeclared = PARITY_MANIFEST.filter(
      (op) => !(key(op) in PARITY_CASES) && !(key(op) in PARITY_PENDING),
    ).map(key)

    expect(
      undeclared,
      'A manifest entry with no parity case and no PARITY_PENDING reason. Add an executable case in parityCases.ts, or record why it cannot be diffed yet.',
    ).toEqual([])
  })

  it('no pending entry or case names an operation the manifest does not have', () => {
    const known = new Set(PARITY_MANIFEST.map(key))
    const stale = [...Object.keys(PARITY_CASES), ...Object.keys(PARITY_PENDING)].filter(
      (name) => !known.has(name),
    )

    expect(stale, 'Names a manifest operation that no longer exists — rename or remove.').toEqual(
      [],
    )
  })

  it('reports how much of the manifest is actually diffed', () => {
    const executed = PARITY_MANIFEST.filter((op) => key(op) in PARITY_CASES)
    // Not an assertion on the number — a visible ratchet. When a slice adds a
    // case, this line moves, and reviewers can see it move.
    // stderr, not console.log: vitest's reporter swallows the latter, which
    // would make this "report" report nothing.
    process.stderr.write(
      `parity: ${executed.length}/${PARITY_MANIFEST.length} manifest operations diffed ` +
        `(${Object.keys(PARITY_PENDING).length} pending)\n`,
    )
    expect(executed.length).toBeGreaterThan(0)
  })
})

describe('graphql ↔ repository parity', () => {
  for (const operation of PARITY_MANIFEST) {
    const parityCase = PARITY_CASES[key(operation)]
    if (!parityCase) continue

    it(`${operation.kind} ${operation.name} matches ${operation.lib.fn}`, async () => {
      const jar = parityCase.identity?.(world) ?? world.viewer.jar
      const variables = parityCase.variables?.(world) ?? operation.variables

      const graphqlData = await graphqlAs<Record<string, unknown>>(
        jar,
        operation.document,
        variables,
      )
      const repositoryResult = await repositoryAs(jar, (db) => parityCase.repository(world, db))

      const fromGraphql = parityCase.fromGraphql(graphqlData, world)
      const fromRepository = parityCase.fromRepository(repositoryResult as never, world)

      expect(fromGraphql, operation.shapeNotes).toEqual(fromRepository)

      if (!parityCase.allowEmpty) {
        expect(
          isSubstantive(fromGraphql),
          `Both sides were empty, so this case proved nothing. Give the world something for ${operation.name} to return, or set allowEmpty with the reason emptiness is correct here.`,
        ).toBe(true)
      }
    })
  }
})

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getMemberContext } from '@/db/repositories/member-context'
import { createNotificationRepository } from '@/db/repositories/notifications'
import { createPeopleRepository } from '@/db/repositories/people'
import type { PeopleScope } from '@/lib/people/contracts'
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

// biome-ignore lint/suspicious/noExplicitAny: narrowing untyped GraphQL data.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any

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

/**
 * Resolver argument defaults, which manifest-driven parity cannot reach.
 *
 * Every manifest document pins its variables, so `args.scope ?? 'all'` and
 * `args.unreadOnly ?? false` are dead code in that suite — mutating either
 * default leaves it green. These cases omit exactly one variable at a time and
 * pin the default the repository side is called with.
 *
 * Each test asserts its own discriminator first. A default is only observable
 * if the world can tell the two values apart; without that check these would
 * pass on a world where `all` and `circle` happen to return the same people,
 * which is precisely the state the fixture used to be in.
 */
describe('resolver argument defaults', () => {
  const NO_FILTERS = {
    industry: null,
    classYearStart: null,
    classYearEnd: null,
    location: null,
    employer: null,
    education: null,
    topic: null,
  }

  it('peopleSearch defaults scope to ALL when the argument is omitted', async () => {
    const jar = world.viewer.jar
    const membershipId = world.viewerMembershipId
    const document = PARITY_MANIFEST.find((op) => op.name === 'peopleSearch')?.document as string

    const search = (scope: PeopleScope) =>
      repositoryAs(jar, (db) =>
        createPeopleRepository(db).list({
          membershipId,
          query: null,
          scope,
          filters: NO_FILTERS,
          queryEmbedding: null,
          limit: 25,
        }),
      )

    // Discriminator: `stranger` is in the org but not in the viewer's circle,
    // so `all` and `in_circle` must disagree or this test proves nothing.
    const [all, circle] = await Promise.all([search('all'), search('in_circle')])
    expect(
      all.items.length,
      'all and in_circle returned the same people — the default under test is unobservable',
    ).toBeGreaterThan(circle.items.length)

    // `scope` omitted on purpose; `first` pinned so only one default is in play.
    const data = await graphqlAs<Record<string, Any>>(jar, document, { first: 25 })
    const ids = (value: { items: { membershipId: string }[] }) =>
      value.items.map((item) => item.membershipId)

    expect(ids(data.peopleSearch)).toEqual(ids(all))
  })

  it('notificationsConnection defaults unreadOnly to false when omitted', async () => {
    const jar = world.viewer.jar
    const document = PARITY_MANIFEST.find((op) => op.name === 'notificationsConnection')
      ?.document as string

    const list = (unreadOnly: boolean) =>
      repositoryAs(jar, (db) => createNotificationRepository(db).list({ limit: 30, unreadOnly }))

    // Discriminator: one notification is read, so the filter must change the set.
    const [everything, unread] = await Promise.all([list(false), list(true)])
    expect(
      everything.length,
      'no read notification in the world — the unreadOnly default is unobservable',
    ).toBeGreaterThan(unread.length)
    expect(everything.map((row) => row.id)).toContain(world.readNotificationId)

    // `unreadOnly` omitted on purpose.
    const data = await graphqlAs<Record<string, Any>>(jar, document, { first: 30 })
    const ids = data.notificationsConnection.edges.map((edge: Any) => edge.node.id)

    expect(ids).toEqual(everything.map((row) => row.id))
  })

  it('me picks the same membership as the repository for a two-organization member', async () => {
    const jar = world.multiOrgMember.jar

    const context = await repositoryAs(jar, (db) => getMemberContext(db))

    // Discriminator: with one membership, "selected" and "first" are the same
    // row and a wrong pick is invisible.
    const active = context.memberships.filter((m) => m.status === 'active')
    expect(active.length, 'multiOrgMember is not in two organizations').toBeGreaterThan(1)

    const expected =
      context.memberships.find((m) => m.membershipId === context.selectedMembershipId) ??
      context.memberships[0]

    const data = await graphqlAs<{ me: { id: string } | null }>(jar, 'query { me { id } }')

    expect(data.me?.id).toBe(expected?.membershipId)
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

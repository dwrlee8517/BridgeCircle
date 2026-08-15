import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseHelpCandidateRow } from '@/db/repositories/help'
import rawSnapshots from './__fixtures__/golden-candidate-snapshots.json'
import rawFixture from './__fixtures__/golden-search.json'
import {
  computeEnginePrint,
  evaluateCase,
  type IdentityIndex,
  lintFixture,
  parseGoldenFixture,
} from './golden'
import { findHelpCandidates } from './matching'

// Golden dataset, unit layer: replays captured api.search_help_candidates rows
// through the real TS pipeline (parser -> findHelpCandidates with null
// providers) and asserts through the shared evaluator — zero database. What
// this proves: the TS layer preserves the SQL contract (parsing, passthrough
// scoring, five-slot slice, merge). SQL correctness itself is owned by
// `pnpm eval:search` against the live local stack.

const appRoot = join(__dirname, '../../..')

const snapshots = rawSnapshots as {
  enginePrint: string
  identity: {
    membershipByEmail: Record<string, string>
    topicHolders: Record<string, string[]>
    neverEligible: string[]
  }
  cases: Record<string, { viewerMembershipId: string; rows: unknown[] }>
}

const identity: IdentityIndex = {
  membershipByEmail: new Map(Object.entries(snapshots.identity.membershipByEmail)),
  topicHolders: new Map(
    Object.entries(snapshots.identity.topicHolders).map(([topic, holders]) => [
      topic,
      new Set(holders),
    ]),
  ),
  neverEligible: new Set(snapshots.identity.neverEligible),
}

const emailByMembership = new Map(
  Object.entries(snapshots.identity.membershipByEmail).map(([email, id]) => [id, email]),
)

const fixture = parseGoldenFixture(rawFixture)
const unitCases = fixture.cases.filter((caseDef) => caseDef.layers.includes('unit'))

describe('golden dataset (unit layer)', () => {
  it('snapshots are fresh — enginePrint matches the corpus, fixture, and migration', async () => {
    // Keep this file list in sync with enginePrintFiles() in
    // scripts/eval-help-search.ts.
    const migrationsDir = join(appRoot, 'supabase/migrations')
    const migration = readdirSync(migrationsDir).find((name) =>
      name.endsWith('_help_search_deterministic_baseline.sql'),
    )
    const files = [
      join(appRoot, 'supabase/seeds/eval-org.sql'),
      join(appRoot, 'src/lib/help/__fixtures__/golden-search.json'),
      ...(migration ? [join(migrationsDir, migration)] : []),
    ]
    const print = await computeEnginePrint(
      files.map((path) => [path, readFileSync(path, 'utf8')] as const),
    )
    expect(
      print,
      'golden snapshots are stale — run `pnpm db:reset && pnpm eval:search --capture`',
    ).toBe(snapshots.enginePrint)
  })

  it('the fixture passes the consistency lint against the captured identity', () => {
    expect(lintFixture(fixture, identity)).toEqual([])
  })

  for (const caseDef of unitCases) {
    it(`replays: ${caseDef.id}`, async () => {
      const snapshot = snapshots.cases[caseDef.id]
      expect(snapshot, `no snapshot for ${caseDef.id} — re-run --capture`).toBeDefined()
      const rows = snapshot.rows.map((row) => parseHelpCandidateRow(row))

      const run = async () =>
        (
          await findHelpCandidates(
            {
              membershipId: snapshot.viewerMembershipId,
              question: caseDef.question,
              signal: new AbortController().signal,
            },
            {
              repository: { searchCandidates: async () => rows },
              embeddings: null,
              reranker: null,
            },
          )
        ).candidates.map((candidate) => ({
          membershipId: candidate.membershipId,
          email: emailByMembership.get(candidate.membershipId) ?? null,
        }))

      const result = evaluateCase(caseDef, [await run(), await run()], identity)
      expect(result.hardFailures).toEqual([])
      if (!caseDef.fail_ok) {
        expect(result.expectationFailures).toEqual([])
      }
      expect(result.passed).toBe(true)
    })
  }
})

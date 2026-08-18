// Golden-dataset eval runner for Help candidate search.
//
//   pnpm eval:search                          pass/fail, per-regime table
//   pnpm eval:search --case <id>              run one case
//   pnpm eval:search --scoreboard --engine X  also write output/eval/help-search-X-<date>.json
//   pnpm eval:search --capture                write unit-layer row snapshots + enginePrint
//
// Runs every case in app/src/lib/help/__fixtures__/golden-search.json against
// the REAL api.search_help_candidates RPC on the local stack. Per case it opens
// a psql transaction, impersonates the viewer exactly the way the pgTAP suite
// does (set_config('request.jwt.claim.sub', ...) + set local role
// authenticated), captures the rows, rolls back, and asserts through the shared
// evaluator in src/lib/help/golden.ts. LOCAL ONLY — refuses non-local DB URLs.
//
// Exit codes: 0 pass · 1 case failures · 2 precondition/lint failure.

import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  type CaseResult,
  computeEnginePrint,
  evaluateCase,
  type GoldenCase,
  type IdentityIndex,
  lintFixture,
  parseGoldenFixture,
  type ResolvedRow,
  summarize,
} from '../src/lib/help/golden'

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const EVAL_ORG_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
const RETRIEVAL_LIMIT = 40
const FIXTURE_PATH = join(appRoot, 'src/lib/help/__fixtures__/golden-search.json')
const SNAPSHOT_PATH = join(appRoot, 'src/lib/help/__fixtures__/golden-candidate-snapshots.json')
const SEED_PATH = join(appRoot, 'supabase/seeds/eval-org.sql')

const dbUrl = process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
if (!/127\.0\.0\.1|localhost/.test(dbUrl)) {
  console.error('eval:search runs against the LOCAL stack only; refusing non-local SUPABASE_DB_URL')
  process.exit(2)
}

const args = process.argv.slice(2)
const flag = (name: string) => args.includes(name)
const option = (name: string): string | null => {
  const index = args.indexOf(name)
  return index >= 0 && index + 1 < args.length ? args[index + 1] : null
}
const onlyCase = option('--case')
const scoreboard = flag('--scoreboard')
const capture = flag('--capture')
const engine = option('--engine') ?? 'unnamed'

function psql(sql: string): string {
  return execFileSync('psql', [dbUrl, '--no-psqlrc', '-v', 'ON_ERROR_STOP=1', '-tA', '-c', sql], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
}

// --- Preconditions ---------------------------------------------------------

// The corpus is opt-in (it no longer auto-loads on db reset). An entirely
// absent org is auto-seeded so eval:search keeps its zero-setup property; a
// present-but-partial org is NOT silently rebuilt — that shape usually means
// someone is mid-edit on the corpus, and measuring a mutated corpus without
// saying so is worse than failing.
function evalMemberCount(): number {
  return Number(
    psql(
      `select count(*) from public.organization_memberships where organization_id = '${EVAL_ORG_ID}'`,
    ).trim(),
  )
}

let memberCount = evalMemberCount()
if (memberCount === 0) {
  console.error('Evalfield School corpus absent — seeding it now (pnpm seed:eval)...')
  execFileSync('bash', [join(appRoot, 'scripts/seed-eval.sh')], {
    stdio: 'inherit',
    env: { ...process.env, SUPABASE_DB_URL: dbUrl },
  })
  memberCount = evalMemberCount()
}
if (!Number.isFinite(memberCount) || memberCount < 1000) {
  console.error(
    `Evalfield School corpus missing or partial (${memberCount} members). Fix: pnpm seed:eval`,
  )
  process.exit(2)
}

// --- Identity index --------------------------------------------------------

type IdentityRow = {
  email: string
  user_id: string
  membership_id: string
  topics: string[] | null
  never_eligible: boolean
}

const identityRows: IdentityRow[] = JSON.parse(
  psql(`
    select coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb)
    from (
      select
        u.email,
        om.user_id,
        om.id as membership_id,
        (select array_agg(ht.name) from public.helper_topics ht where ht.organization_membership_id = om.id) as topics,
        (hp.organization_membership_id is null or hp.open_to_help = false) as never_eligible
      from public.organization_memberships om
      join auth.users u on u.id = om.user_id
      left join public.helper_preferences hp on hp.organization_membership_id = om.id
      where om.organization_id = '${EVAL_ORG_ID}'
    ) r
  `).trim(),
)

const membershipByEmail = new Map<string, string>()
const emailByMembership = new Map<string, string>()
const userByEmail = new Map<string, string>()
const topicHolders = new Map<string, Set<string>>()
const neverEligible = new Set<string>()
for (const row of identityRows) {
  membershipByEmail.set(row.email, row.membership_id)
  emailByMembership.set(row.membership_id, row.email)
  userByEmail.set(row.email, row.user_id)
  if (row.never_eligible) neverEligible.add(row.membership_id)
  for (const topic of row.topics ?? []) {
    const holders = topicHolders.get(topic) ?? new Set<string>()
    holders.add(row.membership_id)
    topicHolders.set(topic, holders)
  }
}
const identity: IdentityIndex = { membershipByEmail, topicHolders, neverEligible }

// --- Fixture + lint --------------------------------------------------------

const fixture = parseGoldenFixture(JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')))
const lintErrors = lintFixture(fixture, identity)
if (lintErrors.length > 0) {
  console.error('golden-search.json failed the consistency lint:')
  for (const error of lintErrors) console.error(`  [${error.caseId ?? 'fixture'}] ${error.message}`)
  process.exit(2)
}

// --- Case execution --------------------------------------------------------

type RawRun = Record<string, unknown>[]

function runCase(caseDef: GoldenCase): { runs: ResolvedRow[][]; raw: RawRun } {
  const viewerUser = userByEmail.get(caseDef.viewer)
  const viewerMembership = membershipByEmail.get(caseDef.viewer)
  if (!viewerUser || !viewerMembership) throw new Error(`viewer not in corpus: ${caseDef.viewer}`)
  const wantsSecondRun =
    caseDef.expect.kind === 'stable' || caseDef.expect.also?.kind === 'stable'
  const call = `select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb)
    from api.search_help_candidates('${viewerMembership}'::uuid, $goldenq$${caseDef.question}$goldenq$, null, ${RETRIEVAL_LIMIT}) c;`
  const output = psql(`
    begin;
    select set_config('request.jwt.claim.sub', '${viewerUser}', true);
    set local role authenticated;
    ${call}
    ${wantsSecondRun ? call : ''}
    rollback;
  `)
  const jsonLines = output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('[') || line.startsWith('[]'))
  const runs = jsonLines.map((line) => {
    const rows = JSON.parse(line) as RawRun
    return rows.map((row) => ({
      membershipId: String(row.helper_membership_id),
      email: emailByMembership.get(String(row.helper_membership_id)) ?? null,
    }))
  })
  return { runs, raw: (JSON.parse(jsonLines[0] ?? '[]') as RawRun) ?? [] }
}

const cases = fixture.cases.filter((caseDef) => (onlyCase ? caseDef.id === onlyCase : true))
if (cases.length === 0) {
  console.error(onlyCase ? `no case with id '${onlyCase}'` : 'fixture has no cases')
  process.exit(2)
}

const results: CaseResult[] = []
const perCase: Array<{ caseDef: GoldenCase; result: CaseResult; raw: RawRun }> = []
for (const caseDef of cases) {
  const { runs, raw } = runCase(caseDef)
  const result = evaluateCase(caseDef, runs, identity)
  results.push(result)
  perCase.push({ caseDef, result, raw })
}

// --- Reporting -------------------------------------------------------------

console.log(`engine under test: ${engine} · ${cases.length} case(s) · corpus ${memberCount} members\n`)
for (const { result } of perCase) {
  const badge = result.passed ? (result.failOk && result.expectationFailures.length > 0 ? 'MISS(ok)' : 'PASS') : 'FAIL'
  console.log(`${badge.padEnd(8)} ${result.caseId}`)
  for (const failure of result.hardFailures) console.log(`         HARD: ${failure}`)
  for (const failure of result.expectationFailures) console.log(`         ${failure}`)
}

console.log('\nper-regime:')
for (const summary of summarize(results)) {
  const ledger = summary.expectedMisses > 0 ? ` · expected misses ${summary.expectedMisses}` : ''
  const hard = summary.hardFailureCount > 0 ? ` · HARD FAILURES ${summary.hardFailureCount}` : ''
  console.log(`  ${summary.regime.padEnd(18)} ${summary.passed}/${summary.total}${ledger}${hard}`)
}

// --- Scoreboard / capture --------------------------------------------------

// Files that determine engine-visible behavior of the corpus + labels. Any
// future migration that replaces search_help_candidates must be added here AND
// in matching-golden.test.ts (both call computeEnginePrint on the same list).
function enginePrintFiles(): string[] {
  const migrationsDir = join(appRoot, 'supabase/migrations')
  const migration = readdirSync(migrationsDir).find((name) =>
    name.endsWith('_help_search_deterministic_baseline.sql'),
  )
  return [SEED_PATH, FIXTURE_PATH, ...(migration ? [join(migrationsDir, migration)] : [])]
}

async function finish(): Promise<never> {
  const enginePrintValue = await computeEnginePrint(
    enginePrintFiles().map((path) => [path, readFileSync(path, 'utf8')] as const),
  )

  if (scoreboard) {
  const outDir = join(appRoot, 'output/eval')
  mkdirSync(outDir, { recursive: true })
  const date = new Date().toISOString().slice(0, 10)
  const path = join(outDir, `help-search-${engine}-${date}.json`)
  writeFileSync(
    path,
    `${JSON.stringify(
      {
        engine,
        date,
        corpusMembers: memberCount,
        enginePrint: enginePrintValue,
        regimes: summarize(results),
        cases: perCase.map(({ caseDef, result, raw }) => ({
          id: caseDef.id,
          regime: caseDef.regime,
          passed: result.passed,
          failOk: result.failOk,
          hardFailures: result.hardFailures,
          expectationFailures: result.expectationFailures,
          top5: raw.slice(0, 5).map((row) => ({
            email: emailByMembership.get(String(row.helper_membership_id)) ?? null,
            row,
          })),
        })),
      },
      null,
      2,
    )}\n`,
  )
  console.log(`\nscoreboard written: ${path}`)
}

if (capture) {
  const unitCases = perCase.filter(({ caseDef }) => caseDef.layers.includes('unit'))
  writeFileSync(
    SNAPSHOT_PATH,
    `${JSON.stringify(
      {
        $comment:
          'Generated by `pnpm eval:search --capture`. Raw api.search_help_candidates rows per unit-layer golden case, replayed by matching-golden.test.ts with zero DB. The identity block is the slim IdentityIndex the evaluator needs (emails, topic holders, never-eligible members). enginePrint guards staleness — when it mismatches, re-run the capture.',
        enginePrint: enginePrintValue,
        capturedAt: new Date().toISOString(),
        identity: {
          membershipByEmail: Object.fromEntries(membershipByEmail),
          topicHolders: Object.fromEntries(
            Array.from(topicHolders, ([topic, holders]) => [topic, Array.from(holders).sort()]),
          ),
          neverEligible: Array.from(neverEligible).sort(),
        },
        cases: Object.fromEntries(
          unitCases.map(({ caseDef, raw }) => [
            caseDef.id,
            { viewerMembershipId: membershipByEmail.get(caseDef.viewer), rows: raw },
          ]),
        ),
      },
      null,
      2,
    )}\n`,
  )
  // Same convention as db:types:local — generated files are biome-formatted
  // so `biome ci` stays green.
  execFileSync('pnpm', ['exec', 'biome', 'format', '--write', SNAPSHOT_PATH], { stdio: 'ignore' })
  console.log(`\nsnapshots written: ${SNAPSHOT_PATH} (${unitCases.length} unit-layer cases)`)
}

  const failed = results.some((result) => !result.passed)
  process.exit(failed ? 1 : 0)
}

finish().catch((error) => {
  console.error(error)
  process.exit(2)
})

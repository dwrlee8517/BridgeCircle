/**
 * Renders the CI coverage dashboard.
 *
 * Reads the `json-summary` output each test tier writes, and prints a markdown
 * table. CI pipes it into `$GITHUB_STEP_SUMMARY` (shown on the workflow run
 * page) and into a sticky PR comment.
 *
 * Both tiers are measured over the SAME `include` globs (see the two vitest
 * configs), so the columns are directly comparable: unit covers `/lib` depth,
 * integration covers the action and route surface on top of it.
 *
 * Usage:
 *   tsx scripts/coverage-report.ts \
 *     --tier "Unit=coverage/unit/coverage-summary.json" \
 *     --tier "Integration=coverage/integration/coverage-summary.json"
 *
 * A tier whose file is missing renders as "not run" rather than failing — a
 * docs-only PR skips the test jobs, and the report should still render.
 */
import { readFileSync } from 'node:fs'

type Metric = { total: number; covered: number; pct: number }
type Totals = Record<'lines' | 'statements' | 'branches' | 'functions', Metric>
type Tier = { name: string; totals: Totals | null }

// Floors enforced by the integration ratchet (vitest.integration.config.ts).
// Mirrored here only for display — the gate itself is vitest's.
const INTEGRATION_FLOORS: Record<string, number> = {
  lines: 10,
  statements: 9,
  branches: 7,
  functions: 8,
}

function readTier(spec: string): Tier {
  const separator = spec.indexOf('=')
  const name = spec.slice(0, separator)
  const file = spec.slice(separator + 1)
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8'))
    return { name, totals: parsed.total as Totals }
  } catch {
    return { name, totals: null }
  }
}

function pct(value: number): string {
  return `${value.toFixed(2)}%`
}

function bar(value: number): string {
  // Ten cells. A coarse visual so trends are readable at a glance without
  // pulling in a badge service.
  const filled = Math.round((value / 100) * 10)
  return '█'.repeat(filled) + '░'.repeat(10 - filled)
}

function table(tiers: Tier[]): string {
  const metrics = ['lines', 'statements', 'branches', 'functions'] as const
  const header = `| Metric | ${tiers.map((t) => t.name).join(' | ')} | Floor |`
  const divider = `|---|${tiers.map(() => '---').join('|')}|---|`

  const rows = metrics.map((metric) => {
    const cells = tiers.map((tier) => {
      if (!tier.totals) return '_not run_'
      const m = tier.totals[metric]
      return `${pct(m.pct)} <sub>(${m.covered}/${m.total})</sub>`
    })
    const floor = INTEGRATION_FLOORS[metric]
    return `| **${metric[0].toUpperCase()}${metric.slice(1)}** | ${cells.join(' | ')} | ${floor}% |`
  })

  return [header, divider, ...rows].join('\n')
}

function main(): void {
  const specs = process.argv
    .slice(2)
    .map((arg, index, all) => (all[index - 1] === '--tier' ? arg : null))
    .filter((value): value is string => value !== null)

  if (specs.length === 0) {
    console.error('usage: coverage-report.ts --tier "Name=path/to/coverage-summary.json" ...')
    process.exit(1)
  }

  const tiers = specs.map(readTier)
  const integration = tiers.find((t) => t.name.toLowerCase().startsWith('integration'))

  const lines = ['## Test coverage', '', table(tiers), '']

  if (integration?.totals) {
    const l = integration.totals.lines
    lines.push(
      `Integration lines: \`${bar(l.pct)}\` ${pct(l.pct)}`,
      '',
      '<sub>Both tiers measure the same files (server actions, route handlers, and `src/lib`), so the columns are comparable. The floor column is the ratchet enforced on the integration tier — raise it in the PR that raises coverage.</sub>',
    )
  } else {
    lines.push('<sub>Integration tier did not run for this commit.</sub>')
  }

  console.log(lines.join('\n'))
}

main()

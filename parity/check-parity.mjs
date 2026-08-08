#!/usr/bin/env node
/**
 * Feature-parity checker: catches *undeclared drift and regression*, never
 * incompleteness.
 *
 * Mobile is deliberately far behind web (ADR 0016 authorizes the Expo shell and
 * its pipeline, not parity). A check that failed on "mobile is behind" would be
 * red permanently and get disabled inside two weeks, so it doesn't do that.
 * Instead every feature declares a per-platform *status* in parity/features.json,
 * and this script fails only when the declaration and reality disagree:
 *
 *   HARD FAIL (never baseline-able) — your diff did something undeclared:
 *     - a page.tsx exists that no feature claims
 *     - a feature claims a route with no page.tsx (stale manifest)
 *     - status 'wont-do' without a reason + decision link
 *     - status 'gated' without a decision link
 *     - a decision link that doesn't resolve on disk
 *     - tagged coverage found for a platform declared 'wont-do'
 *     - a test tagged with an unknown feature id
 *
 *   GAP (baseline-able, the ratchet) — declared shipped, not exercised:
 *     - status 'shipped' with no tagged test on that platform
 *
 *   REPORT ONLY (never fails) — the known, intended gap:
 *     - 'gated' and 'planned' counts, i.e. how far mobile trails web
 *
 * Coverage signals:
 *   web    — a Playwright spec in app/tests/e2e/ tagged @feature:<id>
 *   mobile — a Maestro flow in mobile/e2e/flows/ tagged feature:<id>
 *
 * Known gaps live in parity/parity-baseline.txt, the same ratchet shape as
 * app/scripts/design-tokens-baseline.txt. Gaps may shrink freely; adding one is
 * a conspicuous line in a PR diff, which is the point.
 *
 * Run:             node parity/check-parity.mjs
 * Update baseline: node parity/check-parity.mjs --update
 * Machine output:  node parity/check-parity.mjs --json
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = join(root, 'parity', 'features.json')
const baselinePath = join(root, 'parity', 'parity-baseline.txt')

const PLATFORMS = ['web', 'mobile']
const STATUSES = ['shipped', 'planned', 'gated', 'wont-do']
const LAYOUTS = ['compact', 'medium', 'expanded']

function walk(dir, predicate, out = []) {
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue
      walk(path, predicate, out)
    } else if (predicate(path)) {
      out.push(path)
    }
  }
  return out
}

// ---------------------------------------------------------------- manifest
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const features = manifest.features ?? []
const enforceLayouts = manifest.enforce?.layouts === true
const problems = [] // hard failures, never baseline-able

const ids = new Set()
for (const f of features) {
  if (!/^[a-z0-9.-]+$/.test(f.id)) problems.push(`manifest: invalid feature id '${f.id}'`)
  if (ids.has(f.id)) problems.push(`manifest: duplicate feature id '${f.id}'`)
  ids.add(f.id)

  for (const layout of f.layouts ?? []) {
    if (!LAYOUTS.includes(layout)) {
      problems.push(`manifest: feature '${f.id}' has unknown layout '${layout}'`)
    }
  }

  for (const platform of PLATFORMS) {
    const decl = f[platform]
    if (!decl || typeof decl !== 'object') {
      problems.push(
        `manifest: feature '${f.id}' is missing its '${platform}' declaration — every feature must state a status for every platform`,
      )
      continue
    }
    if (!STATUSES.includes(decl.status)) {
      problems.push(
        `manifest: feature '${f.id}'.${platform} has unknown status '${decl.status}' (expected one of ${STATUSES.join(', ')})`,
      )
      continue
    }
    // Deliberate non-parity has to be argued for, not just asserted. This is
    // the friction that stops "mark it wont-do" being the cheapest way to green.
    if (decl.status === 'wont-do' && !decl.reason) {
      problems.push(
        `manifest: feature '${f.id}'.${platform} is 'wont-do' with no 'reason' — say why this platform is deliberately excluded`,
      )
    }
    if ((decl.status === 'wont-do' || decl.status === 'gated') && !decl.decision) {
      problems.push(
        `manifest: feature '${f.id}'.${platform} is '${decl.status}' with no 'decision' link — point at the doc that records the call`,
      )
    }
    // A decision link that rots is a decision nobody can check.
    if (decl.decision && !existsSync(join(root, decl.decision))) {
      problems.push(
        `manifest: feature '${f.id}'.${platform} cites decision '${decl.decision}', which does not exist`,
      )
    }
  }
}

// ---------------------------------------------------------- route coverage
// Every page.tsx under app/src/app must be claimed by exactly one feature.
// Route groups `(x)` collapse; parallel slots `@x` and interceptors `(.)x` are
// presentation detail of their base route and are skipped.
const pageFiles = walk(join(root, 'app', 'src', 'app'), (p) => p.endsWith(`${sep}page.tsx`))
const diskRoutes = new Set()
for (const file of pageFiles) {
  const relPath = relative(join(root, 'app', 'src', 'app'), dirname(file))
  const segments = relPath === '' ? [] : relPath.split(sep)
  if (segments.some((s) => s.startsWith('@') || s.startsWith('(.)'))) continue
  const route = `/${segments.filter((s) => !/^\(.+\)$/.test(s)).join('/')}`
  diskRoutes.add(route === '//' ? '/' : route)
}

const claimedRoutes = new Map() // route -> feature id
for (const f of features) {
  for (const route of f.routes ?? []) {
    if (claimedRoutes.has(route)) {
      problems.push(
        `manifest: route '${route}' claimed by both '${claimedRoutes.get(route)}' and '${f.id}'`,
      )
    }
    claimedRoutes.set(route, f.id)
    if (!diskRoutes.has(route)) {
      problems.push(
        `manifest: feature '${f.id}' claims route '${route}' but app/src/app has no such page — remove it or fix the path`,
      )
    }
  }
}
for (const route of [...diskRoutes].sort()) {
  if (!claimedRoutes.has(route)) {
    problems.push(
      `route '${route}' has a page.tsx but no feature in parity/features.json claims it — declare the feature (and each platform's status) before shipping the page`,
    )
  }
}

// ------------------------------------------------------------- test scans
function scanTags(files, featureRe, layoutRe) {
  const byFeature = new Map() // feature id -> Set<layout tags seen in the same file>
  const unknown = new Set()
  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    const layouts = new Set([...text.matchAll(layoutRe)].map((m) => m[1]))
    for (const match of text.matchAll(featureRe)) {
      const id = match[1]
      if (!ids.has(id)) {
        unknown.add(`${relative(root, file)}: unknown feature tag '${id}'`)
        continue
      }
      const set = byFeature.get(id) ?? new Set()
      for (const l of layouts) set.add(l)
      byFeature.set(id, set)
    }
  }
  return { byFeature, unknown }
}

const webSpecs = walk(join(root, 'app', 'tests', 'e2e'), (p) => p.endsWith('.spec.ts'))
const mobileFlows = walk(join(root, 'mobile', 'e2e', 'flows'), (p) => /\.ya?ml$/.test(p))
const coverage = {
  web: scanTags(webSpecs, /@feature:([a-z0-9.-]+)/g, /@layout:(compact|medium|expanded)/g),
  mobile: scanTags(mobileFlows, /feature:([a-z0-9.-]+)/g, /layout:(compact|medium|expanded)/g),
}
for (const u of [...coverage.web.unknown, ...coverage.mobile.unknown]) problems.push(u)

// ------------------------------------------------------------------- gaps
const gaps = []
const tally = {
  web: { shipped: 0, planned: 0, gated: 0, 'wont-do': 0 },
  mobile: { shipped: 0, planned: 0, gated: 0, 'wont-do': 0 },
}

for (const f of features) {
  for (const platform of PLATFORMS) {
    const decl = f[platform]
    if (!decl || !STATUSES.includes(decl.status)) continue
    tally[platform][decl.status] += 1

    const covered = coverage[platform].byFeature.get(f.id)

    // Coverage on a platform we said we'd never build is a contradiction: the
    // feature got built and the manifest wasn't updated. Not baseline-able.
    if (decl.status === 'wont-do' && covered) {
      problems.push(
        `feature '${f.id}' is declared 'wont-do' on ${platform} but a ${platform} test claims coverage for it — update the manifest, the decision changed`,
      )
      continue
    }

    if (decl.status !== 'shipped') continue

    if (!covered) {
      gaps.push(`${platform}:${f.id}`)
      continue
    }

    if (!enforceLayouts) continue
    // 'expanded' is satisfied implicitly by the default runner on both
    // platforms (desktop Playwright project / phone Maestro runner covers
    // 'compact'); the others need an explicitly tagged test.
    const implicit = platform === 'web' ? 'expanded' : 'compact'
    for (const layout of f.layouts ?? []) {
      if (layout === implicit) continue
      if (platform === 'mobile' && layout === 'medium') continue // portrait tablets share the compact shell
      if (!covered.has(layout)) gaps.push(`${platform}-layout:${f.id}:${layout}`)
    }
  }
}
gaps.sort()

// ---------------------------------------------------------------- results
if (problems.length > 0) {
  console.error('FAIL: structural problems (never baseline-able):\n')
  for (const p of problems) console.error(`  - ${p}`)
  console.error(
    '\nEach of these means the manifest and the code disagree. Fix the code or update\nparity/features.json — there is no baseline escape hatch for them.',
  )
  process.exit(1)
}

if (process.argv.includes('--update')) {
  writeFileSync(baselinePath, gaps.length > 0 ? `${gaps.join('\n')}\n` : '')
  console.log(`Baseline updated with ${gaps.length} known gap(s):`)
  for (const g of gaps) console.log(`  ${g}`)
  process.exit(0)
}

const baseline = existsSync(baselinePath)
  ? new Set(
      readFileSync(baselinePath, 'utf8')
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#')),
    )
  : new Set()

const newGaps = gaps.filter((g) => !baseline.has(g))
const closedGaps = [...baseline].filter((g) => !gaps.includes(g))

if (process.argv.includes('--json')) {
  console.log(
    JSON.stringify(
      { features: features.length, tally, gaps, newGaps, closedGaps, enforceLayouts },
      null,
      2,
    ),
  )
  process.exit(newGaps.length > 0 ? 1 : 0)
}

const line = (p) =>
  `${p.padEnd(6)} shipped ${tally[p].shipped}  planned ${tally[p].planned}  gated ${tally[p].gated}  wont-do ${tally[p]['wont-do']}`
console.log(`parity: ${features.length} features`)
console.log(`  ${line('web')}`)
console.log(`  ${line('mobile')}`)
console.log(`  ${gaps.length} known gap(s)${enforceLayouts ? '' : ', layout coverage not yet enforced'}`)

if (closedGaps.length > 0) {
  console.log(
    `\nnote: ${closedGaps.length} gap(s) closed — ratchet down with: node parity/check-parity.mjs --update`,
  )
  for (const g of closedGaps) console.log(`  ✓ ${g}`)
}

if (newGaps.length > 0) {
  console.error(`\nFAIL: ${newGaps.length} parity gap(s) not in parity/parity-baseline.txt:\n`)
  for (const g of newGaps) console.error(`  - ${g}`)
  console.error(
    "\nEach gap means a feature declared 'shipped' on a platform has no test tagged with",
  )
  console.error('its id there. Fix by adding the missing test, by correcting the declared status')
  console.error('if the feature is not actually shipped, or — only as a conscious, reviewed')
  console.error('decision — by recording the gap: node parity/check-parity.mjs --update')
  process.exit(1)
}
console.log('\nok: no new parity gaps')

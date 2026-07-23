#!/usr/bin/env node
/**
 * Feature-parity ratchet: web ↔ mobile ↔ layout coverage may only improve.
 *
 * Reads parity/features.json (the feature manifest), scans:
 *   - app/tests/e2e/** for Playwright specs tagged  @feature:<id> / @layout:<class>
 *   - mobile/e2e/flows/** for Maestro flows tagged  feature:<id>  / layout:expanded
 *   - app/src/app/** page.tsx files (every route must be claimed by a feature)
 *
 * A feature declared for a platform without a tagged test on that platform is
 * a GAP. Known gaps live in parity/parity-baseline.txt; a gap not in the
 * baseline fails the run. Closing gaps is celebrated; add new baseline
 * entries only as a conscious decision in code review, exactly like the
 * design-token ratchet (app/scripts/check-design-tokens.sh).
 *
 * The intended workflow for a new feature:
 *   1. Add the manifest entry (the route scan forces this for new pages).
 *   2. Write the web spec and the mobile flow, tagged with the feature id.
 *   3. Until the mobile flow exists and passes, this check (or the mobile
 *      e2e suite) is red — the failure IS the to-do list for parity.
 *
 * Run:            node parity/check-parity.mjs
 * Update baseline: node parity/check-parity.mjs --update
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = join(root, 'parity', 'features.json')
const baselinePath = join(root, 'parity', 'parity-baseline.txt')

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
const problems = [] // hard failures, never baseline-able
const features = manifest.features ?? []

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
  for (const platform of f.platforms ?? []) {
    if (!['web', 'mobile'].includes(platform)) {
      problems.push(`manifest: feature '${f.id}' has unknown platform '${platform}'`)
    }
  }
}

// ---------------------------------------------------------- route coverage
// Every page.tsx under app/src/app must be claimed by exactly one feature.
// Route groups `(x)` collapse; parallel slots `@x` and interceptors `(.)x`
// are presentation detail of their base route and are skipped.
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
      `route '${route}' has a page.tsx but no feature in parity/features.json claims it — declare the feature (and its platforms) before shipping the page`,
    )
  }
}

// ------------------------------------------------------------- test scans
function scanTags(files, featureRe, layoutRe) {
  const byFeature = new Map() // feature id -> Set<layout tags in same file>
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
const web = scanTags(webSpecs, /@feature:([a-z0-9.-]+)/g, /@layout:(compact|medium|expanded)/g)

const mobileFlows = walk(join(root, 'mobile', 'e2e', 'flows'), (p) => /\.ya?ml$/.test(p))
const mobile = scanTags(mobileFlows, /feature:([a-z0-9.-]+)/g, /layout:(compact|medium|expanded)/g)

for (const u of [...web.unknown, ...mobile.unknown]) problems.push(u)

// ------------------------------------------------------------------- gaps
const gaps = []
for (const f of features) {
  const platforms = f.platforms ?? []
  const layouts = f.layouts ?? ['expanded']
  const webLayouts = web.byFeature.get(f.id)
  const mobileLayouts = mobile.byFeature.get(f.id)

  if (platforms.includes('web')) {
    if (!webLayouts) {
      gaps.push(`web:${f.id}`)
    } else {
      // 'expanded' is satisfied by any tagged spec (desktop is the default
      // Playwright project); compact/medium need an explicit @layout spec.
      for (const layout of layouts) {
        if (layout !== 'expanded' && !webLayouts.has(layout)) {
          gaps.push(`web-layout:${f.id}:${layout}`)
        }
      }
    }
  }
  if (platforms.includes('mobile')) {
    if (!mobileLayouts) {
      gaps.push(`mobile:${f.id}`)
    } else if (layouts.includes('expanded') && !mobileLayouts.has('expanded')) {
      // Phone runners cover 'compact' implicitly; 'expanded' needs a flow
      // tagged layout:expanded running on a tablet device. 'medium' is not
      // enforced on mobile (portrait tablets share the compact shell).
      gaps.push(`mobile-layout:${f.id}:expanded`)
    }
  }
}
gaps.sort()

// ---------------------------------------------------------------- results
if (problems.length > 0) {
  console.error('FAIL: structural problems (never baseline-able):\n')
  for (const p of problems) console.error(`  - ${p}`)
  process.exit(1)
}

if (process.argv.includes('--update')) {
  writeFileSync(baselinePath, `${gaps.join('\n')}\n`)
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

console.log(
  `parity: ${features.length} features, ${web.byFeature.size} web-covered, ${mobile.byFeature.size} mobile-covered, ${gaps.length} known gap(s)`,
)
if (closedGaps.length > 0) {
  console.log(`\nnote: ${closedGaps.length} gap(s) closed — ratchet down with: node parity/check-parity.mjs --update`)
  for (const g of closedGaps) console.log(`  ✓ ${g}`)
}
if (newGaps.length > 0) {
  console.error(`\nFAIL: ${newGaps.length} parity gap(s) not in parity/parity-baseline.txt:\n`)
  for (const g of newGaps) console.error(`  - ${g}`)
  console.error(
    '\nEach gap means a feature is declared for a platform/layout with no tagged test there.',
  )
  console.error('Fix by adding the missing test (tagged with the feature id), or — only as a')
  console.error('conscious, reviewed decision — record the gap: node parity/check-parity.mjs --update')
  process.exit(1)
}
console.log('ok: no new parity gaps')

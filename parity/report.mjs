#!/usr/bin/env node
/**
 * Parity report — the soft half of the system.
 *
 * check-parity.mjs answers "did this diff break a rule?" (hard fail). This
 * answers "what did this diff do to parity?" (never fails). A scoreboard gets
 * skimmed past by week three; a statement about *your own diff* does not, so
 * everything here is expressed as a delta against the merge base.
 *
 * The delta is computed from two files as they exist on the base ref —
 * parity/features.json (the declarations) and parity/parity-baseline.txt (the
 * known gaps) — read via `git show`. That means no second checkout and no
 * re-scan of the base tree: a plain file comparison, exact and cheap.
 *
 * Writes markdown to stdout, and appends to $GITHUB_STEP_SUMMARY when set.
 * Exit code is always 0 — this step must never gate a merge.
 *
 * Run: node parity/report.mjs [--base origin/main]
 */
import { execFileSync } from 'node:child_process'
import { appendFileSync, existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const PLATFORMS = ['web', 'mobile']
const STATUSES = ['shipped', 'planned', 'gated', 'wont-do']

const baseArg = process.argv.indexOf('--base')
const base = baseArg !== -1 ? process.argv[baseArg + 1] : 'origin/main'

function gitShow(ref, path) {
  try {
    return execFileSync('git', ['show', `${ref}:${path}`], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
  } catch {
    return null // path absent on that ref, or ref unavailable (shallow clone)
  }
}

function tallyOf(manifest) {
  const tally = {}
  for (const p of PLATFORMS) {
    tally[p] = Object.fromEntries(STATUSES.map((s) => [s, 0]))
  }
  for (const f of manifest?.features ?? []) {
    for (const p of PLATFORMS) {
      const status = f[p]?.status
      if (STATUSES.includes(status)) tally[p][status] += 1
    }
  }
  return tally
}

function gapsOf(text) {
  return new Set(
    (text ?? '')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#')),
  )
}

// -------------------------------------------------------------- head state
const headManifest = JSON.parse(readFileSync(join(root, 'parity', 'features.json'), 'utf8'))
const baselinePath = join(root, 'parity', 'parity-baseline.txt')
const headGaps = gapsOf(existsSync(baselinePath) ? readFileSync(baselinePath, 'utf8') : '')
const headTally = tallyOf(headManifest)
const headIds = new Map(headManifest.features.map((f) => [f.id, f]))

// -------------------------------------------------------------- base state
const baseManifestRaw = gitShow(base, 'parity/features.json')
const baseManifest = baseManifestRaw ? JSON.parse(baseManifestRaw) : null
const comparable = baseManifest !== null
const baseTally = tallyOf(baseManifest)
const baseGaps = gapsOf(gitShow(base, 'parity/parity-baseline.txt'))
const baseIds = new Set((baseManifest?.features ?? []).map((f) => f.id))
// Across a schema change, gap ids are not comparable — entries that were
// reclassified (e.g. a mobile status moving to 'gated') would read as "closed",
// which is exactly the kind of flattering nonsense that discredits a report.
const schemaChanged =
  comparable && (baseManifest.schemaVersion ?? 1) !== (headManifest.schemaVersion ?? 1)

// ------------------------------------------------------------------ deltas
const delta = (now, before) => {
  if (!comparable) return ''
  const d = now - before
  return d === 0 ? ' (+0)' : d > 0 ? ` (+${d})` : ` (${d})`
}

const addedFeatures = comparable ? headManifest.features.filter((f) => !baseIds.has(f.id)) : []
const removedFeatures = comparable ? [...baseIds].filter((id) => !headIds.has(id)) : []
const addedGaps = schemaChanged ? [] : [...headGaps].filter((g) => !baseGaps.has(g)).sort()
const closedGaps =
  comparable && !schemaChanged ? [...baseGaps].filter((g) => !headGaps.has(g)).sort() : []

// Mobile coverage is measured against the surfaces mobile is *supposed* to
// have — 'wont-do' is deliberate non-parity, so counting it as a miss would
// make the percentage a lie that never improves.
const mobileScope = headTally.mobile.shipped + headTally.mobile.planned + headTally.mobile.gated
const mobilePct = mobileScope === 0 ? 0 : (headTally.mobile.shipped / mobileScope) * 100

// ------------------------------------------------------------------ render
const out = []
out.push('### Parity report')
out.push('')
if (!comparable) {
  out.push(
    `> No comparable baseline on \`${base}\` — showing absolute state. Deltas appear once this manifest is on the base branch.`,
  )
  out.push('')
}
out.push('| | web | mobile |')
out.push('|---|---|---|')
for (const s of STATUSES) {
  out.push(
    `| ${s} | ${headTally.web[s]}${delta(headTally.web[s], baseTally.web[s])} | ${headTally.mobile[s]}${delta(headTally.mobile[s], baseTally.mobile[s])} |`,
  )
}
out.push('')
out.push(
  `**Mobile coverage** ${headTally.mobile.shipped}/${mobileScope} in-scope surfaces (${mobilePct.toFixed(1)}%) — \`wont-do\` excluded as deliberate non-parity.`,
)
out.push(
  `**Known e2e gaps** ${headGaps.size}${delta(headGaps.size, baseGaps.size)} — surfaces declared shipped with no test tagged for them.`,
)
if (headManifest.enforce?.layouts !== true) {
  out.push('**Layout coverage** declared in the manifest, enforcement not yet switched on.')
}
if (schemaChanged) {
  out.push(
    `**Note** the manifest schema changed against \`${base}\` (v${baseManifest.schemaVersion ?? 1} → v${headManifest.schemaVersion ?? 1}), so gap-level deltas are suppressed — old and new gap ids don't mean the same thing.`,
  )
}
out.push('')

// The attributable part: what THIS diff did.
const notes = []
for (const f of addedFeatures) {
  const m = f.mobile ?? {}
  const suffix = m.decision ? ` (${m.decision})` : ''
  notes.push(`- **New surface** \`${f.id}\` — web \`${f.web?.status}\`, mobile \`${m.status}\`${suffix}`)
}
for (const id of removedFeatures) {
  notes.push(`- **Surface removed from the manifest** \`${id}\` — confirm the routes are gone too`)
}
for (const g of addedGaps) {
  notes.push(`- **New baselined gap** \`${g}\` — declared shipped, nothing exercises it`)
}
for (const g of closedGaps) {
  notes.push(`- **Gap closed** \`${g}\` ✅`)
}

if (notes.length > 0) {
  out.push('#### What this diff changed')
  out.push(...notes)
} else {
  out.push('_Parity unchanged by this diff._')
}
out.push('')
out.push(
  '<sub>Mobile trailing web is expected and never fails this job — [ADR 0016](docs/decisions/0016-native-mobile-via-expo.md) authorizes the Expo shell and its pipeline, not parity. Only undeclared drift and regressions fail. See [parity/README.md](parity/README.md).</sub>',
)

const markdown = `${out.join('\n')}\n`
process.stdout.write(markdown)
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown)
}
// Signals to the workflow whether a sticky PR comment is worth posting at all.
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `changed=${notes.length > 0 ? 'true' : 'false'}\n`)
}

const FORBIDDEN_REPEATABLE_DATABASE_COMMAND = /db reset|migration repair|--include-seed|seed\.sql/i

export function cutoverGitignoreErrors(gitignore: string): string[] {
  const rules = gitignore.split(/\r?\n/).map((line) => line.trim())
  return rules.includes('/bin/doppler')
    ? []
    : ['Doppler GitHub Action runtime binary must be ignored at /bin/doppler']
}

function ordered(haystack: string, markers: string[]): boolean {
  let cursor = -1
  for (const marker of markers) {
    const next = haystack.indexOf(marker, cursor + 1)
    if (next < 0) return false
    cursor = next
  }
  return true
}

/** Drops comment lines, so prose explaining a rule cannot trip the rule. */
function withoutComments(workflow: string): string {
  return workflow
    .split(/\r?\n/)
    .filter((line) => !/^\s*#/.test(line))
    .join('\n')
}

/** The workflow-level `concurrency.group`, ignoring any job-level ones. */
function concurrencyGroup(workflow: string): string | null {
  const lines = workflow.split(/\r?\n/)
  const start = lines.indexOf('concurrency:')
  if (start < 0) return null
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === '') continue
    if (!/^\s/.test(line)) return null // dedented out of the block
    const group = /^\s+group:\s*(\S+)/.exec(line)
    if (group) return group[1]
  }
  return null
}

/**
 * The pipeline is deliberately two workflows: a production approval can hold a
 * run for days, and a workflow-level `concurrency` group covers waiting jobs,
 * so a shared group let one pending approval cancel every later push before it
 * ran a single job. `dev` is .github/workflows/cd.yml, `prod` is promote.yml.
 */
export function productionWorkflowErrors(dev: string, prod: string): string[] {
  const errors: string[] = []
  if (!prod.includes('environment: production')) errors.push('production approval gate is missing')
  if (!prod.includes('DOPPLER_TOKEN_PRD')) errors.push('production Doppler credential is missing')
  if (dev.includes('environment: production')) {
    errors.push('the dev workflow must hold no approval gate — it would stall the dev stage')
  }
  for (const marker of [
    'candidate_sha:',
    'REQUESTED_CANDIDATE_SHA',
    'refs/heads/codex/ui-ux-iteration-2',
    '"$REQUESTED_CANDIDATE_SHA" != "$GITHUB_SHA"',
    'ALLOW_DEV_CANDIDATE_DEPLOY',
  ]) {
    if (!dev.includes(marker)) {
      errors.push(`exact-SHA development candidate dispatch is missing: ${marker}`)
    }
  }
  if (!dev.includes('wait-for-ci')) {
    errors.push('the dev stage must deploy only commits CI has certified')
  }
  for (const [label, workflow] of [
    ['dev', dev],
    ['production', prod],
  ] as const) {
    if (FORBIDDEN_REPEATABLE_DATABASE_COMMAND.test(workflow)) {
      errors.push(`repeatable ${label} CD contains a destructive, repair, or seed command`)
    }
  }

  const devGroup = concurrencyGroup(dev)
  const prodGroup = concurrencyGroup(prod)
  if (!devGroup || !prodGroup || devGroup === prodGroup) {
    errors.push('dev and production must hold separate concurrency groups')
  }

  if (!dev.includes('name: Deploy dev stage')) errors.push('the dev deployment job is missing')
  if (!prod.includes('name: Promote to production')) {
    errors.push('the production promotion job is missing')
    return errors
  }

  if (!prod.includes("github.event.workflow_run.head_branch == 'main'")) {
    errors.push('production promotion must be restricted to main')
  }
  // workflow_run fires against the branch tip, which may already have moved
  // past the commit the dev stage tested.
  if (!/CUTOVER_SHA:\s*\$\{\{\s*github\.event\.workflow_run\.head_sha\s*\}\}/.test(prod)) {
    errors.push('production must promote the SHA the dev stage tested')
  }
  if (/github\.sha|GITHUB_SHA/.test(withoutComments(prod))) {
    errors.push('production must never resolve its commit from github.sha')
  }

  const migrationOrder = (target: 'dev' | 'production') => [
    `--target=${target} --mode=preflight`,
    `--target=${target} --mode=dry-run`,
    `--target=${target} --mode=apply`,
    `--target=${target} --mode=postflight`,
  ]
  if (!ordered(dev, [...migrationOrder('dev'), 'railway up'])) {
    errors.push('dev migration preflight/dry-run/apply/postflight must precede code deployment')
  }
  if (
    !ordered(prod, [...migrationOrder('production'), 'production-v2-postflight.ts', 'railway up'])
  ) {
    errors.push('production migration and schema postflight must precede code deployment')
  }
  if ((prod.match(/railway up/g) ?? []).length < 2) {
    errors.push('production web and worker must both deploy')
  }
  if (!prod.includes('RAILWAY_WORKER_SERVICE')) errors.push('production worker target is missing')
  if (!prod.includes('/api/health')) errors.push('production exact-SHA health wait is missing')
  return errors
}

// The only scripts allowed to hold a destructive database command, each pinned
// to the guard markers asserted below. Everything else fails the ratchet.
const DESTRUCTIVE_ENTRY_POINTS = new Set(['scripts/production-v2-reset.ts', 'scripts/reset-dev.ts'])

export function destructiveEntryPointErrors(files: Record<string, string>): string[] {
  const errors: string[] = []
  for (const [path, content] of Object.entries(files)) {
    if (/supabase[\s\S]{0,80}db[\s\S]{0,80}reset|migration repair/i.test(content)) {
      if (!DESTRUCTIVE_ENTRY_POINTS.has(path)) {
        errors.push(`forbidden destructive database command in ${path}`)
      }
    }
  }
  const reset = files['scripts/production-v2-reset.ts'] ?? ''
  for (const marker of [
    'PRODUCTION_V2_RESET_EXECUTE',
    'PRODUCTION_V2_ZERO_DATA_ACK',
    'PRODUCTION_V2_RESET_CONFIRM',
    '--no-seed',
    '--yes',
  ]) {
    if (!reset.includes(marker)) errors.push(`production reset is missing guard: ${marker}`)
  }
  // The dev reset is routine rather than one-time, so it has no zero-data
  // premise and seeds on purpose (no --no-seed requirement) — but it must
  // keep the execute ack, the exact confirmation string, and the shared
  // remote-target/git guard stack.
  const devReset = files['scripts/reset-dev.ts'] ?? ''
  for (const marker of [
    'DEV_RESET_EXECUTE',
    'DEV_RESET_CONFIRM',
    'validateRemoteExecution',
    '--yes',
  ]) {
    if (!devReset.includes(marker)) errors.push(`dev reset is missing guard: ${marker}`)
  }
  return errors
}

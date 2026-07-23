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

export function productionWorkflowErrors(workflow: string): string[] {
  const errors: string[] = []
  if (!workflow.includes('environment: production'))
    errors.push('production approval gate is missing')
  if (!workflow.includes('DOPPLER_TOKEN_PRD'))
    errors.push('production Doppler credential is missing')
  for (const marker of [
    'candidate_sha:',
    'REQUESTED_CANDIDATE_SHA',
    'refs/heads/codex/ui-ux-iteration-2',
    '"$REQUESTED_CANDIDATE_SHA" != "$GITHUB_SHA"',
    'ALLOW_DEV_CANDIDATE_DEPLOY',
  ]) {
    if (!workflow.includes(marker)) {
      errors.push(`exact-SHA development candidate dispatch is missing: ${marker}`)
    }
  }
  if (FORBIDDEN_REPEATABLE_DATABASE_COMMAND.test(workflow)) {
    errors.push('repeatable CD contains a destructive, repair, or seed command')
  }

  const devStart = workflow.indexOf('name: Deploy dev stage')
  const prodStart = workflow.indexOf('name: Promote to production')
  if (devStart < 0 || prodStart < 0 || devStart >= prodStart) {
    errors.push('dev and production jobs are missing or unordered')
    return errors
  }
  const dev = workflow.slice(devStart, prodStart)
  const prod = workflow.slice(prodStart)

  if (!prod.includes("if: github.ref == 'refs/heads/main'")) {
    errors.push('production promotion must be restricted to main')
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

export function destructiveEntryPointErrors(files: Record<string, string>): string[] {
  const errors: string[] = []
  for (const [path, content] of Object.entries(files)) {
    if (/supabase[\s\S]{0,80}db[\s\S]{0,80}reset|migration repair/i.test(content)) {
      if (path !== 'scripts/production-v2-reset.ts') {
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
  return errors
}

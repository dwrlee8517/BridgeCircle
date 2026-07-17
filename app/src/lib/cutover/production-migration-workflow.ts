const REQUIRED_CONFIRMATION = 'RUN_PRODUCTION_MIGRATION_OWNERSHIP'
const DRY_RUN_COMMAND = 'pnpm exec supabase db push --db-url "$SUPABASE_DB_URL" --dry-run'
const PUSH_COMMAND = 'pnpm exec supabase db push --db-url "$SUPABASE_DB_URL" --yes'

export function productionMigrationWorkflowErrors(
  workflow: string,
  packageJson: { devDependencies?: Record<string, string> },
): string[] {
  const errors: string[] = []
  const requireText = (needle: string, message: string) => {
    if (!workflow.includes(needle)) errors.push(message)
  }

  requireText('workflow_dispatch:', 'workflow must be manual-only')
  if (/^\s{0,4}(push|pull_request):/m.test(workflow)) {
    errors.push('workflow must not have push or pull-request triggers')
  }
  requireText(
    'permissions:\n  contents: read',
    'workflow must use read-only repository permissions',
  )
  requireText('environment: production', 'workflow must use the protected production environment')
  requireText('cancel-in-progress: false', 'workflow must serialize without cancellation')
  requireText(
    `CONFIRMATION: \${{ inputs.confirmation }}`,
    'workflow must pass confirmation via env',
  )
  requireText(REQUIRED_CONFIRMATION, 'workflow must require the typed confirmation')
  requireText(`ref: \${{ github.sha }}`, 'workflow must check out the dispatched SHA')
  requireText(
    'PRODUCTION_PROJECT_REF: edumxwzilfgvamzarwvo',
    'workflow must pin the production ref',
  )
  requireText(
    'production-migration-ownership-preflight.ts',
    'workflow must run the target preflight',
  )
  requireText(DRY_RUN_COMMAND, 'workflow must dry-run the migration first')
  requireText(PUSH_COMMAND, 'workflow must run a non-interactive migration push')
  requireText(
    'EXPECTED_PENDING_MIGRATION: none',
    'workflow must verify zero pending migrations afterward',
  )

  if (/\brailway\b/i.test(workflow))
    errors.push('migration-only workflow must not deploy Railway code')
  if (/db reset|migration repair|--include-seed|seed\.sql/i.test(workflow)) {
    errors.push('migration-only workflow contains a forbidden destructive or seed command')
  }

  const preflightIndex = workflow.indexOf('production-migration-ownership-preflight.ts')
  const dryRunIndex = workflow.indexOf(DRY_RUN_COMMAND)
  const pushIndex = workflow.indexOf(PUSH_COMMAND)
  const postflightIndex = workflow.lastIndexOf('production-migration-ownership-preflight.ts')
  if (
    preflightIndex < 0 ||
    dryRunIndex < 0 ||
    pushIndex < 0 ||
    postflightIndex < 0 ||
    !(preflightIndex < dryRunIndex && dryRunIndex < pushIndex && pushIndex < postflightIndex)
  ) {
    errors.push('workflow order must be preflight, dry-run, push, postflight')
  }

  if (packageJson.devDependencies?.supabase !== '2.109.1') {
    errors.push('Supabase CLI must be pinned exactly to 2.109.1')
  }
  return errors
}

export function assertProductionMigrationWorkflow(
  workflow: string,
  packageJson: { devDependencies?: Record<string, string> },
): void {
  const errors = productionMigrationWorkflowErrors(workflow, packageJson)
  if (errors.length > 0) throw new Error(errors.join('\n'))
}

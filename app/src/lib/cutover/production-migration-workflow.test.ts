import { describe, expect, it } from 'vitest'
import { productionMigrationWorkflowErrors } from './production-migration-workflow'

const validPackage = { devDependencies: { supabase: '2.109.1' } }
const validWorkflow = `name: Production migration ownership
on:
  workflow_dispatch:
permissions:
  contents: read
concurrency:
  cancel-in-progress: false
jobs:
  migrate:
    environment: production
    steps:
      - uses: actions/checkout@v4
        with:
          ref: \${{ github.sha }}
      - env:
          CONFIRMATION: \${{ inputs.confirmation }}
          PRODUCTION_PROJECT_REF: edumxwzilfgvamzarwvo
        run: test "$CONFIRMATION" = RUN_PRODUCTION_MIGRATION_OWNERSHIP
      - run: node --import tsx scripts/production-migration-ownership-preflight.ts
      - run: pnpm exec supabase db push --db-url "$SUPABASE_DB_URL" --dry-run
      - run: pnpm exec supabase db push --db-url "$SUPABASE_DB_URL" --yes
      - env:
          EXPECTED_PENDING_MIGRATION: none
        run: node --import tsx scripts/production-migration-ownership-preflight.ts
`

describe('productionMigrationWorkflowErrors', () => {
  it('accepts the guarded migration-only workflow', () => {
    expect(productionMigrationWorkflowErrors(validWorkflow, validPackage)).toEqual([])
  })

  it.each([
    [
      'automatic trigger',
      validWorkflow.replace('workflow_dispatch:', 'push:\n    branches: [main]'),
    ],
    ['Railway deploy', `${validWorkflow}\n      - run: railway up\n`],
    ['seed flag', validWorkflow.replace('--yes', '--include-seed --yes')],
    ['database reset', `${validWorkflow}\n      - run: supabase db reset\n`],
    ['missing production gate', validWorkflow.replace('environment: production', '')],
    [
      'reversed push order',
      validWorkflow
        .replace('pnpm exec supabase db push --db-url "$SUPABASE_DB_URL" --dry-run', 'TEMP')
        .replace(
          'pnpm exec supabase db push --db-url "$SUPABASE_DB_URL" --yes',
          'pnpm exec supabase db push --db-url "$SUPABASE_DB_URL" --dry-run',
        )
        .replace('TEMP', 'pnpm exec supabase db push --db-url "$SUPABASE_DB_URL" --yes'),
    ],
  ])('rejects %s', (_label, workflow) => {
    expect(productionMigrationWorkflowErrors(workflow, validPackage)).not.toEqual([])
  })

  it('rejects an unpinned CLI', () => {
    expect(
      productionMigrationWorkflowErrors(validWorkflow, {
        devDependencies: { supabase: '^2.109.1' },
      }),
    ).toContain('Supabase CLI must be pinned exactly to 2.109.1')
  })
})

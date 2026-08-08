import { describe, expect, it } from 'vitest'
import {
  cutoverGitignoreErrors,
  destructiveEntryPointErrors,
  productionWorkflowErrors,
} from './production-workflow'

const migrationSteps = (target: string) => `
  --target=${target} --mode=preflight
  --target=${target} --mode=dry-run
  --target=${target} --mode=apply
  --target=${target} --mode=postflight`

const validDev = `
name: CD
concurrency:
  group: cd-dev
candidate_sha:
wait-for-ci
name: Deploy dev stage
REQUESTED_CANDIDATE_SHA
refs/heads/codex/ui-ux-iteration-2
"$REQUESTED_CANDIDATE_SHA" != "$GITHUB_SHA"
ALLOW_DEV_CANDIDATE_DEPLOY
${migrationSteps('dev')}
railway up`

const validProd = `
name: Promote to production
concurrency:
  group: cd-prod
CUTOVER_SHA: \${{ github.event.workflow_run.head_sha }}
if: github.event.workflow_run.head_branch == 'main'
environment: production
DOPPLER_TOKEN_PRD
${migrationSteps('production')}
production-v2-postflight.ts
/api/health
RAILWAY_WORKER_SERVICE
railway up
railway up`

describe('production workflow ratchet', () => {
  it('requires the Doppler action runtime artifact to stay outside Git status', () => {
    expect(cutoverGitignoreErrors('/bin/doppler\n')).toEqual([])
    expect(cutoverGitignoreErrors('node_modules\n')).not.toEqual([])
  })

  it('accepts database-before-code with exact-SHA web and worker deployment', () => {
    expect(productionWorkflowErrors(validDev, validProd)).toEqual([])
  })

  it('reads rules from workflow steps, not from comments explaining them', () => {
    const commented = validProd.replace(
      'environment: production',
      '# the promoted commit is the CD run head_sha, never github.sha\nenvironment: production',
    )
    expect(productionWorkflowErrors(validDev, commented)).toEqual([])
  })

  it.each([
    // The split itself: a shared concurrency group is what let one pending
    // production approval cancel every later push before it reached dev.
    [validDev, validProd.replace('group: cd-prod', 'group: cd-dev')],
    [validDev.replace('concurrency:\n  group: cd-dev', ''), validProd],
    [`${validDev}\nenvironment: production`, validProd],
    [validDev.replace('wait-for-ci', ''), validProd],
    [
      validDev.replace('refs/heads/codex/ui-ux-iteration-2', 'refs/heads/another-branch'),
      validProd,
    ],
    [validDev.replace('ALLOW_DEV_CANDIDATE_DEPLOY', ''), validProd],
    [`${validDev}\nsupabase db reset`, validProd],
    [validDev, validProd.replace('environment: production', '')],
    [validDev, validProd.replace('--target=production --mode=postflight', '')],
    [validDev, validProd.replace('/api/health', '')],
    [validDev, validProd.replace('railway up\nrailway up', 'railway up')],
    [validDev, validProd.replace("if: github.event.workflow_run.head_branch == 'main'", '')],
    [validDev, validProd.replace('github.event.workflow_run.head_sha', 'github.sha')],
    [validDev, `${validProd}\nsupabase db reset`],
  ])('rejects a weakened pipeline', (dev, prod) => {
    expect(productionWorkflowErrors(dev, prod)).not.toEqual([])
  })
})

describe('destructive entry-point ratchet', () => {
  const compliantProdReset =
    'PRODUCTION_V2_RESET_EXECUTE PRODUCTION_V2_ZERO_DATA_ACK PRODUCTION_V2_RESET_CONFIRM --no-seed --yes supabase db reset'
  const compliantDevReset =
    'DEV_RESET_EXECUTE DEV_RESET_CONFIRM validateRemoteExecution --yes supabase db reset'

  it('permits only the guarded reset entry points', () => {
    expect(
      destructiveEntryPointErrors({
        'scripts/production-v2-reset.ts': compliantProdReset,
        'scripts/reset-dev.ts': compliantDevReset,
        'scripts/other.ts': 'safe',
      }),
    ).toEqual([])
  })

  it('rejects destructive commands elsewhere', () => {
    expect(
      destructiveEntryPointErrors({
        'scripts/production-v2-reset.ts': compliantProdReset,
        'scripts/reset-dev.ts': compliantDevReset,
        'scripts/other.ts': 'supabase db reset',
      }),
    ).not.toEqual([])
  })

  it('rejects a dev reset missing a guard marker', () => {
    expect(
      destructiveEntryPointErrors({
        'scripts/production-v2-reset.ts': compliantProdReset,
        'scripts/reset-dev.ts': compliantDevReset.replace('DEV_RESET_CONFIRM ', ''),
      }),
    ).toContainEqual(expect.stringContaining('dev reset is missing guard'))
  })

  it('rejects an absent dev reset entry point', () => {
    expect(
      destructiveEntryPointErrors({
        'scripts/production-v2-reset.ts': compliantProdReset,
      }),
    ).toContainEqual(expect.stringContaining('dev reset is missing guard'))
  })
})

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

const valid = `
name: CD
candidate_sha:
name: Deploy dev stage
REQUESTED_CANDIDATE_SHA
refs/heads/codex/redesign-v2
"$REQUESTED_CANDIDATE_SHA" != "$GITHUB_SHA"
ALLOW_DEV_CANDIDATE_DEPLOY
${migrationSteps('dev')}
railway up
name: Promote to production
if: github.ref == 'refs/heads/main'
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
    expect(productionWorkflowErrors(valid)).toEqual([])
  })

  it.each([
    valid.replace('environment: production', ''),
    valid.replace('--target=production --mode=postflight', ''),
    valid.replace('/api/health', ''),
    valid.replace('railway up\nrailway up', 'railway up'),
    valid.replace("if: github.ref == 'refs/heads/main'", ''),
    valid.replace('refs/heads/codex/redesign-v2', 'refs/heads/another-branch'),
    valid.replace('ALLOW_DEV_CANDIDATE_DEPLOY', ''),
    `${valid}\nsupabase db reset`,
  ])('rejects a weakened workflow', (workflow) => {
    expect(productionWorkflowErrors(workflow)).not.toEqual([])
  })
})

describe('destructive entry-point ratchet', () => {
  it('permits only the guarded one-time reset file', () => {
    expect(
      destructiveEntryPointErrors({
        'scripts/production-v2-reset.ts':
          'PRODUCTION_V2_RESET_EXECUTE PRODUCTION_V2_ZERO_DATA_ACK PRODUCTION_V2_RESET_CONFIRM --no-seed --yes supabase db reset',
        'scripts/other.ts': 'safe',
      }),
    ).toEqual([])
  })

  it('rejects destructive commands elsewhere', () => {
    expect(
      destructiveEntryPointErrors({
        'scripts/production-v2-reset.ts':
          'PRODUCTION_V2_RESET_EXECUTE PRODUCTION_V2_ZERO_DATA_ACK PRODUCTION_V2_RESET_CONFIRM --no-seed --yes',
        'scripts/other.ts': 'supabase db reset',
      }),
    ).not.toEqual([])
  })
})

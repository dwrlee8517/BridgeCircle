import { describe, expect, it } from 'vitest'
import { destructiveEntryPointErrors, productionWorkflowErrors } from './production-workflow'

const migrationSteps = (target: string) => `
  --target=${target} --mode=preflight
  --target=${target} --mode=dry-run
  --target=${target} --mode=apply
  --target=${target} --mode=postflight`

const valid = `
name: CD
name: Deploy dev stage
${migrationSteps('dev')}
railway up
name: Promote to production
environment: production
DOPPLER_TOKEN_PRD
${migrationSteps('production')}
production-v2-postflight.ts
/api/health
RAILWAY_WORKER_SERVICE
railway up
railway up`

describe('production workflow ratchet', () => {
  it('accepts database-before-code with exact-SHA web and worker deployment', () => {
    expect(productionWorkflowErrors(valid)).toEqual([])
  })

  it.each([
    valid.replace('environment: production', ''),
    valid.replace('--target=production --mode=postflight', ''),
    valid.replace('/api/health', ''),
    valid.replace('railway up\nrailway up', 'railway up'),
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

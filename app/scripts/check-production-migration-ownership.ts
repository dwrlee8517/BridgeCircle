import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { assertProductionMigrationWorkflow } from '../src/lib/cutover/production-migration-workflow'

const workflow = readFileSync(
  resolve('..', '.github', 'workflows', 'production-migration-ownership.yml'),
  'utf8',
)
const packageJson = JSON.parse(readFileSync(resolve('package.json'), 'utf8')) as {
  devDependencies?: Record<string, string>
}

try {
  assertProductionMigrationWorkflow(workflow, packageJson)
  console.log('Production migration ownership workflow is manual-only and fail-closed')
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}

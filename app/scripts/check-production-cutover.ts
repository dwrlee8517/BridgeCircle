import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { destructiveEntryPointErrors, productionWorkflowErrors } from '../src/lib/cutover/production-workflow'

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(?:ts|tsx|js|mjs|sh|yml|yaml)$/.test(name) ? [path] : []
  })
}

const root = resolve('..')
const workflow = readFileSync(join(root, '.github/workflows/cd.yml'), 'utf8')
const files = Object.fromEntries(
  sourceFiles(resolve('scripts'))
    .filter((path) => !/^check-/.test(relative(resolve('scripts'), path)))
    .map((path) => [relative(resolve('.'), path), readFileSync(path, 'utf8')]),
)
const errors = [...productionWorkflowErrors(workflow), ...destructiveEntryPointErrors(files)]
if (errors.length > 0) {
  for (const error of errors) console.error(error)
  process.exitCode = 1
} else {
  console.log('Production migration, reset, deployment, and worker boundaries are intact')
}

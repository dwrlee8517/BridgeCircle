import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { normalizeGeneratedDatabaseTypes } from '../src/db/database-types-normalizer'

const typesPath = resolve('src/db/database.types.ts')
writeFileSync(
  typesPath,
  normalizeGeneratedDatabaseTypes(readFileSync(typesPath, 'utf8')),
)

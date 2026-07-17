import { describe, expect, it } from 'vitest'
import {
  migrationVersionsFromFilenames,
  PROD_GITHUB_REF,
  PROD_GITHUB_REPOSITORY,
  PROD_PROJECT_REF,
  PROD_SUPABASE_ORIGIN,
  type ProductionTargetInput,
  validateMigrationHistory,
  validateProductionTarget,
} from './production-target'

const SHA = 'a'.repeat(40)

function validTarget(overrides: Partial<ProductionTargetInput> = {}): ProductionTargetInput {
  return {
    appEnv: 'prod',
    supabaseUrl: PROD_SUPABASE_ORIGIN,
    databaseUrl: `postgresql://postgres.${PROD_PROJECT_REF}:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres`,
    declaredProjectRef: PROD_PROJECT_REF,
    expectedSha: SHA,
    actualSha: SHA,
    githubRef: PROD_GITHUB_REF,
    githubRepository: PROD_GITHUB_REPOSITORY,
    cleanWorktree: true,
    ...overrides,
  }
}

describe('validateProductionTarget', () => {
  it('accepts the exact production pooler target', () => {
    expect(() => validateProductionTarget(validTarget())).not.toThrow()
  })

  it('accepts the exact production direct database target', () => {
    expect(() =>
      validateProductionTarget(
        validTarget({
          databaseUrl: `postgresql://postgres:password@db.${PROD_PROJECT_REF}.supabase.co:5432/postgres`,
        }),
      ),
    ).not.toThrow()
  })

  it.each([
    ['wrong app environment', { appEnv: 'dev' }],
    ['wrong declared project', { declaredProjectRef: 'ojpvahiuafdcynbdbmri' }],
    ['wrong API origin', { supabaseUrl: 'https://ojpvahiuafdcynbdbmri.supabase.co' }],
    [
      'lookalike API origin',
      { supabaseUrl: `https://${PROD_PROJECT_REF}.supabase.co.attacker.example` },
    ],
    [
      'development database',
      {
        databaseUrl:
          'postgresql://postgres.ojpvahiuafdcynbdbmri:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres',
      },
    ],
    [
      'database without a password',
      { databaseUrl: `postgresql://postgres@db.${PROD_PROJECT_REF}.supabase.co:5432/postgres` },
    ],
    [
      'non-Postgres database protocol',
      {
        databaseUrl: `https://postgres:password@db.${PROD_PROJECT_REF}.supabase.co:5432/postgres`,
      },
    ],
    [
      'unexpected database port',
      {
        databaseUrl: `postgresql://postgres:password@db.${PROD_PROJECT_REF}.supabase.co:9999/postgres`,
      },
    ],
    ['wrong repository', { githubRepository: 'someone/fork' }],
    ['non-main ref', { githubRef: 'refs/heads/codex/prod-migration-ownership' }],
    ['dirty checkout', { cleanWorktree: false }],
    ['short SHA', { expectedSha: 'abc123' }],
    ['mismatched SHA', { actualSha: 'b'.repeat(40) }],
  ])('rejects %s', (_label, overrides) => {
    expect(() => validateProductionTarget(validTarget(overrides))).toThrow()
  })
})

describe('validateMigrationHistory', () => {
  const first = '20260426213331'
  const second = '20260426214838'
  const probe = '20260718000000'

  it('accepts an exact no-op history', () => {
    expect(
      validateMigrationHistory({
        localVersions: [first, second],
        remoteVersions: [first, second],
        expectedPendingMigration: 'none',
      }),
    ).toEqual([])
  })

  it('accepts exactly one explicitly approved pending migration', () => {
    expect(
      validateMigrationHistory({
        localVersions: [first, second, probe],
        remoteVersions: [first, second],
        expectedPendingMigration: probe,
      }),
    ).toEqual([probe])
  })

  it('rejects remote-only history', () => {
    expect(() =>
      validateMigrationHistory({
        localVersions: [first],
        remoteVersions: [first, second],
        expectedPendingMigration: 'none',
      }),
    ).toThrow(/Remote-only/)
  })

  it('rejects an unapproved pending migration', () => {
    expect(() =>
      validateMigrationHistory({
        localVersions: [first, second, probe],
        remoteVersions: [first],
        expectedPendingMigration: probe,
      }),
    ).toThrow(/do not match/)
  })

  it('rejects malformed and duplicate versions', () => {
    expect(() =>
      validateMigrationHistory({
        localVersions: [first, first],
        remoteVersions: [first],
        expectedPendingMigration: 'none',
      }),
    ).toThrow(/duplicate/)
    expect(() =>
      validateMigrationHistory({
        localVersions: ['not-a-version'],
        remoteVersions: [],
        expectedPendingMigration: 'none',
      }),
    ).toThrow(/invalid/)
  })
})

describe('migrationVersionsFromFilenames', () => {
  it('extracts sorted versions and ignores non-SQL files', () => {
    expect(
      migrationVersionsFromFilenames([
        'README.md',
        '20260426214838_second.sql',
        '20260426213331_first.sql',
      ]),
    ).toEqual(['20260426213331', '20260426214838'])
  })

  it('rejects malformed SQL migration filenames', () => {
    expect(() => migrationVersionsFromFilenames(['manual-change.sql'])).toThrow(
      'Invalid migration filename',
    )
  })
})

import { describe, expect, it } from 'vitest'
import {
  authorizeDevSmoke,
  authorizeHostedDevSeed,
  DEV_APP_ORIGIN,
  DEV_PROJECT_REF,
  DEV_SUPABASE_ORIGIN,
  type DevPreflightInput,
  PROD_PROJECT_REF,
  parseReadOnlyCountResult,
  validateDevPreflight,
} from './dev-target'

const validPreflight: DevPreflightInput = {
  branch: 'codex/redesign-v2',
  cleanWorktree: true,
  mainIsAncestor: true,
  linkedProjectRef: DEV_PROJECT_REF,
  appEnv: 'dev',
  supabaseUrl: DEV_SUPABASE_ORIGIN,
  databaseUrl: `postgresql://postgres.${DEV_PROJECT_REF}:secret@aws-1-us-west-1.pooler.supabase.com:5432/postgres`,
}

describe('validateDevPreflight', () => {
  it('accepts only the complete allowlisted development target', () => {
    expect(() => validateDevPreflight(validPreflight)).not.toThrow()
  })

  it.each([
    ['wrong branch', { branch: 'main' }],
    ['dirty worktree', { cleanWorktree: false }],
    ['stale main ancestry', { mainIsAncestor: false }],
    ['unknown linked project', { linkedProjectRef: 'unknown-project' }],
    ['missing environment', { appEnv: undefined }],
    ['wrong environment', { appEnv: 'prod' }],
    ['missing Supabase URL', { supabaseUrl: undefined }],
    ['local Supabase URL', { supabaseUrl: 'http://127.0.0.1:54321' }],
    ['arbitrary remote Supabase URL', { supabaseUrl: 'https://example.supabase.co' }],
    ['development Supabase path', { supabaseUrl: `${DEV_SUPABASE_ORIGIN}/rest/v1` }],
    ['missing database URL', { databaseUrl: undefined }],
    ['arbitrary database URL', { databaseUrl: 'postgresql://postgres:x@db.example.com/postgres' }],
    [
      'lookalike pooler username',
      { databaseUrl: `postgresql://other.${DEV_PROJECT_REF}:x@pooler.supabase.com/postgres` },
    ],
    [
      'wrong database name',
      {
        databaseUrl: `postgresql://postgres.${DEV_PROJECT_REF}:x@pooler.supabase.com/template1`,
      },
    ],
  ])('rejects %s', (_name, change) => {
    expect(() => validateDevPreflight({ ...validPreflight, ...change })).toThrow()
  })

  it('accepts the exact direct database target form', () => {
    expect(() =>
      validateDevPreflight({
        ...validPreflight,
        databaseUrl: `postgresql://postgres:secret@db.${DEV_PROJECT_REF}.supabase.co/postgres`,
      }),
    ).not.toThrow()
  })

  it.each([
    {
      linkedProjectRef: PROD_PROJECT_REF,
    },
    {
      supabaseUrl: `https://${PROD_PROJECT_REF}.supabase.co`,
    },
    {
      databaseUrl: `postgresql://postgres.${PROD_PROJECT_REF}:secret@pooler.supabase.com/postgres`,
    },
  ])('explicitly refuses a production identifier', (change) => {
    expect(() => validateDevPreflight({ ...validPreflight, ...change })).toThrow(/production/i)
  })
})

describe('authorizeDevSmoke', () => {
  const sha = 'a'.repeat(40)

  it('stays disabled during the ordinary test matrix', () => {
    expect(
      authorizeDevSmoke({
        baseUrl: DEV_APP_ORIGIN,
        appEnv: 'dev',
        enabled: undefined,
        cutoverSha: sha,
      }),
    ).toBe(false)
  })

  it('allows an explicit localhost verification', () => {
    expect(
      authorizeDevSmoke({
        baseUrl: 'http://localhost:3002',
        appEnv: undefined,
        enabled: '1',
        cutoverSha: undefined,
      }),
    ).toBe(true)
  })

  it('allows the exact hosted dev origin with environment and SHA proof', () => {
    expect(
      authorizeDevSmoke({
        baseUrl: DEV_APP_ORIGIN,
        appEnv: 'dev',
        enabled: '1',
        cutoverSha: sha,
      }),
    ).toBe(true)
  })

  it.each([
    ['production origin', 'https://bridgecircle.org', 'dev', sha],
    ['arbitrary remote origin', 'https://preview.example.com', 'dev', sha],
    ['development query', `${DEV_APP_ORIGIN}?wrong=target`, 'dev', sha],
    ['wrong environment', DEV_APP_ORIGIN, 'prod', sha],
    ['missing SHA', DEV_APP_ORIGIN, 'dev', undefined],
    ['short SHA', DEV_APP_ORIGIN, 'dev', 'abc123'],
  ])('rejects %s', (_name, baseUrl, appEnv, cutoverSha) => {
    expect(() => authorizeDevSmoke({ baseUrl, appEnv, enabled: '1', cutoverSha })).toThrow()
  })
})

describe('authorizeHostedDevSeed', () => {
  it('leaves ordinary remote integration mode unauthorized without the flag', () => {
    expect(
      authorizeHostedDevSeed({ baseUrl: DEV_APP_ORIGIN, appEnv: 'dev', allowSeed: undefined }),
    ).toBe(false)
  })

  it('authorizes the exact development origin, environment, and one-time flag', () => {
    expect(authorizeHostedDevSeed({ baseUrl: DEV_APP_ORIGIN, appEnv: 'dev', allowSeed: '1' })).toBe(
      true,
    )
  })

  it.each([
    ['production', 'https://bridgecircle.org', 'prod'],
    ['arbitrary remote', 'https://preview.example.com', 'dev'],
    ['localhost', 'http://localhost:3000', 'dev'],
    ['development path', `${DEV_APP_ORIGIN}/help`, 'dev'],
    ['development query', `${DEV_APP_ORIGIN}?target=dev`, 'dev'],
  ])('rejects the flagged %s target', (_name, baseUrl, appEnv) => {
    expect(() => authorizeHostedDevSeed({ baseUrl, appEnv, allowSeed: '1' })).toThrow()
  })
})

describe('parseReadOnlyCountResult', () => {
  it('accepts a nonnegative integer count', () => {
    expect(parseReadOnlyCountResult({ status: 0, stdout: '42\n', stderr: '' })).toBe(42)
  })

  it('reports only an undefined relation as absent', () => {
    expect(
      parseReadOnlyCountResult({
        status: 1,
        stdout: '',
        stderr: 'ERROR:  42P01: relation does not exist',
      }),
    ).toBe('absent')
  })

  it.each([
    ['authentication failure', 2, '', 'psql: connection failed'],
    ['permission failure', 1, '', 'ERROR: 42501: permission denied'],
    ['empty success', 0, '', ''],
    ['negative success', 0, '-1\n', ''],
  ])('fails closed on %s', (_name, status, stdout, stderr) => {
    expect(() => parseReadOnlyCountResult({ status, stdout, stderr })).toThrow()
  })
})

import { describe, expect, it } from 'vitest'
import {
  DEV_CANDIDATE_BRANCH,
  DEV_PROJECT_REF,
  migrationVersionsFromFilenames,
  PROD_PROJECT_REF,
  pendingMigrationVersions,
  validateBootstrapInput,
  validateExactGitState,
  validateProductionResetAuthorization,
  validateRemoteTarget,
} from './remote-target'

const sha = 'a'.repeat(40)
const prod = {
  target: 'production' as const,
  appEnv: 'prod',
  supabaseUrl: `https://${PROD_PROJECT_REF}.supabase.co`,
  databaseUrl: `postgresql://postgres.${PROD_PROJECT_REF}:secret@aws-0-us-west-1.pooler.supabase.com:6543/postgres`,
}

describe('remote target guard', () => {
  it('accepts exact production and development targets', () => {
    expect(() => validateRemoteTarget(prod)).not.toThrow()
    expect(() =>
      validateRemoteTarget({
        target: 'dev',
        appEnv: 'dev',
        supabaseUrl: `https://${DEV_PROJECT_REF}.supabase.co`,
        databaseUrl: `postgresql://postgres:secret@db.${DEV_PROJECT_REF}.supabase.co:5432/postgres`,
      }),
    ).not.toThrow()
  })

  it.each([
    { appEnv: 'dev' },
    { supabaseUrl: `https://${DEV_PROJECT_REF}.supabase.co` },
    {
      databaseUrl: `postgresql://postgres.${DEV_PROJECT_REF}:secret@x.pooler.supabase.com/postgres`,
    },
  ])('rejects a mismatched production coordinate', (change) => {
    expect(() => validateRemoteTarget({ ...prod, ...change })).toThrow()
  })
})

describe('git and reset guard', () => {
  it('accepts normal main automation and exact detached reset execution', () => {
    expect(() =>
      validateExactGitState({
        headSha: sha,
        expectedSha: sha,
        cleanWorktree: true,
        branch: '',
        githubRef: 'refs/heads/main',
      }),
    ).not.toThrow()
    expect(() =>
      validateProductionResetAuthorization({
        ...prod,
        headSha: sha,
        expectedSha: sha,
        cleanWorktree: true,
        branch: '',
        execute: '1',
        zeroDataAcknowledged: '1',
        confirmation: `RESET ${PROD_PROJECT_REF} AT ${sha}`,
      }),
    ).not.toThrow()
  })

  it('accepts only an exact-SHA development candidate from the reviewed branch', () => {
    expect(() =>
      validateExactGitState({
        headSha: sha,
        expectedSha: sha,
        cleanWorktree: true,
        branch: '',
        githubRef: `refs/heads/${DEV_CANDIDATE_BRANCH}`,
        remoteTarget: 'dev',
        devCandidateConfirmation: `DEPLOY dev ${sha}`,
      }),
    ).not.toThrow()
  })

  it.each([
    { remoteTarget: 'production' as const },
    { devCandidateConfirmation: undefined },
    { devCandidateConfirmation: `DEPLOY dev ${'b'.repeat(40)}` },
    { githubRef: 'refs/heads/another-branch' },
  ])('rejects a weakened development-candidate authorization', (change) => {
    expect(() =>
      validateExactGitState({
        headSha: sha,
        expectedSha: sha,
        cleanWorktree: true,
        branch: '',
        githubRef: `refs/heads/${DEV_CANDIDATE_BRANCH}`,
        remoteTarget: 'dev',
        devCandidateConfirmation: `DEPLOY dev ${sha}`,
        ...change,
      }),
    ).toThrow()
  })

  it.each([
    { branch: 'main' },
    { execute: undefined },
    { zeroDataAcknowledged: undefined },
    { confirmation: 'RESET SOMETHING ELSE' },
    { expectedSha: 'b'.repeat(40) },
    { cleanWorktree: false },
  ])('fails closed when reset authorization changes', (change) => {
    expect(() =>
      validateProductionResetAuthorization({
        ...prod,
        headSha: sha,
        expectedSha: sha,
        cleanWorktree: true,
        branch: '',
        execute: '1',
        zeroDataAcknowledged: '1',
        confirmation: `RESET ${PROD_PROJECT_REF} AT ${sha}`,
        ...change,
      }),
    ).toThrow()
  })
})

describe('migration history', () => {
  it('parses active migration filenames and reports pending versions', () => {
    const versions = migrationVersionsFromFilenames(['20260713231344_v2_init.sql', 'README.md'])
    expect(versions).toEqual(['20260713231344'])
    expect(
      pendingMigrationVersions({
        localVersions: ['20260713231344', '20260715035148'],
        remoteVersions: versions,
      }),
    ).toEqual(['20260715035148'])
  })

  it('rejects remote-only history', () => {
    expect(() =>
      pendingMigrationVersions({
        localVersions: ['20260713231344'],
        remoteVersions: ['20260717213750'],
      }),
    ).toThrow(/Remote-only/)
  })
})

describe('bootstrap input', () => {
  it('normalizes a production bootstrap request', () => {
    expect(
      validateBootstrapInput({
        slug: 'chadwick-school',
        name: 'Chadwick School',
        email: 'Owner@Example.com',
        token: 'a'.repeat(32),
        appOrigin: 'https://bridgecircle.org',
      }).email,
    ).toBe('owner@example.com')
  })

  it.each([
    { slug: 'Bad Slug' },
    { email: 'not-an-email' },
    { token: 'short' },
    { appOrigin: 'https://dev.bridgecircle.org' },
  ])('rejects unsafe bootstrap input', (change) => {
    expect(() =>
      validateBootstrapInput({
        slug: 'chadwick',
        name: 'Chadwick School',
        email: 'owner@example.com',
        token: 'a'.repeat(32),
        appOrigin: 'https://bridgecircle.org',
        ...change,
      }),
    ).toThrow()
  })
})

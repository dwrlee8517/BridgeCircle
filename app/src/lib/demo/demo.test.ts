import { describe, expect, it } from 'vitest'
import { authorizeDemoDoor, isDemoOperator } from '@/lib/demo/gate'
import { generateDemoToken, hashDemoToken, tokenHashesEqual } from '@/lib/demo/token'
import {
  armDemoWindow,
  closeDemoWindow,
  currentDemoWindow,
  type DemoWindowRecord,
  type DemoWindowsRepository,
  parseDemoWindowDuration,
  validateDemoEntry,
} from '@/lib/demo/windows'

const DEV_ORIGIN = 'https://dev.bridgecircle.org'

describe('authorizeDemoDoor', () => {
  it('is inert when the flag is absent, regardless of environment', () => {
    expect(
      authorizeDemoDoor({ enabled: undefined, appEnv: 'dev', configuredAppUrl: DEV_ORIGIN }),
    ).toBe(false)
    expect(authorizeDemoDoor({ enabled: '0', appEnv: 'dev', configuredAppUrl: DEV_ORIGIN })).toBe(
      false,
    )
    expect(authorizeDemoDoor({ enabled: '', appEnv: 'prod', configuredAppUrl: undefined })).toBe(
      false,
    )
  })

  it('allows the hosted dev origin with APP_ENV=dev', () => {
    expect(authorizeDemoDoor({ enabled: '1', appEnv: 'dev', configuredAppUrl: DEV_ORIGIN })).toBe(
      true,
    )
  })

  it('allows localhost with APP_ENV=local', () => {
    expect(
      authorizeDemoDoor({
        enabled: '1',
        appEnv: 'local',
        configuredAppUrl: 'http://localhost:3000',
      }),
    ).toBe(true)
  })

  it('throws on production-shaped configuration instead of allowing', () => {
    expect(() =>
      authorizeDemoDoor({
        enabled: '1',
        appEnv: 'prod',
        configuredAppUrl: 'https://bridgecircle.org',
      }),
    ).toThrow()
    expect(() =>
      authorizeDemoDoor({
        enabled: '1',
        appEnv: 'dev',
        configuredAppUrl: 'https://bridgecircle.org',
      }),
    ).toThrow()
    expect(() =>
      authorizeDemoDoor({ enabled: '1', appEnv: 'local', configuredAppUrl: DEV_ORIGIN }),
    ).toThrow()
    expect(() =>
      authorizeDemoDoor({ enabled: '1', appEnv: 'dev', configuredAppUrl: undefined }),
    ).toThrow()
  })
})

describe('isDemoOperator', () => {
  it('admits only allowlisted emails, case-insensitively', () => {
    const allowlist = 'rlee8517@gmail.com, other@example.com'
    expect(isDemoOperator('rlee8517@gmail.com', allowlist)).toBe(true)
    expect(isDemoOperator('RLee8517@Gmail.com', allowlist)).toBe(true)
    expect(isDemoOperator('other@example.com', allowlist)).toBe(true)
    expect(isDemoOperator('intruder@example.com', allowlist)).toBe(false)
  })

  it('admits no one when the allowlist is missing or empty', () => {
    expect(isDemoOperator('rlee8517@gmail.com', undefined)).toBe(false)
    expect(isDemoOperator('rlee8517@gmail.com', '')).toBe(false)
    expect(isDemoOperator('rlee8517@gmail.com', ' , ')).toBe(false)
    expect(isDemoOperator(null, 'rlee8517@gmail.com')).toBe(false)
    expect(isDemoOperator('', 'rlee8517@gmail.com')).toBe(false)
  })
})

describe('demo tokens', () => {
  it('generates url-safe tokens whose stored form is a sha256 hex digest', () => {
    const { token, tokenHash } = generateDemoToken()
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/)
    expect(hashDemoToken(token)).toBe(tokenHash)
  })

  it('compares hashes without leaking length mismatches as errors', () => {
    const a = hashDemoToken('one')
    expect(tokenHashesEqual(a, a)).toBe(true)
    expect(tokenHashesEqual(a, hashDemoToken('two'))).toBe(false)
    expect(tokenHashesEqual(a, 'short')).toBe(false)
  })
})

function fakeRepository() {
  const rows: Array<DemoWindowRecord & { revokedAt: string | null }> = []
  let sessionRevocations = 0
  let nextId = 1

  const repository: DemoWindowsRepository = {
    async insertWindow({ tokenHash, expiresAt }) {
      rows.push({
        id: String(nextId++),
        tokenHash,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date(0).toISOString(),
        revokedAt: null,
      })
    },
    async activeWindows(now) {
      return rows.filter((row) => row.revokedAt === null && new Date(row.expiresAt) > now)
    },
    async revokeAllWindows(now) {
      for (const row of rows) {
        if (row.revokedAt === null) row.revokedAt = now.toISOString()
      }
    },
    async revokeDemoSessions() {
      sessionRevocations += 1
    },
  }

  return {
    repository,
    rows,
    sessionRevocations: () => sessionRevocations,
  }
}

describe('demo windows', () => {
  const now = new Date('2026-08-14T12:00:00Z')

  it('parses only the offered durations', () => {
    expect(parseDemoWindowDuration('30')).toBe(30)
    expect(parseDemoWindowDuration('480')).toBe(480)
    expect(parseDemoWindowDuration('45')).toBeNull()
    expect(parseDemoWindowDuration('')).toBeNull()
    expect(parseDemoWindowDuration(undefined)).toBeNull()
  })

  it('arming revokes previous windows and sessions, then admits the fresh token only', async () => {
    const fake = fakeRepository()
    const first = await armDemoWindow({
      repository: fake.repository,
      now,
      durationMinutes: 30,
      armedByUserId: 'user-1',
    })
    const second = await armDemoWindow({
      repository: fake.repository,
      now,
      durationMinutes: 120,
      armedByUserId: 'user-1',
    })

    expect(fake.sessionRevocations()).toBe(2)
    expect(second.expiresAt.getTime()).toBe(now.getTime() + 120 * 60_000)
    await expect(
      validateDemoEntry({ repository: fake.repository, now, token: first.token }),
    ).resolves.toBe(false)
    await expect(
      validateDemoEntry({ repository: fake.repository, now, token: second.token }),
    ).resolves.toBe(true)
  })

  it('rejects entry after expiry and after an explicit close', async () => {
    const fake = fakeRepository()
    const { token } = await armDemoWindow({
      repository: fake.repository,
      now,
      durationMinutes: 30,
      armedByUserId: 'user-1',
    })

    const afterExpiry = new Date(now.getTime() + 31 * 60_000)
    await expect(
      validateDemoEntry({ repository: fake.repository, now: afterExpiry, token }),
    ).resolves.toBe(false)

    await closeDemoWindow({ repository: fake.repository, now })
    await expect(validateDemoEntry({ repository: fake.repository, now, token })).resolves.toBe(
      false,
    )
    expect(fake.sessionRevocations()).toBe(2)
  })

  it('rejects garbage tokens without touching the repository shape', async () => {
    const fake = fakeRepository()
    await armDemoWindow({
      repository: fake.repository,
      now,
      durationMinutes: 30,
      armedByUserId: 'user-1',
    })
    await expect(validateDemoEntry({ repository: fake.repository, now, token: '' })).resolves.toBe(
      false,
    )
    await expect(
      validateDemoEntry({ repository: fake.repository, now, token: 'x'.repeat(500) }),
    ).resolves.toBe(false)
  })

  it('reports the current window for the arm page', async () => {
    const fake = fakeRepository()
    await expect(currentDemoWindow({ repository: fake.repository, now })).resolves.toBeNull()
    await armDemoWindow({
      repository: fake.repository,
      now,
      durationMinutes: 30,
      armedByUserId: 'user-1',
    })
    const window = await currentDemoWindow({ repository: fake.repository, now })
    expect(window?.expiresAt).toBe(new Date(now.getTime() + 30 * 60_000).toISOString())
  })
})

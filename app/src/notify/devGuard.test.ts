import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEV_EMAIL_SINK, parseAllowlist, resolveDevRecipient } from './devGuard'

describe('resolveDevRecipient', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('passes recipients through unchanged in prod', () => {
    expect(resolveDevRecipient('alum@chadwickschool.org', { appEnv: 'prod' })).toEqual({
      to: 'alum@chadwickschool.org',
      redirectedFrom: null,
    })
  })

  it('redirects a real address to the safe sink outside prod', () => {
    expect(resolveDevRecipient('alum@chadwickschool.org', { appEnv: 'dev' })).toEqual({
      to: DEV_EMAIL_SINK,
      redirectedFrom: 'alum@chadwickschool.org',
    })
  })

  it('redirects bouncing seed @example.com addresses on local', () => {
    expect(resolveDevRecipient('seed-user@example.com', { appEnv: 'local' })).toEqual({
      to: DEV_EMAIL_SINK,
      redirectedFrom: 'seed-user@example.com',
    })
  })

  it('treats a missing APP_ENV as non-prod and redirects (safe default)', () => {
    expect(resolveDevRecipient('alum@chadwickschool.org', { appEnv: undefined })).toEqual({
      to: DEV_EMAIL_SINK,
      redirectedFrom: 'alum@chadwickschool.org',
    })
  })

  it('leaves resend.dev sink addresses untouched so E2E +labels survive', () => {
    const labeled = 'delivered+test_run123_helper@resend.dev'
    expect(resolveDevRecipient(labeled, { appEnv: 'dev' })).toEqual({
      to: labeled,
      redirectedFrom: null,
    })
  })

  it('does not treat a lookalike domain as a sink', () => {
    expect(resolveDevRecipient('someone@notresend.dev.example.com', { appEnv: 'dev' })).toEqual({
      to: DEV_EMAIL_SINK,
      redirectedFrom: 'someone@notresend.dev.example.com',
    })
  })

  it('honors an explicit sink override', () => {
    expect(
      resolveDevRecipient('alum@chadwickschool.org', { appEnv: 'dev', sink: 'me@gmail.com' }),
    ).toEqual({
      to: 'me@gmail.com',
      redirectedFrom: 'alum@chadwickschool.org',
    })
  })

  it('reads APP_ENV, EMAIL_DEV_REDIRECT, and EMAIL_DEV_ALLOWLIST from the environment by default', () => {
    vi.stubEnv('APP_ENV', 'dev')
    vi.stubEnv('EMAIL_DEV_REDIRECT', 'inbox@example.test')
    vi.stubEnv('EMAIL_DEV_ALLOWLIST', 'dev@bridgecircle.org')
    expect(resolveDevRecipient('alum@chadwickschool.org')).toEqual({
      to: 'inbox@example.test',
      redirectedFrom: 'alum@chadwickschool.org',
    })
    expect(resolveDevRecipient('dev@bridgecircle.org')).toEqual({
      to: 'dev@bridgecircle.org',
      redirectedFrom: null,
    })
  })

  describe('dev allowlist', () => {
    it('passes an allowlisted address through to its real inbox', () => {
      expect(
        resolveDevRecipient('rlee8517@gmail.com', {
          appEnv: 'dev',
          allowlist: ['rlee8517@gmail.com', 'daniel@bridgecircle.org'],
        }),
      ).toEqual({ to: 'rlee8517@gmail.com', redirectedFrom: null })
    })

    it('still redirects addresses not on the allowlist', () => {
      expect(
        resolveDevRecipient('alum@chadwickschool.org', {
          appEnv: 'dev',
          allowlist: ['rlee8517@gmail.com'],
        }),
      ).toEqual({ to: DEV_EMAIL_SINK, redirectedFrom: 'alum@chadwickschool.org' })
    })

    it('matches case-insensitively and ignores surrounding whitespace', () => {
      expect(
        resolveDevRecipient('  RLee8517@Gmail.com ', {
          appEnv: 'dev',
          allowlist: ['rlee8517@gmail.com'],
        }),
      ).toEqual({ to: '  RLee8517@Gmail.com ', redirectedFrom: null })
    })

    it('an empty allowlist changes nothing — everything non-sink redirects', () => {
      expect(resolveDevRecipient('rlee8517@gmail.com', { appEnv: 'dev', allowlist: [] })).toEqual({
        to: DEV_EMAIL_SINK,
        redirectedFrom: 'rlee8517@gmail.com',
      })
    })

    it('never overrides prod — allowlist is a non-prod concept only', () => {
      expect(
        resolveDevRecipient('alum@chadwickschool.org', { appEnv: 'prod', allowlist: [] }),
      ).toEqual({ to: 'alum@chadwickschool.org', redirectedFrom: null })
    })
  })
})

describe('parseAllowlist', () => {
  it('returns an empty list for unset/empty input', () => {
    expect(parseAllowlist(undefined)).toEqual([])
    expect(parseAllowlist('')).toEqual([])
    expect(parseAllowlist('  ,  ,')).toEqual([])
  })

  it('splits, trims, lowercases, and drops blanks', () => {
    expect(parseAllowlist('  A@X.com , b@y.org ,')).toEqual(['a@x.com', 'b@y.org'])
  })
})

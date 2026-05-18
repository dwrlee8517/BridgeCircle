import { describe, expect, it } from 'vitest'
import { fallbackChainFor, providerFor, resolveProviderName } from './registry'

describe('resolveProviderName', () => {
  it('returns the documented defaults when env is empty', () => {
    const env = {} as Record<string, string | undefined>
    expect(resolveProviderName('onboarding', env)).toBe('linkdapi')
    expect(resolveProviderName('manual', env)).toBe('linkdapi')
    expect(resolveProviderName('sweep', env)).toBe('brightdata')
  })

  it('honors the per-job env override', () => {
    const env = {
      ENRICHMENT_PRIMARY_ONBOARDING: 'pdl',
      ENRICHMENT_PRIMARY_SWEEP: 'linkdapi',
    } as Record<string, string | undefined>
    expect(resolveProviderName('onboarding', env)).toBe('pdl')
    expect(resolveProviderName('sweep', env)).toBe('linkdapi')
    expect(resolveProviderName('manual', env)).toBe('linkdapi')
  })

  it('ignores unknown override values', () => {
    const env = { ENRICHMENT_PRIMARY_MANUAL: 'badname' } as Record<string, string | undefined>
    expect(resolveProviderName('manual', env)).toBe('linkdapi')
  })
})

describe('providerFor', () => {
  it('returns a provider whose name matches the resolved primary', () => {
    const provider = providerFor('onboarding', {} as Record<string, string | undefined>)
    expect(provider.name).toBe('linkdapi')
  })

  it('returns brightdata for the sweep job by default', () => {
    expect(providerFor('sweep', {} as Record<string, string | undefined>).name).toBe('brightdata')
  })
})

describe('fallbackChainFor', () => {
  it('returns the documented fallback names for onboarding', () => {
    const names = fallbackChainFor('onboarding', {} as Record<string, string | undefined>).map(
      (p) => p.name,
    )
    expect(names).toEqual(['pdl'])
  })

  it('excludes the primary from the fallback chain when overridden', () => {
    const env = { ENRICHMENT_PRIMARY_ONBOARDING: 'pdl' } as Record<string, string | undefined>
    const names = fallbackChainFor('onboarding', env).map((p) => p.name)
    expect(names).not.toContain('pdl')
  })
})

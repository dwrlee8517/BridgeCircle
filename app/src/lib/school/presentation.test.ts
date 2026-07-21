import { describe, expect, it } from 'vitest'
import { newsletterDisplayTitle } from './presentation'

describe('newsletterDisplayTitle', () => {
  it('removes the retired newsletter name from legacy issue titles', () => {
    expect(newsletterDisplayTitle('The Bridge · July 2026')).toBe('July 2026')
    expect(newsletterDisplayTitle('The Bridge: June 2026')).toBe('June 2026')
  })

  it('preserves current titles', () => {
    expect(newsletterDisplayTitle('A summer return to campus')).toBe('A summer return to campus')
  })
})

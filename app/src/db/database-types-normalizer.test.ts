import { describe, expect, it } from 'vitest'
import { normalizeGeneratedDatabaseTypes } from './database-types-normalizer'

describe('normalizeGeneratedDatabaseTypes', () => {
  it('removes environment-owned PostgREST version metadata', () => {
    expect(
      normalizeGeneratedDatabaseTypes(`export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {}
  }
}
`),
    ).toBe(`export type Database = {
  public: {
    Tables: {}
  }
}
`)
  })

  it('preserves schema-only output and normalizes the final newline', () => {
    expect(normalizeGeneratedDatabaseTypes('export type Database = {}\n\n')).toBe(
      'export type Database = {}\n',
    )
  })

  it('fails closed when the generated metadata block is malformed', () => {
    expect(() =>
      normalizeGeneratedDatabaseTypes(`export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5'
`),
    ).toThrow('Generated __InternalSupabase metadata block is malformed')
  })
})

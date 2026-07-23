import { describe, expect, it } from 'vitest'
import { readHelpMode, writeHelpMode } from './help-mode-preference'

describe('Help mode preference', () => {
  it('defaults to Get and persists each member independently', () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    }

    expect(readHelpMode(storage, 'member-a')).toBe('get')
    writeHelpMode(storage, 'member-a', 'give')
    expect(readHelpMode(storage, 'member-a')).toBe('give')
    expect(readHelpMode(storage, 'member-b')).toBe('get')
  })

  it('falls back safely when storage is unavailable', () => {
    const unavailable = {
      getItem: () => {
        throw new Error('unavailable')
      },
      setItem: () => {
        throw new Error('unavailable')
      },
    }

    expect(readHelpMode(unavailable, 'member-a')).toBe('get')
    expect(() => writeHelpMode(unavailable, 'member-a', 'give')).not.toThrow()
  })
})

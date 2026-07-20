import { describe, expect, it } from 'vitest'
import { resumeImportSourceKey } from './import-source'

describe('resumeImportSourceKey', () => {
  it('is deterministic and changes with the uploaded content', () => {
    const first = resumeImportSourceKey(Buffer.from('resume one'))

    expect(first).toMatch(/^[0-9a-f]{64}$/)
    expect(resumeImportSourceKey(Buffer.from('resume one'))).toBe(first)
    expect(resumeImportSourceKey(Buffer.from('resume two'))).not.toBe(first)
  })
})

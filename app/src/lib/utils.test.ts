import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  // Regression: tailwind-merge buckets unregistered `text-<name>` utilities as
  // text COLORS. Before the font-size class-group extension, a custom size
  // followed by a real color in the same cn() call was silently dropped and
  // the element inherited the 16px root size (the Messages "type barbell").
  it('keeps custom font-size utilities alongside text colors', () => {
    expect(cn('truncate text-control text-foreground')).toContain('text-control')
    expect(cn('text-chip font-semibold', 'text-text-secondary')).toContain('text-chip')
    expect(cn('text-body-sm', 'text-muted-foreground')).toContain('text-body-sm')
  })

  it('still merges two font sizes to the later one', () => {
    expect(cn('text-control', 'text-caption')).toBe('text-caption')
    expect(cn('text-sm', 'text-body-lg')).toBe('text-body-lg')
  })

  it('still merges two text colors to the later one', () => {
    expect(cn('text-foreground', 'text-muted-foreground')).toBe('text-muted-foreground')
  })

  it('collapses custom shadow utilities within the shadow group', () => {
    expect(cn('shadow-none', 'shadow-card-hover')).toBe('shadow-card-hover')
  })
})

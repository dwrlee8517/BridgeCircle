import { describe, expect, it } from 'vitest'
import { WINDOW_CLASS_MIN_WIDTH, windowClassForWidth } from './window-class'

describe('windowClassForWidth', () => {
  it('classifies phone widths as compact', () => {
    expect(windowClassForWidth(320)).toBe('compact')
    expect(windowClassForWidth(430)).toBe('compact')
    expect(windowClassForWidth(760)).toBe('compact')
  })

  it('classifies tablet widths as medium', () => {
    expect(windowClassForWidth(761)).toBe('medium')
    expect(windowClassForWidth(834)).toBe('medium')
    expect(windowClassForWidth(1023)).toBe('medium')
  })

  it('classifies large widths as expanded', () => {
    expect(windowClassForWidth(1024)).toBe('expanded')
    expect(windowClassForWidth(1366)).toBe('expanded')
  })

  it('keeps thresholds aligned with the shared contract file', async () => {
    // parity/window-classes.json is the cross-platform source of truth; the
    // web viewport projects derive from the same file. If this fails, one
    // side changed a breakpoint without the other.
    const contract = await import('../../../parity/window-classes.json')
    expect(WINDOW_CLASS_MIN_WIDTH.medium).toBe(contract.default.medium.minWidth)
    expect(WINDOW_CLASS_MIN_WIDTH.expanded).toBe(contract.default.expanded.minWidth)
  })
})

/**
 * Window size classes shared with the web app.
 *
 * The thresholds mirror parity/window-classes.json, which in turn mirrors the
 * web breakpoints: `detail:` (761px, the master-detail pivot in globals.css)
 * and `lg:` (1024px). Web Playwright viewport projects and these classes must
 * agree — parity layout coverage is declared in terms of these three names.
 *
 * - compact:  phones (bottom tab bar)
 * - medium:   small tablets / portrait tablets (bottom tab bar, wider gutters)
 * - expanded: large tablets / iPad landscape (navigation rail, multi-column)
 *
 * Pure module — no react-native import, so vitest can load it. The hook
 * lives in use-window-class.ts.
 */
export type WindowClass = 'compact' | 'medium' | 'expanded'

export const WINDOW_CLASS_MIN_WIDTH = {
  medium: 761,
  expanded: 1024,
} as const

export function windowClassForWidth(width: number): WindowClass {
  if (width >= WINDOW_CLASS_MIN_WIDTH.expanded) return 'expanded'
  if (width >= WINDOW_CLASS_MIN_WIDTH.medium) return 'medium'
  return 'compact'
}

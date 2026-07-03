import { cn } from '@/lib/utils'

/**
 * The circle mark — BridgeCircle's two overlapping circles, shown next to a
 * name when that person is in the viewer's circle (connected via Connect).
 * It's the quiet recognition cue on the Messages surface (ADR 0011 Phase 3):
 * a class year says *when*, the mark says *they're yours*.
 *
 * Stroke is `currentColor`; callers set the hue with a text-* class
 * (default usage is `text-primary`). Sized in `em` so it tracks the
 * adjacent text. Decorative-adjacent but meaningful, so it carries an
 * accessible label rather than `aria-hidden`.
 */
export function CircleMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 12"
      role="img"
      aria-label="In your circle"
      className={cn('inline-block h-[0.72em] w-[1.2em] shrink-0', className)}
    >
      <circle cx="7.2" cy="6" r="4.4" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12.8" cy="6" r="4.4" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

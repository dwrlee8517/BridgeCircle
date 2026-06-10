import { cn } from '@/lib/utils'

/**
 * The brand's overlapping-circles motif. Sanctioned surfaces only:
 * Midnight editorial moments (auth panel, featured-event hero) and shared
 * empty states — never general card decoration (tokens.md § motif rule).
 *
 * Stroke color comes from `currentColor`, so callers set it via text-*
 * classes (e.g. `text-primary-on-dark` on Midnight, `text-muted-foreground`
 * on light empty states) and tune opacity via className.
 */
export function CirclesMotif({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 200 130" className={cn('pointer-events-none', className)}>
      <circle cx="75" cy="65" r="55" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="125" cy="65" r="55" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

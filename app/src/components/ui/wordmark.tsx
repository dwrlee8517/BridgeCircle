import { cn } from '@/lib/utils'

/**
 * Canonical BridgeCircle lockup: overlapping-circles icon + "BridgeCircle"
 * in a single ink (2026-08 mark refresh — "tuned baseline + quiet ink").
 * The blue lives only in the mark, so the lockup spends its accent once;
 * the name survives print and monochrome untouched. One component so the
 * wordmark renders identically on every surface — header, auth, onboarding,
 * 404.
 *
 * Mark geometry: two equal open circles, deeper overlap and heavier stroke
 * than the pre-refresh mark, accent aligned to --primary so the mark matches
 * the product's actionable blue. CircleMark shares this geometry.
 *
 * `editorial` is the Ink-surface variant (light ink + primary-on-dark
 * accent). The wordmark is one continuous word; never break or re-space it.
 */
export function Wordmark({
  variant = 'light',
  withIcon = true,
  className,
  textClassName,
}: {
  variant?: 'light' | 'editorial'
  withIcon?: boolean
  className?: string
  textClassName?: string
}) {
  const isEditorial = variant === 'editorial'
  const baseInk = isEditorial ? 'text-surface-editorial-foreground' : 'text-foreground'
  const accentStroke = isEditorial ? 'var(--primary-on-dark)' : 'var(--primary)'

  return (
    <span className={cn('inline-flex items-center gap-2.5', baseInk, className)}>
      {withIcon ? (
        <svg width="28" height="28" viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
          <circle cx="25" cy="32" r="19" fill="none" stroke="currentColor" strokeWidth="5" />
          <circle cx="39" cy="32" r="19" fill="none" stroke={accentStroke} strokeWidth="5" />
        </svg>
      ) : null}
      <span
        className={cn('bc-display text-lg font-bold leading-none tracking-tight', textClassName)}
      >
        BridgeCircle
      </span>
    </span>
  )
}

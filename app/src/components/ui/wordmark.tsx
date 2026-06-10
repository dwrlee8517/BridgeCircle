import { cn } from '@/lib/utils'

/**
 * Canonical BridgeCircle lockup: overlapping-circles icon + two-tone
 * "BridgeCircle" (Circle in Electric Sky). One component so the wordmark
 * renders identically on every surface — header, auth, onboarding, 404.
 *
 * `editorial` is the Midnight-surface variant (light ink + primary-on-dark
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
  const accentInk = isEditorial ? 'text-primary-on-dark' : 'text-primary'
  const accentStroke = isEditorial ? 'var(--primary-on-dark)' : 'var(--primary)'

  return (
    <span className={cn('inline-flex items-center gap-2.5', baseInk, className)}>
      {withIcon ? (
        <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" className="shrink-0">
          <circle cx="11" cy="14" r="9" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="17" cy="14" r="9" fill="none" stroke={accentStroke} strokeWidth="1.4" />
        </svg>
      ) : null}
      <span
        className={cn(
          'bc-fraunces text-lg font-bold leading-none tracking-[-0.02em]',
          textClassName,
        )}
      >
        Bridge
        <span className={accentInk}>Circle</span>
      </span>
    </span>
  )
}

import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Semantic status pill for member / mentorship / membership states.
 *
 * Why a separate component instead of using Badge variants directly:
 * shadcn's Badge uses primary/secondary/destructive — fine for "is this an
 * action?" but it can't tell mentor-availability apart from request-status.
 * StatusBadge owns the semantic mapping in one place so every page renders
 * the same color for the same state.
 *
 * Tone guide:
 *   - "open"    → green (mentor accepting)
 *   - "warn"    → amber (paused, pending, stale)
 *   - "alert"   → red (revoked, declined, error)
 *   - "info"    → blurple (active, accepted, neutral-positive)
 *   - "muted"   → grey (no signal, deactivated)
 */
const statusBadgeVariants = cva(
  'inline-flex h-5 w-fit shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        open: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
        warn: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
        alert: 'bg-destructive/10 text-destructive',
        info: 'bg-primary/10 text-primary',
        muted: 'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: { tone: 'muted' },
  },
)

export type StatusBadgeProps = React.ComponentProps<'span'> &
  VariantProps<typeof statusBadgeVariants> & {
    /** Show a colored dot before the label. Subtle but reads as an "indicator." */
    dot?: boolean
  }

export function StatusBadge({
  tone,
  dot = false,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ tone }), className)} {...props}>
      {dot ? (
        <span
          className={cn('inline-block size-1.5 rounded-full', dotClass(tone ?? 'muted'))}
          aria-hidden
        />
      ) : null}
      {children}
    </span>
  )
}

function dotClass(tone: NonNullable<StatusBadgeProps['tone']>) {
  switch (tone) {
    case 'open':
      return 'bg-emerald-500'
    case 'warn':
      return 'bg-amber-500'
    case 'alert':
      return 'bg-destructive'
    case 'info':
      return 'bg-primary'
    case 'muted':
      return 'bg-muted-foreground'
  }
}

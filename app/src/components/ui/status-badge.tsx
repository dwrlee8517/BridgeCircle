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
  'inline-flex w-fit shrink-0 items-center rounded-lg whitespace-nowrap',
  {
    variants: {
      tone: {
        open: 'bg-accent-sage/10 text-accent-sage border border-accent-sage/20',
        warn: 'bg-accent-ochre/10 text-accent-ochre border border-accent-ochre/20',
        alert: 'bg-accent-rust/10 text-accent-rust border border-accent-rust/20',
        info: 'bg-primary/10 text-primary border border-primary/20',
        muted: 'bg-muted text-muted-foreground border border-border/30',
        sage: 'bg-accent-sage/10 text-accent-sage border border-accent-sage/20',
        ochre: 'bg-accent-ochre/10 text-accent-ochre border border-accent-ochre/20',
        rust: 'bg-accent-rust/10 text-accent-rust border border-accent-rust/20',
        plum: 'bg-accent-plum/10 text-accent-plum border border-accent-plum/20',
      },
      size: {
        sm: 'h-5 px-2 text-[10px] font-semibold gap-1',
        md: 'h-6 px-2.5 py-0.5 text-xs font-medium gap-1.5',
      },
    },
    defaultVariants: {
      tone: 'muted',
      size: 'md',
    },
  },
)

export type StatusBadgeProps = React.ComponentProps<'span'> &
  VariantProps<typeof statusBadgeVariants> & {
    /** Show a colored dot before the label. Subtle but reads as an "indicator." */
    dot?: boolean
  }

export function StatusBadge({
  tone,
  size = 'md',
  dot = false,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ tone, size }), className)} {...props}>
      {dot ? (
        <span
          className={cn('shrink-0 size-1.5 rounded-full', dotClass(tone ?? 'muted'))}
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
    case 'sage':
      return 'bg-accent-sage'
    case 'warn':
    case 'ochre':
      return 'bg-accent-ochre'
    case 'alert':
    case 'rust':
      return 'bg-accent-rust'
    case 'plum':
      return 'bg-accent-plum'
    case 'info':
      return 'bg-primary'
    case 'muted':
      return 'bg-muted-foreground'
  }
}

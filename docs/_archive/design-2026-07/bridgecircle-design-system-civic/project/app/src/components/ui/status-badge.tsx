import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Semantic status pill for member / mentorship / membership states.
 *
 * Why a separate component instead of using Badge variants directly:
 * shadcn's Badge uses primary/secondary/destructive - fine for "is this an
 * action?" but it can't tell mentor-availability apart from request-status.
 * StatusBadge owns the semantic mapping in one place so every page renders
 * the same color for the same state.
 *
 * Tone guide:
 *   - "open"    -> success (mentor accepting)
 *   - "warn"    -> warning (paused, pending, stale)
 *   - "alert"   -> danger (revoked, declined, error)
 *   - "info"    -> info (active, accepted, neutral-positive)
 *   - "muted"   -> muted (no signal, deactivated)
 */
const statusBadgeVariants = cva(
  'bc-motion-control inline-flex w-fit shrink-0 items-center rounded-md whitespace-nowrap',
  {
    variants: {
      tone: {
        open: 'bg-success-tint text-state-success-foreground border border-state-success/20',
        warn: 'bg-warning-tint text-state-warning-foreground border border-state-warning/25',
        alert: 'bg-danger-tint text-state-danger-foreground border border-state-danger/20',
        info: 'bg-primary-tint text-state-info-foreground border border-state-info/20',
        muted: 'bg-surface-subtle text-state-muted border border-border/30',
        sage: 'bg-success-tint text-state-success-foreground border border-state-success/20',
        ochre: 'bg-warning-tint text-state-warning-foreground border border-state-warning/25',
        rust: 'bg-danger-tint text-state-danger-foreground border border-request-declined/20',
        plum: 'bg-plum-tint text-state-categorized-foreground border border-state-categorized/20',
      },
      size: {
        sm: 'h-4 px-1.5 text-[9px] font-semibold gap-0.5',
        md: 'h-5 px-2 py-0.5 text-[11px] font-medium gap-1',
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
          className={cn(
            'shrink-0 rounded-full',
            size === 'sm' ? 'size-1' : 'size-1.5',
            dotClass(tone ?? 'muted'),
          )}
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
      return 'bg-state-success'
    case 'warn':
    case 'ochre':
      return 'bg-state-warning'
    case 'alert':
      return 'bg-state-danger'
    case 'rust':
      return 'bg-request-declined'
    case 'plum':
      return 'bg-state-categorized'
    case 'info':
      return 'bg-state-info'
    case 'muted':
      return 'bg-state-muted'
  }
}

const lifecycleStatus = {
  pending: { tone: 'warn', label: 'pending', dot: true },
  accepted: { tone: 'info', label: 'accepted', dot: true },
  active: { tone: 'info', label: 'active', dot: true },
  completed: { tone: 'open', label: 'completed', dot: true },
  declined: { tone: 'alert', label: 'declined', dot: true },
  revoked: { tone: 'alert', label: 'revoked', dot: true },
  expired: { tone: 'muted', label: 'expired', dot: false },
  paused: { tone: 'warn', label: 'paused', dot: true },
  unread: { tone: 'warn', label: 'unread', dot: true },
  disabled: { tone: 'muted', label: 'disabled', dot: false },
  error: { tone: 'alert', label: 'error', dot: true },
} satisfies Record<
  string,
  { tone: NonNullable<StatusBadgeProps['tone']>; label: string; dot: boolean }
>

export type LifecycleStatus = keyof typeof lifecycleStatus

export type LifecycleStatusBadgeProps = Omit<StatusBadgeProps, 'tone' | 'children'> & {
  status: LifecycleStatus
  children?: React.ReactNode
}

export function LifecycleStatusBadge({
  status,
  dot,
  children,
  ...props
}: LifecycleStatusBadgeProps) {
  const config = lifecycleStatus[status]

  return (
    <StatusBadge tone={config.tone} dot={dot ?? config.dot} {...props}>
      {children ?? config.label}
    </StatusBadge>
  )
}

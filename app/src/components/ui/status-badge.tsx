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
  'bc-motion-control inline-flex w-fit shrink-0 items-center rounded-full whitespace-nowrap',
  {
    variants: {
      tone: {
        open: 'bg-success-tint text-state-success-foreground',
        warn: 'bg-warning-tint text-state-warning-foreground',
        alert: 'bg-danger-tint text-state-danger-foreground',
        info: 'bg-primary-tint text-state-info-foreground',
        muted: 'bg-surface-subtle text-state-muted',
        sage: 'bg-success-tint text-state-success-foreground',
        ochre: 'bg-warning-tint text-state-warning-foreground',
        rust: 'bg-danger-tint text-state-danger-foreground',
        plum: 'bg-plum-tint text-state-categorized-foreground',
      },
      size: {
        sm: 'min-h-5 px-2 py-0.5 text-xs font-medium gap-1',
        md: 'min-h-6 px-2 py-0.5 text-[13px] font-normal gap-1',
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

// Labels are sentence case — the one casing rule for status language across
// member and admin surfaces. Asker-facing surfaces that must soften
// "Declined" (voice § decline copy) pass their own children instead.
const lifecycleStatus = {
  pending: { tone: 'warn', label: 'Pending', dot: true },
  accepted: { tone: 'info', label: 'Accepted', dot: true },
  active: { tone: 'info', label: 'Active', dot: true },
  completed: { tone: 'open', label: 'Completed', dot: true },
  declined: { tone: 'alert', label: 'Declined', dot: true },
  revoked: { tone: 'alert', label: 'Revoked', dot: true },
  expired: { tone: 'muted', label: 'Expired', dot: false },
  paused: { tone: 'warn', label: 'Paused', dot: true },
  unread: { tone: 'warn', label: 'Unread', dot: true },
  disabled: { tone: 'muted', label: 'Disabled', dot: false },
  error: { tone: 'alert', label: 'Error', dot: true },
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

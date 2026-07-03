'use client'

import { cn } from '@/lib/utils'

export interface CapacityIndicatorGaugeProps {
  activeCount: number
  maxActive: number
  pendingCount: number
  maxPending: number
  isCompact?: boolean
  variant?: 'default' | 'compact' | 'inline'
  className?: string
}

export function CapacityIndicatorGauge({
  activeCount,
  maxActive,
  pendingCount,
  maxPending,
  isCompact = false,
  variant,
  className,
}: CapacityIndicatorGaugeProps) {
  const activeRatio = maxActive > 0 ? activeCount / maxActive : 0
  const pendingRatio = maxPending > 0 ? pendingCount / maxPending : 0

  const getGaugeTone = (ratio: number) => {
    if (ratio <= 0.5) {
      return { bar: 'bg-state-success', text: 'text-state-success-foreground' }
    }
    if (ratio <= 0.85) {
      return { bar: 'bg-state-warning', text: 'text-state-warning-foreground' }
    }
    return { bar: 'bg-state-danger', text: 'text-state-danger-foreground' }
  }

  const activeTone = getGaugeTone(activeRatio)
  const pendingTone = getGaugeTone(pendingRatio)

  const mode = variant ?? (isCompact ? 'compact' : 'default')

  if (mode === 'inline') {
    return (
      <div
        className={cn(
          'flex h-5 items-center gap-1.5 font-mono text-xs leading-none tracking-tight text-muted-foreground',
          className,
        )}
      >
        <span>CAPACITY:</span>
        <span className="text-muted-foreground/40 font-sans">[</span>
        <div className="h-1.5 w-16 bg-muted rounded-none overflow-hidden relative flex shrink-0">
          <div
            className={cn('h-full transition-[width] duration-slow ease-standard', activeTone.bar)}
            style={{ width: `${Math.min(activeRatio * 100, 100)}%` }}
          />
        </div>
        <span className="text-muted-foreground/40 font-sans">]</span>
        <span className="font-semibold text-foreground ml-1">
          {activeCount}/{maxActive} active
        </span>
      </div>
    )
  }

  if (mode === 'compact') {
    return (
      <div
        className={cn(
          'flex w-full flex-col gap-1 font-mono text-xs leading-none tracking-tight',
          className,
        )}
      >
        <div className="flex justify-between text-muted-foreground">
          <span>
            ONGOING: {activeCount}/{maxActive}
          </span>
          <span className={cn('font-semibold', activeTone.text)}>
            {Math.round(activeRatio * 100)}%
          </span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden relative">
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-slow ease-standard',
              activeTone.bar,
            )}
            style={{ width: `${Math.min(activeRatio * 100, 100)}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-3.5 rounded-md border border-border bg-card/50 p-3.5 font-mono text-xs leading-none',
        className,
      )}
    >
      {/* Active Mentees */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center font-medium text-foreground">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Ongoing conversations
          </span>
          <span>
            {activeCount} / {maxActive}
          </span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-slow ease-standard',
              activeTone.bar,
            )}
            style={{ width: `${Math.min(activeRatio * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{Math.round(activeRatio * 100)}% capacity</span>
          <span className={cn('font-medium', activeTone.text)}>
            {activeRatio >= 1.0
              ? 'At capacity'
              : activeRatio > 0.85
                ? 'Limited spots'
                : 'Open slots'}
          </span>
        </div>
      </div>

      {/* Pending Requests */}
      <div className="flex flex-col gap-1.5 border-t border-border/40 pt-3">
        <div className="flex justify-between items-center font-medium text-foreground">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Pending Requests
          </span>
          <span>
            {pendingCount} / {maxPending}
          </span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-slow ease-standard',
              pendingTone.bar,
            )}
            style={{ width: `${Math.min(pendingRatio * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{Math.round(pendingRatio * 100)}% queue</span>
          <span className={cn('font-medium', pendingTone.text)}>
            {pendingRatio >= 1.0
              ? 'Queue Full'
              : pendingRatio > 0.85
                ? 'Busy queue'
                : 'Fast response'}
          </span>
        </div>
      </div>
    </div>
  )
}

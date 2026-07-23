import type * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Microcopy that carries a trust promise ("declining is quiet", "searches are
 * private"). Pinned to text-muted (grey-600) — the AA floor on card surfaces —
 * because these are the last sentences that should be the faintest on the page.
 */
export function QuietNote({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      className={cn('text-xs leading-relaxed font-medium text-[var(--text-muted)]', className)}
      {...props}
    />
  )
}

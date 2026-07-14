import type * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      // See note on Input — password managers inject attrs pre-hydration.
      suppressHydrationWarning
      className={cn(
        'bc-motion-control flex field-sizing-content min-h-24 w-full rounded-[var(--radius-comfortable)] border border-input bg-surface-card px-3.5 py-3 text-base text-text-primary outline-none placeholder:text-text-faint focus-visible:border-focus-ring focus-visible:ring-4 focus-visible:ring-focus-ring-muted disabled:cursor-not-allowed disabled:bg-action-disabled disabled:text-action-disabled-text disabled:opacity-100 aria-invalid:border-state-danger aria-invalid:ring-4 aria-invalid:ring-danger-tint md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-state-danger/50',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }

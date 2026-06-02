import type * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      // See note on Input — password managers inject attrs pre-hydration.
      suppressHydrationWarning
      className={cn(
        'bc-motion-control flex field-sizing-content min-h-20 w-full rounded-md border border-input bg-surface-card px-3 py-2.5 text-base outline-none placeholder:text-muted-foreground focus-visible:border-focus-ring focus-visible:ring-4 focus-visible:ring-focus-ring-muted disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-60 aria-invalid:border-state-danger aria-invalid:ring-4 aria-invalid:ring-danger-tint md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-state-danger/50',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }

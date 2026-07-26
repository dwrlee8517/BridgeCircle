import type * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      // Password managers (Dashlane, 1Password, LastPass, etc.) inject
      // attributes like data-sharkid on form inputs before React hydrates,
      // which otherwise trips a hydration warning for every text field on
      // every page. The warning is harmless — extensions also do this in
      // prod for users — but the dev console gets noisy without this.
      suppressHydrationWarning
      className={cn(
        'bc-motion-control h-10 w-full min-w-0 rounded-lg border border-input bg-surface-card px-3 py-2 text-base outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-focus-ring focus-visible:ring-4 focus-visible:ring-focus-ring-muted disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-60 aria-invalid:border-state-danger aria-invalid:ring-4 aria-invalid:ring-danger-tint md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-state-danger/50',
        className,
      )}
      {...props}
    />
  )
}

export { Input }

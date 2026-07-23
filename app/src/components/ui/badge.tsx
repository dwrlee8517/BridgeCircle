import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type * as React from 'react'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'group/badge bc-motion-control inline-flex min-h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 aria-invalid:border-state-danger aria-invalid:ring-danger-tint [&>svg]:pointer-events-none [&>svg]:size-3!',
  {
    variants: {
      variant: {
        default: 'bg-action-primary text-action-on-primary [a]:hover:bg-action-primary-hover',
        secondary: 'bg-surface-subtle text-text-secondary [a]:hover:bg-border',
        destructive:
          'bg-state-danger-tint text-state-danger-text focus-visible:ring-danger-tint [a]:hover:bg-danger-tint',
        outline:
          'border-transparent bg-surface-card text-text-secondary shadow-[var(--ring-outline)] [a]:hover:bg-surface-subtle [a]:hover:text-text-primary',
        ghost:
          'text-text-secondary hover:bg-surface-subtle hover:text-text-primary dark:hover:bg-muted/50',
        link: 'text-link underline-offset-4 hover:text-link-hover hover:underline',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span'

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

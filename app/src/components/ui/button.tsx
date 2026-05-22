import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type * as React from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "group/button bc-motion-control inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap outline-none select-none focus-visible:border-focus-ring focus-visible:ring-4 focus-visible:ring-focus-ring-muted active:opacity-80 disabled:pointer-events-none disabled:opacity-60 aria-busy:pointer-events-none aria-busy:opacity-80 aria-invalid:border-state-danger aria-invalid:ring-4 aria-invalid:ring-danger-tint dark:aria-invalid:border-state-danger/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-action-primary text-action-on-primary hover:bg-action-primary-hover',
        outline:
          'border-border bg-surface-card text-foreground hover:bg-surface-subtle hover:text-foreground aria-expanded:bg-surface-subtle aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
        secondary:
          'bg-surface-panel text-secondary-foreground hover:bg-surface-subtle aria-expanded:bg-surface-panel aria-expanded:text-secondary-foreground',
        ghost:
          'hover:bg-surface-subtle hover:text-foreground aria-expanded:bg-surface-subtle aria-expanded:text-foreground dark:hover:bg-muted/50',
        destructive:
          'bg-danger-tint text-state-danger-foreground hover:bg-state-danger/15 focus-visible:border-state-danger/40 focus-visible:ring-danger-tint dark:hover:bg-state-danger/25',
        link: 'text-link underline-offset-4 hover:text-link-hover hover:underline',
      },
      size: {
        default:
          'h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3',
        xs: "h-7 gap-1 rounded-lg px-2.5 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-lg px-3 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-11 gap-2 px-5 text-[0.95rem] has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4',
        icon: 'size-10',
        'icon-xs':
          "size-7 rounded-lg in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8 rounded-lg in-data-[slot=button-group]:rounded-lg',
        'icon-lg': 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

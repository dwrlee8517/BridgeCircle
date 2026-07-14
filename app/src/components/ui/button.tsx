import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type * as React from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "group/button bc-motion-control inline-flex shrink-0 items-center justify-center rounded-[var(--radius-comfortable)] border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring active:opacity-80 disabled:pointer-events-none disabled:bg-action-disabled disabled:text-action-disabled-text disabled:opacity-100 aria-busy:pointer-events-none aria-busy:opacity-80 aria-invalid:border-state-danger aria-invalid:ring-4 aria-invalid:ring-danger-tint dark:aria-invalid:border-state-danger/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-action-primary text-action-on-primary hover:bg-action-primary-hover',
        // O8 — the single lead action on a local decision surface.
        cta: 'bg-cta bg-[image:var(--gradient-primary-btn)] text-cta-foreground shadow-[var(--shadow-primary-btn)] hover:opacity-95',
        // O2 — lead give-help commitments. The legacy name is retained while
        // route call sites migrate to the canonical action-give vocabulary.
        offer: 'bg-action-offer text-action-on-offer hover:bg-action-offer-hover',
        outline:
          'border-transparent bg-surface-card text-text-secondary shadow-[var(--ring-outline)] hover:bg-surface-subtle hover:text-text-primary aria-expanded:bg-surface-subtle aria-expanded:text-text-primary dark:bg-input/30 dark:hover:bg-input/50',
        secondary:
          'bg-action-weak text-action-weak-text hover:bg-primary-tint-strong aria-expanded:bg-action-weak aria-expanded:text-action-weak-text',
        ghost:
          'text-text-secondary hover:bg-surface-subtle hover:text-text-primary aria-expanded:bg-surface-subtle aria-expanded:text-text-primary dark:hover:bg-muted/50',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-state-danger focus-visible:border-state-danger/40 focus-visible:ring-danger-tint',
        link: 'text-link underline-offset-4 hover:text-link-hover hover:underline',
      },
      size: {
        default:
          'h-11 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4',
        xs: "h-8 gap-1 rounded-md px-2.5 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-md px-3 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-12 gap-2 px-6 text-sm has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5',
        icon: 'size-11',
        'icon-xs':
          "size-8 rounded-md in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-9 rounded-md in-data-[slot=button-group]:rounded-md',
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

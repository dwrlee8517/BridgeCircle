import type * as React from 'react'

import { cn } from '@/lib/utils'

function Card({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<'div'> & { size?: 'default' | 'sm' }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        'group/card bc-motion-surface flex flex-col gap-4 overflow-hidden rounded-md border border-border bg-surface-card py-[var(--space-card-padding)] text-sm text-card-foreground shadow-card has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[interactive=true]:hover:-translate-y-px data-[interactive=true]:hover:border-foreground/20 data-[interactive=true]:hover:shadow-card-hover data-[state=selected]:border-state-info/25 data-[state=selected]:bg-primary-tint data-[size=sm]:gap-3 data-[size=sm]:py-[var(--space-card-padding-compact)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-md *:[img:last-child]:rounded-b-md',
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        'group/card-header @container/card-header grid auto-rows-min items-start gap-1.5 rounded-t-md px-[var(--space-card-padding)] group-data-[size=sm]/card:px-[var(--space-card-padding-compact)] has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-5 group-data-[size=sm]/card:[.border-b]:pb-4',
        className,
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        'font-heading text-base leading-snug font-semibold group-data-[size=sm]/card:text-sm',
        className,
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        'px-[var(--space-card-padding)] group-data-[size=sm]/card:px-[var(--space-card-padding-compact)]',
        className,
      )}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        'flex items-center rounded-b-md border-t bg-surface-subtle/50 p-[var(--space-card-padding)] group-data-[size=sm]/card:p-[var(--space-card-padding-compact)]',
        className,
      )}
      {...props}
    />
  )
}

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle }

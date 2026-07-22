import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function FormMessage({
  tone,
  className,
  children,
  ...props
}: Omit<ComponentProps<'p'>, 'role'> & {
  tone: 'error' | 'success' | 'info'
  children: ReactNode
}) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'text-sm font-semibold',
        tone === 'error' && 'text-destructive',
        tone === 'success' && 'text-state-success-text',
        tone === 'info' && 'text-text-secondary',
        className,
      )}
      {...props}
    >
      {children}
    </p>
  )
}

export function FieldError({
  error,
  className,
  ...props
}: Omit<ComponentProps<'p'>, 'children' | 'role'> & {
  error?: string
}) {
  if (!error) return null
  return (
    <p
      role="alert"
      className={cn('mt-1.5 text-xs font-medium text-destructive', className)}
      {...props}
    >
      {error}
    </p>
  )
}

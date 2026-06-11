import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CirclesMotif } from '@/components/ui/circles-motif'
import { cn } from '@/lib/utils'

/**
 * Shared empty-state block. Replaces the lone-card-then-vast-emptiness
 * pattern that was making "nothing here yet" pages feel broken.
 *
 * Two sizes:
 *   - default  → for whole-page empties (e.g. /friends with no friends)
 *   - inline   → for empty sections within a denser page (e.g. /inbox's
 *                 three sub-sections, each of which can be empty
 *                 independently)
 */
export type EmptyStateProps = {
  icon?: LucideIcon
  title: string
  description?: string
  action?: { label: string; href: string }
  size?: 'default' | 'inline'
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = 'default',
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      {/* Brand motif — sanctioned on shared empty states (and Ink
          surfaces) only; whisper-quiet so the copy stays the focus. */}
      {size === 'default' ? (
        <CirclesMotif className="absolute -right-8 -top-10 h-32 w-48 text-muted-foreground opacity-[0.14]" />
      ) : null}
      <CardContent
        className={cn(
          'relative flex flex-col items-center text-center',
          size === 'default' ? 'gap-4 py-14' : 'gap-3 py-8',
        )}
      >
        {Icon ? (
          <div
            className={cn(
              'flex items-center justify-center rounded-full bg-primary-tint text-action-primary',
              size === 'default' ? 'size-12' : 'size-10',
            )}
          >
            <Icon className={size === 'default' ? 'size-5' : 'size-4'} />
          </div>
        ) : null}
        <div className="space-y-1">
          <p className={cn('font-medium', size === 'default' ? 'text-base' : 'text-sm')}>{title}</p>
          {description ? (
            <p
              className={cn(
                'text-muted-foreground',
                size === 'default' ? 'text-sm max-w-sm' : 'text-xs max-w-xs',
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
        {action ? (
          <Button asChild size={size === 'default' ? 'default' : 'sm'}>
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}

'use client'

import { cn } from '@/lib/utils'
import { useUserControl } from './user-control-provider'

export function MessagesAttentionBadge({ className }: { className?: string }) {
  const { messagesAttentionCount } = useUserControl()
  if (messagesAttentionCount < 1) return null
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-kicker font-bold leading-none text-primary-foreground tabular-nums',
        className,
      )}
    >
      {messagesAttentionCount > 99 ? '99+' : messagesAttentionCount}
    </span>
  )
}

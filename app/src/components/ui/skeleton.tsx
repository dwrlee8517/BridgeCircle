import { cn } from '@/lib/utils'

/**
 * Shimmer placeholder for content that's still loading. Used by route
 * loading.tsx files to mirror the page layout while server queries run,
 * so navigation feels instant instead of frozen. Keep skeletons close to
 * the actual layout — same heading sizes, same column counts — so the
 * shift on hydration is small.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('bc-skeleton rounded-[var(--radius-comfortable)]', className)}
      aria-hidden
      {...props}
    />
  )
}

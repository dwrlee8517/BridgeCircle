import { cn } from '@/lib/utils'

/**
 * Page-level two-column layout: main content + ~320px right rail. Stacks
 * to a single column on tablet/mobile (rail moves below main).
 *
 * Usage:
 *   <TwoColumn aside={<RightRail />}>
 *     <MainContent />
 *   </TwoColumn>
 *
 * The wrapper handles max-width and gutter padding. Pages drop their own
 * `mx-auto max-w-3xl px-4 py-8` and let TwoColumn own that.
 */
export function TwoColumn({
  children,
  aside,
  className,
}: {
  children: React.ReactNode
  aside: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mx-auto max-w-6xl px-4 py-8', className)}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <main className="min-w-0 space-y-6">{children}</main>
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">{aside}</aside>
      </div>
    </div>
  )
}

/**
 * Section card for the right rail. Slightly more compact than a full Card
 * — small heading, tight padding. Lets each rail section feel like a
 * peripheral widget, not a co-equal panel.
 */
export function RailSection({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-xl border bg-card p-4', className)}>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  )
}

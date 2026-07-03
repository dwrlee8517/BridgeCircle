import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * The two-sided switch at the top of the Help hub. One page, one toggle:
 * the demand side (ask for help) and the supply side (give help) live
 * behind the same door. Server component — just two links styled as a
 * segmented control; switching is a fast RSC navigation, and the mode
 * lives in the URL so it's shareable and back-button-friendly.
 */
export function HelpModeToggle({ mode }: { mode: 'ask' | 'give' }) {
  return (
    <div className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-5xl justify-center px-4 py-3 sm:px-8">
        <div
          role="tablist"
          aria-label="Ask for help or give help"
          className="inline-flex rounded-full border border-border bg-card p-1 shadow-card"
        >
          <Segment href="/" active={mode === 'ask'} label="Ask for help" />
          <Segment href="/?mode=give" active={mode === 'give'} label="Give help" />
        </div>
      </div>
    </div>
  )
}

function Segment({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      className={cn(
        'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
    </Link>
  )
}

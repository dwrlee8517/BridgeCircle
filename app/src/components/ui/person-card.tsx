import Image from 'next/image'
import { avatarColorClasses, cn, getInitials } from '@/lib/utils'

/**
 * Shared anatomy for demand-side person cards (components.md § Person Card).
 *
 * There is intentionally no `<PersonCard>` component — each surface owns its
 * layout grid, action rail, and availability-badge philosophy (those differ
 * on purpose: Home is a feed tile, Ask results is a decision brief, People is
 * a directory row). These are the leaves they compose, so the shared parts —
 * avatar treatment, match-band language, rationale typography, chip shape —
 * cannot drift between surfaces.
 *
 * Parts take primitives, not a shared Person type, so `HelpNetworkPerson`
 * and `ResultCardProps` both feed them without adapters.
 */

/**
 * Avatar with photo or colored-initials fallback (tokens.md § Avatar colors).
 * Default box is `size-12`; callers size via className
 * (e.g. `size-[52px] md:size-[72px] shadow-card`).
 */
export function PersonAvatar({
  userId,
  name,
  avatarUrl,
  shape = 'circle',
  className,
}: {
  userId: string
  name: string | null
  avatarUrl: string | null
  shape?: 'circle' | 'square'
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative size-12 shrink-0 overflow-hidden',
        shape === 'circle' ? 'rounded-full' : 'rounded-md',
        avatarColorClasses(userId),
        className,
      )}
    >
      {avatarUrl ? (
        <Image src={avatarUrl} alt="" fill sizes="96px" unoptimized className="object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center font-heading font-semibold">
          {getInitials(name)}
        </span>
      )}
    </div>
  )
}

/**
 * Match-band pill. Bands and wording live here only — the label and the
 * color must never drift apart, and raw percentages stay internal
 * (voice § ranking is invisible). Dot + tint together satisfy the
 * "never color alone" rule.
 */
export function MatchBandBadge({ score, className }: { score: number; className?: string }) {
  const tier = score >= 85 ? 'strong' : score >= 65 ? 'good' : 'possible'
  const label = tier === 'strong' ? 'Strong fit' : tier === 'good' ? 'Good fit' : 'Worth exploring'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold',
        tier === 'strong' && 'border-success-tint bg-success-tint text-state-success-foreground',
        tier === 'good' && 'border-primary/20 bg-primary-tint text-primary',
        tier === 'possible' && 'border-border bg-surface-subtle text-muted-foreground',
        className,
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          tier === 'strong' && 'bg-state-success',
          tier === 'good' && 'bg-primary',
          tier === 'possible' && 'bg-muted-foreground',
        )}
        aria-hidden
      />
      {label}
    </span>
  )
}

/**
 * Card label + rationale body. `human` flips to the pull-quote treatment —
 * quotes are reserved for words a member actually wrote; system rationale
 * always renders plain (tokens.md § quotes are sacred).
 */
export function RationaleBlock({
  label = 'Why they might fit',
  human = false,
  children,
  className,
  labelClassName,
  bodyClassName,
}: {
  /** Pass null to render the body without a label (e.g. a bare headline quote). */
  label?: string | null
  human?: boolean
  children: React.ReactNode
  className?: string
  labelClassName?: string
  bodyClassName?: string
}) {
  return (
    <div className={className}>
      {label ? <p className={cn('bc-card-label mb-1.5', labelClassName)}>{label}</p> : null}
      {human ? (
        <p className={cn('bc-pull-quote py-0 pl-3 italic leading-relaxed', bodyClassName)}>
          &ldquo;{children}&rdquo;
        </p>
      ) : (
        <p className={cn('leading-relaxed text-muted-foreground', bodyClassName)}>{children}</p>
      )}
    </div>
  )
}

/**
 * Quiet topic chips. rounded-sm per tokens.md — full circles are reserved
 * for avatars, dots, and controls. Caps at 3.
 */
export function TopicChips({ topics, className }: { topics: string[]; className?: string }) {
  if (topics.length === 0) return null
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {topics.slice(0, 3).map((topic) => (
        <span
          key={topic}
          className="inline-flex items-center rounded-sm bg-surface-subtle px-2 py-px text-xs text-muted-foreground"
        >
          {topic}
        </span>
      ))}
    </div>
  )
}

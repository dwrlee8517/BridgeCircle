import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Teach tailwind-merge about the custom theme tokens so that
// e.g. `cn('shadow-none', 'shadow-card-hover')` collapses to just
// `shadow-card-hover`. Without this, custom utilities aren't recognized as
// part of the shadow conflict group and both classes survive — the earlier
// one wins by CSS order, silently defeating the consumer override.
//
// The font-size group is load-bearing: tailwind-merge cannot tell a custom
// `text-<size>` utility from a `text-<color>` utility. Unregistered size
// names (text-control, text-chip, …) get bucketed as colors and are DROPPED
// whenever a real color class follows in the same cn() call — the element
// then silently inherits the 16px root size. Every named size from
// globals.css @theme must be listed here.
const FONT_SIZE_TOKENS = [
  'micro',
  'fine',
  'overline',
  'chip',
  'control',
  'kicker',
  'caption',
  'label',
  'nav',
  'body',
  'body-sm',
  'body-md',
  'body-lg',
  'subtitle',
  'heading',
  'heading-large',
  'section-title',
  'page-title',
  'h1',
  'h2',
  'display-md',
  'display-lg',
  'display-xl',
  'display-hero',
  'display-large',
  'display-event',
  'event-date',
  'event-date-md',
  'event-date-lg',
] as const

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      shadow: ['shadow-card', 'shadow-card-hover', 'shadow-hero'],
      'font-size': [{ text: [...FONT_SIZE_TOKENS] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Strip the "(DEV)" suffix from org names in production. The suffix is a
 * dev-data marker so we don't ship it to real users; in dev we keep it so we
 * remember which DB we're hitting.
 */
export function displayOrgName(name: string | null | undefined): string {
  const v = name ?? 'your network'
  if (process.env.NODE_ENV === 'production') {
    return v.replace(/\s*\(DEV\)\s*$/i, '').trim()
  }
  return v
}

/**
 * The name the directory should show for a member. Prefers `preferred_name`
 * (the day-to-day name) over `name` (the canonical / legal verification
 * anchor). Falls back to a sane default if both are missing.
 *
 * Pass null/undefined for either field — the function handles all
 * combinations. Use this anywhere we'd otherwise read `base_profiles.name`
 * directly for display.
 */
export function displayName(
  name: string | null | undefined,
  preferredName: string | null | undefined,
  fallback: string = 'Member',
): string {
  const trimmedPreferred = preferredName?.trim()
  if (trimmedPreferred && trimmedPreferred.length > 0) return trimmedPreferred
  const trimmedName = name?.trim()
  if (trimmedName && trimmedName.length > 0) return trimmedName
  return fallback
}

/**
 * Stable generated avatar colors for initials fallbacks (DESIGN.md § Avatars).
 * Six approved tint/ink pairs from the Civic palette — every pair is a
 * verified-contrast combination from tokens.md, so initials never fall below
 * 4.5:1. Full literal class strings so Tailwind's scanner picks them up.
 *
 * Seed on a stable id (userId) when available so a member's color never
 * changes; name is an acceptable fallback for display-only rows.
 */
const AVATAR_COLOR_CLASSES = [
  'bg-primary-tint text-primary',
  'bg-success-tint text-accent-sage',
  'bg-plum-tint text-accent-plum',
  'bg-warning-tint text-accent-ochre',
  'bg-danger-tint text-accent-rust',
  'bg-surface-editorial text-surface-editorial-foreground',
] as const

export function avatarColorClasses(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  return AVATAR_COLOR_CLASSES[Math.abs(hash) % AVATAR_COLOR_CLASSES.length]
}

/**
 * Two-letter initials for avatar fallbacks. One implementation for every
 * surface (was duplicated as `initials`/`initialsFor`/`getInitials` across
 * cards, events, school, and inbox).
 */
export function getInitials(name: string | null | undefined, fallback = '?'): string {
  const parts = (name ?? '').split(/\s+/).filter(Boolean)
  if (parts.length === 0) return fallback
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/** "'26"-style short class year, or null when unknown. */
export function classYearShort(year: number | null | undefined): string | null {
  if (year === null || year === undefined) return null
  return `'${String(year).slice(-2)}`
}

/**
 * Canonical link into the v2 direct-Ask composer. Help is membership-scoped,
 * so callers must use the candidate's membership ID rather than a user ID.
 */
export function directHelpHref(membershipId: string): string {
  return `/help/ask/${membershipId}`
}

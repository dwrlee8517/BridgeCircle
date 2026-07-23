const AVATAR_COLOR_CLASSES = [
  'bg-[var(--avatar-1-bg)] text-[var(--avatar-1-fg)]',
  'bg-[var(--avatar-2-bg)] text-[var(--avatar-2-fg)]',
  'bg-[var(--avatar-3-bg)] text-[var(--avatar-3-fg)]',
  'bg-[var(--avatar-4-bg)] text-[var(--avatar-4-fg)]',
  'bg-[var(--avatar-5-bg)] text-[var(--avatar-5-fg)]',
  'bg-[var(--avatar-6-bg)] text-[var(--avatar-6-fg)]',
] as const

/** Stable color assignment for the same person across every member surface. */
export function avatarColorClass(seed: string) {
  let hash = 2166136261
  for (const character of seed.trim().toLowerCase()) {
    hash ^= character.codePointAt(0) ?? 0
    hash = Math.imul(hash, 16777619)
  }
  return AVATAR_COLOR_CLASSES[(hash >>> 0) % AVATAR_COLOR_CLASSES.length]
}

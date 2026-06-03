import type { CSSProperties } from 'react'

type AccentVariable = '--member-nav-accent' | '--member-tab-accent'

export function getMemberNavAccent(href: string) {
  if (href === '/help') return 'var(--action-offer)'
  if (href === '/people') return 'var(--accent-plum)'
  if (href === '/admin/invite') return 'var(--accent-plum)'
  return 'var(--primary)'
}

export function activeMemberNavStyle(accent: string, variable: AccentVariable): CSSProperties {
  return {
    [variable]: accent,
    borderColor: `color-mix(in srgb, ${accent} 18%, var(--border))`,
    background: `linear-gradient(180deg, var(--card), color-mix(in srgb, ${accent} 7%, var(--card)))`,
    boxShadow: `0 1px 0 rgb(12 12 11 / 5%), 0 10px 20px color-mix(in srgb, ${accent} 6%, transparent)`,
  } as CSSProperties
}

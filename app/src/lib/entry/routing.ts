import type { MemberContext } from '@/db/repositories/member-context'
import { memberDestination } from '@/lib/membership/selection'

function hasControlOrBackslash(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0)
    return character === '\\' || code <= 31 || code === 127
  })
}

/**
 * Accept only same-origin application paths. In particular, `//host` is a
 * protocol-relative URL and must never be treated as a local redirect.
 */
export function safeNextPath(value: unknown, fallback = '/'): string {
  if (typeof value !== 'string' || value.length === 0) return fallback
  if (!value.startsWith('/') || value.startsWith('//')) return fallback
  if (hasControlOrBackslash(value)) return fallback

  try {
    const parsed = new URL(value, 'https://bridgecircle.invalid')
    if (parsed.origin !== 'https://bridgecircle.invalid') return fallback
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}

export function memberEntryPath(context: MemberContext, next?: unknown): string {
  switch (memberDestination(context)) {
    case 'cancel-delete':
      return '/cancel-delete'
    case 'select-circle':
      return '/select-circle'
    case 'onboarding':
      return '/onboarding'
    case 'pending-approval':
      return '/pending'
    case 'member-shell':
      return safeNextPath(next)
    case 'reject-session':
      return '/sign-in?error=membership_unavailable'
  }
}

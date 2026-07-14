// Shared by the desktop sidebar/tablet rail and mobile tab bar. Lives in its
// own server-safe module
// because importing a non-component value across the RSC boundary —
// from a `'use client'` file into a server file — makes Next hand
// back a client-reference proxy, not the actual array. Calling .map()
// on that proxy fails at runtime even though TypeScript types it as
// the readonly array. Keeping the data here, with no `'use client'`
// pragma, lets both sides see the real array.

export const MEMBER_NAV_LINKS = [
  { href: '/', label: 'Home', match: ['/'] },
  // Help owns both asking and giving, plus every ask detail/composer route.
  { href: '/help', label: 'Help', match: ['/help', '/ask'] },
  { href: '/people', label: 'People', match: ['/people', '/discover', '/profile', '/friends'] },
  // Messages (route still /inbox) absorbs direct messages — the /messages
  // list page redirects here. Every conversation converges here per ADR
  // 0011; the route itself is renamed in a later phase.
  { href: '/inbox', label: 'Messages', match: ['/inbox', '/messages'] },
  { href: '/school', label: 'School', match: ['/school', '/events', '/announcements'] },
  // /announcements no longer has a top-nav slot — they're low-frequency
  // admin posts. The home page surfaces the latest one as a banner;
  // notifications and admin emails deep-link into /announcements when
  // there's a specific post to read. The archive page itself stays.
] as const

export type MemberNavLink = (typeof MEMBER_NAV_LINKS)[number]

export function isMemberNavLinkActive(pathname: string, link: MemberNavLink) {
  return link.match.some((prefix) => {
    if (prefix === '/') return pathname === '/'
    return pathname === prefix || pathname.startsWith(`${prefix}/`)
  })
}

export function getMemberPageTitle(pathname: string) {
  if (pathname.startsWith('/notifications')) return 'Notifications'
  if (pathname.startsWith('/admin')) return 'Admin'
  if (pathname.startsWith('/profile')) return 'Profile'
  const activeLink = MEMBER_NAV_LINKS.find((link) => isMemberNavLinkActive(pathname, link))
  if (activeLink) return activeLink.label
  return 'BridgeCircle'
}

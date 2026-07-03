// Shared by `member-nav.tsx` (Client Component, renders the desktop
// nav with active-state highlighting) and `member-header.tsx` (Server
// Component, renders the mobile dropdown). Lives in its own module
// because importing a non-component value across the RSC boundary —
// from a `'use client'` file into a server file — makes Next hand
// back a client-reference proxy, not the actual array. Calling .map()
// on that proxy fails at runtime even though TypeScript types it as
// the readonly array. Keeping the data here, with no `'use client'`
// pragma, lets both sides see the real array.

export const MEMBER_NAV_LINKS = [
  // One Help hub (home): a segmented toggle flips between asking for help
  // (default) and giving help. The former separate Ask and Help tabs
  // collapsed into this one. `/ask` results and `/help` (→ give side) both
  // stay lit under it.
  { href: '/', label: 'Help', match: ['/', '/ask', '/help'] },
  // People remains the broad exploration surface, but the product center
  // is the question-driven Ask / Help loop.
  { href: '/people', label: 'People', match: ['/people', '/discover', '/profile', '/friends'] },
  { href: '/school', label: 'School', match: ['/school', '/events', '/announcements'] },
  // Messages (route still /inbox) absorbs direct messages — the /messages
  // list page redirects here. Every conversation converges here per ADR
  // 0011; the route itself is renamed in a later phase.
  { href: '/inbox', label: 'Messages', match: ['/inbox', '/messages'] },
  // /announcements no longer has a top-nav slot — they're low-frequency
  // admin posts. The home page surfaces the latest one as a banner;
  // notifications and admin emails deep-link into /announcements when
  // there's a specific post to read. The archive page itself stays.
] as const

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
  // Home IS the ask surface (merged front door — ask-home.tsx). The tab
  // points at /, /ask without a query renders the same component, and the
  // highlight is honest on both: clicking the lit tab is a no-op.
  { href: '/', label: 'Ask', match: ['/', '/ask'] },
  // Help is the supply-side surface for alumni who want to give useful,
  // lightweight help without committing every interaction to mentorship.
  { href: '/help', label: 'Help', match: ['/help'] },
  // People remains the broad exploration surface, but the product center
  // is the question-driven Ask / Help loop.
  { href: '/people', label: 'People', match: ['/people', '/discover', '/profile', '/friends'] },
  { href: '/school', label: 'School', match: ['/school', '/events', '/announcements'] },
  // Inbox absorbs direct messages — the /messages list page redirects
  // here. Request management lives in Inbox after an ask has been sent.
  { href: '/inbox', label: 'Inbox', match: ['/inbox', '/messages'] },
  // /announcements no longer has a top-nav slot — they're low-frequency
  // admin posts. The home page surfaces the latest one as a banner;
  // notifications and admin emails deep-link into /announcements when
  // there's a specific post to read. The archive page itself stays.
] as const

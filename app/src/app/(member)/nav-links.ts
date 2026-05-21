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
  { href: '/', label: 'Home', match: ['/'] },
  // People is the canonical directory and the starting point for advice /
  // mentorship requests. /friends folds in as a "People I know" filter;
  // incoming friend requests live on /inbox alongside ask requests.
  { href: '/people', label: 'People', match: ['/people', '/discover', '/profile', '/friends'] },
  // Inbox absorbs direct messages — the /messages list page redirects
  // here, and the top-level /ask page redirects here. Workflow ask
  // routes stay highlighted here because request management lives in Inbox.
  { href: '/inbox', label: 'Inbox', match: ['/inbox', '/messages', '/ask'] },
  { href: '/events', label: 'Events', match: ['/events'] },
  // /announcements no longer has a top-nav slot — they're low-frequency
  // admin posts. The home page surfaces the latest one as a banner;
  // notifications and admin emails deep-link into /announcements when
  // there's a specific post to read. The archive page itself stays.
] as const

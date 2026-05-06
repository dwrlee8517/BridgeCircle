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
  // Discover frames the directory as exploration, not a query — matches
  // the brand thesis that members shouldn't start at a blank search box.
  // /friends folded in here as a "People I know" filter; incoming friend
  // requests live on /inbox alongside ask requests.
  { href: '/discover', label: 'Discover', match: ['/discover', '/profile', '/friends'] },
  // /ask is the verb-driven heart of the product — your sent asks + a CTA
  // to start a new one. The composer at /ask/new and the thread at
  // /ask/thread/* are reached from this surface or from a profile.
  { href: '/ask', label: 'Ask', match: ['/ask'] },
  // Inbox absorbs direct messages — the /messages list page redirects
  // here, but /messages/[threadId] is still the conversation viewer
  // (deep-linked from inbox), so we keep it in the match prefix list
  // so the nav stays highlighted while reading a DM.
  { href: '/inbox', label: 'Inbox', match: ['/inbox', '/messages'] },
  { href: '/events', label: 'Events', match: ['/events'] },
  // /announcements no longer has a top-nav slot — they're low-frequency
  // admin posts. The home page surfaces the latest one as a banner;
  // notifications and admin emails deep-link into /announcements when
  // there's a specific post to read. The archive page itself stays.
] as const

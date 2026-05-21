# BridgeCircle Web App — UI Kit

A high-fidelity, click-through prototype of the BridgeCircle alumni web app.

## Files
- `index.html` — entry. Top nav routes between four screens.
- `Primitives.jsx` — `Button`, `Avatar`, `Card`, `Chip`, `StatusPill`, `Icon` (Material Symbols), `Eyebrow`, `Wordmark`, `ProfileBanner`.
- `Cards.jsx` — extended reusable cards for events, stats, notifications, opportunities, announcements, discussion threads, and empty states.
- `Chrome.jsx` — `TopNav` (sticky midnight bar), `Footer` (editorial all-caps).
- `Dashboard.jsx` — Hero greeting + stat strip, mentee request cards, new-alumni tiles, upcoming-event card, notification feed.
- `Directory.jsx` — Search hero, filter pills, card grid of alumni profiles.
- `Mentorship.jsx` — Hub with tabbed sections (Pending, Active, Find, History), stat blocks, request cards with accept/decline.
- `Events.jsx` — Master/detail; date-tile list on the left, event hero card on the right.

## Visual rules followed
- **Authoritative structure and active accenting:** Deep Cobalt `#173fb3` (or Civic Blue `#4d88ff` in dark) for interactive elements and Obsidian Ink `#0c0c0b` for structure, built on a clean Platinum Bone `#fafaf9` canvas.
- **Reading hierarchy & type scale:** Inter Tight for display headings/names, Inter for body copy, JetBrains Mono (spaced uppercase) for system metadata/counters, and Fraunces serif for wordmarks/pull-quotes.
- **Corner treatment & borders:** All elements use a strict `--radius` of `6px` (`0.375rem`). Hairline borders are `1px` (`#dcdcd6` or `#ebebe5`), and splits are anchored with `2px` solid top borders.
- **Iconography:** Lucide icons with consistent stroke weight (1.5px on desktop, 2px on mobile/tablet) bounded in 16px/20px squares.

## What's faked
- Search input doesn't filter results.
- "Accept / decline" mentor actions update local state but don't persist.
- Notification "mark all read" is a no-op.
- Avatars are initial blocks (no real photos, by design).

## Where to start
Open `index.html`. The default route is the Dashboard. Click "Review mentor requests" or any nav link to move between screens.

This kit expects shared tokens at `../colors_and_type.css` and local fonts at `../fonts/`.

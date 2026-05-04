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
- **Two anchors only:** Midnight `#0b1220` and Sapphire `#0051d5`. Decorative gradients are confined to hero strips and are layered over a subtle dot grid so they never read as flat marketing fills.
- **Editorial vs functional type:** Fraunces serif for hero headlines, eyebrows, footer footers, and stat numbers. Manrope sans for everything else.
- **Two-circle motif:** Used decoratively in hero strips and the brand mark only; never as a content frame.
- **No emoji, no SVG icons drawn by hand.** Iconography is Material Symbols Outlined, weight 400, 18–24px.

## What's faked
- Search input doesn't filter results.
- "Accept / decline" mentor actions update local state but don't persist.
- Notification "mark all read" is a no-op.
- Avatars are initial blocks (no real photos, by design).

## Where to start
Open `index.html`. The default route is the Dashboard. Click "Review mentor requests" or any nav link to move between screens.

This kit expects shared tokens at `../colors_and_type.css` and local fonts at `../fonts/`.

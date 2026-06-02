# BridgeCircle App UI Kit

High-fidelity recreation of the BridgeCircle member-facing web app.
Covers the core member surfaces in a clickable prototype.

## Source
- GitHub: [dwrlee8517/BridgeCircle](https://github.com/dwrlee8517/BridgeCircle)
- Codebase: `app/src/app/(member)/`, `app/src/components/ui/`
- Design spec: `uploads/DESIGN.md` (Civic Editorial)

## Screens in index.html

| Screen | Route | Notes |
|---|---|---|
| **Home / Ask** | `/ask` | AskBar, PromptChips, NetworkMotif, 4-up person cards, school pulse, help opportunities |
| **People** | `/people` | Search results in card (comfortable) or list (compact) density toggle |
| **Inbox** | `/inbox` | Two-column layout: thread list with lifecycle stats + detail pane |
| **School** | `/school` | Event cards with RSVP CTA |

Navigate between screens via the header nav.

## Component Files

| File | Exports | Description |
|---|---|---|
| `Button.jsx` | `BCButton`, `ArrowRight`, `SearchIcon`, `ChevronRight`, `MenuIcon`, `BellIcon`, `SparklesIcon` | All button variants and sizes; shared icon helpers |
| `StatusBadge.jsx` | `BCStatusBadge`, `BCLifecycleBadge`, `BCAvatar` | Semantic tone badges, lifecycle badge map, avatar with capacity dot |
| `Header.jsx` | `BCHeader`, `BridgeLogo` | Sticky header with logo, desktop nav (active underline), search bar, bell, account menu |
| `AskBar.jsx` | `BCAskBar`, `BCPromptChips`, `BCNetworkMotif`, `BCSectionKicker` | Command-surface AskBar, prompt chip row, Midnight network motif panel, section kicker |
| `PersonCard.jsx` | `BCPersonCard`, `BCPullQuote`, `TopicBadge` | Full result card (comfortable) and compact list row; match brief, actions, capacity dot |
| `InboxPanel.jsx` | `BCInboxPanel` | Two-column inbox with thread list, lifecycle stats, tab filter, detail pane, message thread, composer |

## Usage

All components export to `window` via Babel script tags. Load in order:

```html
<script type="text/babel" src="Button.jsx"></script>
<script type="text/babel" src="StatusBadge.jsx"></script>
<script type="text/babel" src="Header.jsx"></script>
<script type="text/babel" src="AskBar.jsx"></script>
<script type="text/babel" src="PersonCard.jsx"></script>
<script type="text/babel" src="InboxPanel.jsx"></script>
```

## Design Tokens Used

All colors reference the Civic Editorial system — see `../../colors_and_type.css` and `../../README.md`.

Key values used inline:
- `#fafaf9` Platinum Bone canvas
- `#ffffff` Surface white (cards)
- `#2563eb` Electric Sky (primary)
- `#f59e0b` Amber (CTA)
- `#0c0c0b` Obsidian (text)
- `#081126` Midnight (editorial surfaces)
- `#dcdcd6` Border
- `#f4f3ee` Soft Panel

## Density

Wrap content with `density-cozy` (member list surfaces) or `density-pro` (admin).
`BCPersonCard` accepts `density="comfortable"` or `density="compact"`.

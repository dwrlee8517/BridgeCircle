# Handoff Versus Current Production UI

Date: 2026-06-02

## Summary

The handoff is not a different brand direction. It is a more complete, more
resolved version of the Civic Editorial direction already partially implemented
in the app.

The production app already matches the handoff on the main foundation layer:
Electric Sky primary, amber CTA, Midnight editorial surfaces, Platinum Bone
canvas, Inter / Inter Tight / JetBrains Mono, density modes, role tokens,
section kickers, command surface treatment, pull quotes, status badges, and
subtle card lift.

The meaningful gap is screen composition. The handoff has the clearer source of
truth for member-app hierarchy, routes, and interaction flow. Production should
move toward the handoff while keeping real data, routing, accessibility, auth,
and existing production-only improvements.

## Foundation Layer

Mostly aligned.

- `app/src/app/globals.css` already contains the handoff token system.
- `StatusBadge`, `Card`, and `Input` match the handoff TSX primitives.
- Production `Button` is slightly ahead of the handoff because it adds
  `variant="offer"` for give-help actions.
- The handoff uses many inline styles in `ui_kits/app/index.html`; production
  should translate those into existing Tailwind tokens and primitives.

## Component Detail Delta

The detail layer is not fully aligned. Treat the handoff as the source of truth
for visual intent, but resolve conflicts through the token spec before changing
production code.

| Detail | Handoff | Current production | Decision |
|---|---|---|---|
| Button roles | UI kit uses `cta` amber, `default` blue, `offer` green, outline, secondary, ghost, destructive, link. | Production primitive has the same roles, except the handoff TSX primitive snapshot lacks `offer`; production added it. | Keep production `offer`; it matches the UI kit intent. |
| CTA color | Amber `#f59e0b`, hover `#d97706`, foreground Obsidian. | Matches via `--cta`, except route-local buttons sometimes use plain default blue where the handoff uses commit/offer semantics. | Audit route-level button choices, not the primitive. |
| Primary / ask color | Electric Sky `#2563eb`, hover `#1d4ed8`. | Matches. | Keep. |
| Offer / give-help color | Handoff token spec says Sage `#3b6e51`; UI kit inline files sometimes use brighter `#15a05f`. | Production uses tokenized `--action-offer`, currently Sage `#3b6e51`. | Prefer token spec (`#3b6e51`) unless a handoff screen explicitly gets promoted with the brighter action green. |
| Warning / attention color | Handoff token spec uses darkened Ochre `#a16207`. Some older exploration files still show `#c8761a`. | `globals.css` uses `#a16207`; `tokens.md` was stale and has been corrected. | Use `#a16207`; ignore older exploration ochre. |
| Primitive Card | Handoff TSX card is simple: `rounded-lg`, `border-border`, `bg-surface-card`, no default shadow, optional hover lift. | Production primitive matches. | Primitive is fine. |
| Person / result cards | Handoff `BCPersonCard` uses 8-10px radius, 20px padding, hairline shadow, square avatar by default, clear status row, match brief, dashed action divider, and one ask/view action. | Production `ResultCard` is close but more route-specific: dialogs for rationale, more tiny mono badges, `variant="cta"` on ask, and more local overrides. | Move route cards toward handoff hierarchy and spacing; do not replace data behavior. |
| Event cards | Handoff School/Event model is restrained master-detail with date blocks, capacity, RSVP rail, and announcements rail. | Production Events page uses a more decorative card grid with top accent bars, large index numbers, required-prep copy, and route-local event colors. | Events are the clearest visual drift; align toward handoff if School/Event work starts. |
| Inbox rows/detail | Handoff uses relationship queue stats, compact lifecycle rows, selected-row tint, detail pane, and composer rhythm. | Production is close but heavier: extra local bubbles, reaction UI, small labels, and multiple rounded panels. | Keep real messaging features, but simplify visuals toward handoff. |
| Badge sizes | Handoff UI kit often uses 9-11px mono/status details; token docs set `mono-sm` as the minimum. | Production still has several `text-[9px]` route-local labels. | For production, prefer readable token scale; tiny labels should be supporting only, not critical state. |

## Screen Layer

Partially aligned.

| Surface | Current production | Handoff direction |
|---|---|---|
| Home / Ask | Already uses AskBar, PromptChips, people-who-can-help, people-you-can-help, school pulse, and NetworkMotif. | More resolved first-viewport command composition and connected member journey. |
| Ask | Current `/ask` is a strong matching command surface backed by real search. | Handoff treats Ask/Home and People as one tighter ask-to-person flow. |
| Help | Current Help is task-mode: requests, availability, likely-fit rows. | Handoff has a fuller supply-side page with AI picks, topic feeds, and availability controls. |
| People | Current has real NL/structured search, density toggle, and result cards. | Handoff has stronger context strip, filter rail, row hierarchy, and direct ask/view flow. |
| Inbox | Current is close: lifecycle tabs, split list/detail, mobile list-to-detail. | Handoff has a cleaner prototype of relationship queue stats, filters, detail pane, and composer rhythm. |
| School | Current emphasizes school pulse, events timeline, and announcements. | Handoff has a more integrated calendar plus announcements rail and richer event detail flow. |
| Events | Current events page uses a separate card-grid concept with stronger decorative accenting. | Handoff pulls events into School with more restrained Civic hierarchy and RSVP rail. |
| Header / Nav | Current header/nav is production-real with account, notifications, search, and responsive collapse. | Handoff has the clearest visual model for sticky header and mobile bottom tab rhythm. |

## Implementation Guidance

- Treat `bridgecircle-design-system/project/ui_kits/app/index.html` as the
  intended UI/UX source.
- Do not overwrite production primitives blindly; keep compatible production
  improvements such as `Button variant="offer"`.
- Use handoff component behavior and layout hierarchy, but implement through
  app primitives, server/client boundaries, real data, and accessibility rules.
- Keep older `reference-src/` files subordinate to the handoff unless a specific
  file is explicitly promoted.

# BridgeCircle Handoff Fidelity Ledger

Source references:

- Composition and interaction anatomy: `docs/experience/ui/design-system/handoff/bridgecircle-design-system/project/ui_kits/app/index.html`
- Token values: `docs/experience/ui/design-system/handoff/bridgecircle-design-system/project/uploads/DESIGN.md`
- CSS custom properties: `docs/experience/ui/design-system/handoff/bridgecircle-design-system/project/colors_and_type.css`

When prototype inline values conflict with token files, the token files win. In particular, use `#a16207` for ochre and `#3b6e51` for offer/success sage.

## Global Contract

| Detail | Handoff target | Production rule |
| --- | --- | --- |
| Layout | Bounded editorial surfaces on `#fafaf9`, with white cards and full-width page bands. | Keep member pages on the Civic canvas; avoid nested floating cards inside cards. |
| Buttons | Blue for ask/browse/default actions, sage for offer/give-help actions, amber only for the decisive commit action. | Keep `Button` variants `default`, `cta`, `offer`, `outline`, `secondary`, `ghost`, `destructive`, `link`; use `cta` sparingly. |
| Cards | 8-10px default radius, 20-24px padding, hairline shadow; hover lift only for interactive cards. | Prefer `rounded-lg`, `border-border`, `shadow-card`; avoid default `shadow-hero` except hero/feature surfaces. |
| Badges | Semantic tints, dot when state matters, compact but legible labels. | Use `StatusBadge` for lifecycle/open/warn/info states; route-local badge maps should be rare. |
| Type | Inter Tight headings, Inter body, JetBrains Mono only for metadata/kickers. | Important state labels should not be below the token `mono-sm`/caption scale unless purely decorative. |
| Avatars | Square avatars on people/profile cards; muted fallback. | Preserve square avatar defaults where a member card is the object. |
| Motion | 150ms control/surface transitions, subtle lift. | Use `bc-motion-control` and `bc-motion-surface`; avoid decorative animation. |
| Mobile | Header remains simple; primary member navigation moves to a bottom tab bar. | Preserve current auth/account/notification behavior while matching this rhythm. |

## Surface Contracts

| Surface | Layout/container | Card anatomy | Button roles | Badge/status | Mobile behavior |
| --- | --- | --- | --- | --- | --- |
| Header/Nav | Sticky 72px header, bounded content, active underline, quiet search capsule, notification/account weight. | No card treatment. | Navigation/search remain blue/default or neutral. | Notification count remains real. | Bottom tab bar owns primary nav below member breakpoint. |
| Home/Ask | Ask-first command surface, prompt chips, recent asks rail, helper suggestions, school pulse, one editorial motif. | White decision cards with subtle border/shadow; motif can use midnight hero treatment once per surface. | `default` for finding/browsing people; `cta` only when submitting a final ask. | Use semantic statuses for asks/helper availability. | Ask bar stacks, chips wrap, rails remain scannable. |
| People | Result cards follow `BCPersonCard`: avatar/name/year, status row, role/location, topic chips, match brief, dashed action divider, one primary action. | Square avatar, 8-10px radius, 20px padding, hairline shadow; compact rows keep same anatomy. | Ask/request from result card uses blue/default; final send form uses amber. | Friend, mentor, advice, paused use `StatusBadge`; avoid score-as-spectacle chips. | Filters collapse; card actions stay reachable without overflow. |
| Ask Person | Back link, person summary card, ask type selector, textarea/helper copy, amber send action, success state. | Person summary is a quiet white card with square avatar and topic chips. | Send is `cta`; cancel/back are ghost/outline. | Capacity/open states use semantic badges. | Form stacks cleanly; action row wraps. |
| Help | Supply-side model: availability, priority queue, fit/pick hierarchy. | Queue and availability cards are quiet cards, not decorative nested panels. | Give-help/accept actions use `offer`; browse/details stay default/outline. | Availability and capacity are semantic. | Queue becomes a single column. |
| Inbox | Relationship queue with lifecycle stats, compact rows, selected-row tint, two-pane detail, composer rhythm. | Rows are compact surfaces; detail is a single pane, not nested cards. | Reply/send/accept are commit or offer depending action; navigation is neutral. | Lifecycle counts and row badges use semantic tones. | List/detail toggle replaces two-pane layout. |
| School/Events | Restrained School hub with events plus announcements rail, date blocks, RSVP/capacity treatment, attendee/host sections. | Event rows/cards use date blocks and quiet metadata; no index-number decoration. | RSVP is the local `cta`; archives/details are default/outline. | Capacity/RSVP states use tokens; category color only when meaningful. | Event cards stack with date block first. |
| Profile/Settings | Profile action rail, status badges, capacity indicator, mutual/context blocks, ask/message CTAs. | Hero/profile cards are white with square avatar and subtle lift only where interactive. | Ask-from-profile may be `cta` when it is the local commit; message/view/edit are default/outline. | Availability/capacity and account status use semantic badges. | Action rail wraps and remains above contextual blocks. |

## Mismatch Ledger

Open mismatches should be fixed or recorded here as intentional production adaptations.

| Date | Surface | Mismatch | Decision |
| --- | --- | --- | --- |
| 2026-06-02 | All | Handoff prototype includes a few inline green values around `#15a05f`. | Use tokenized sage `#3b6e51` / `--action-offer`. |
| 2026-06-02 | Events | Current events support attendee previews and RSVP state but not real capacity/waitlist limits. | Render capacity-like copy from available counts only; defer backend until real capacity is required. |
| 2026-06-02 | People | Current rerank data can provide match explanation and score. | Show explanation as a match brief; avoid percentage-forward decorative score chips. |

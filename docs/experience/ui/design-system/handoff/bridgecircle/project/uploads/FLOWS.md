# BridgeCircle redesign — flows in words

**Status:** DRAFT v1 · 2026-07-05 · for Richard's review before any screen design
**Scope:** the complete member webapp (desktop-first, mobile follows).
Admin and native iOS are out of scope for redesign v1.
**Binding constraints:** ADR 0011 (two verbs, one inbox; buffer as plumbing),
the locked IA (Home · Help · People · Messages · School), the divergence
ledger ([OVERRIDES.md](OVERRIDES.md)), and `docs/product/voice-guidelines.md`
for every string. Items marked **❓** are open product decisions.

> The one-sentence model (ADR 0011): *a member can do two things to another
> member — **Connect** or **Ask**. If you don't know who to ask, **ask the
> circle**. Every accepted intro becomes an ordinary conversation in Messages.*

---

## 0 · The shell (every signed-in screen)

- **Sidebar** (240px; collapses to 72px icon rail): wordmark → Home · Help ·
  People · Messages (unread count) · School → member card (self, gradient
  avatar) at bottom. Member card opens **own profile & settings**.
- **Topbar** (66px): page title · **global search (⌘K)** — people, asks,
  events, announcements in one palette · notification bell (dot + popover) ·
  self avatar.
- **Notifications popover** ❓ *scope: v1 popover listing the same events that
  email (offer received, ask accepted, connect request, event reminder), each
  deep-linking; or defer popover and let the bell link to Messages?*

## 1 · Onboarding (join → first useful minute)

Entry: invite email / join link → verify → profile steps → landing on Home.

1. **Welcome** — one screen, band vocabulary allowed here (marketing moment):
   what BridgeCircle is in one sentence, whose circle this is.
2. **About you** — name, class year, photo (photo nudge: members with a photo
   hear back faster), location.
3. **Education / Today / Past** — school years; what you do now; what you've
   done. Written like a conversation, not a form. Feeds matching (ADR 0009).
4. **How you can help** — the give-side opt-in: "open to helping" toggle +
   3–5 topic chips ("what can you speak to?"). Skippable; never guilt-y.
5. **All set** — lands on Home with one suggested first action (see Home).

Buffer note: onboarding never asks for commitments — availability is a mood,
not a contract (pause exists from day one).

## 2 · Home — the dashboard

**Job:** orient; surface the next useful relationship action. Not a feed.
**Priority order (kept from the screen brief):** ① the ask entry ② people who
need you ③ your open items ④ school pulse + profile upkeep as context.

Modules, top to bottom:

1. **Ask entry** — one line ("What do you need?") that jumps into Help·Get
   with focus in the composer. Not a full composer on Home.
2. **Needs you this week** — up to 3 matched open asks (give side), each with
   avatar, name+year, one-line ask, weak-green "Offer to help". "See all" →
   Help·Give.
3. **Waiting on you** — pending connect requests (Accept / quiet Decline) and
   unanswered threads. Empty → module hidden, never an empty shell.
4. **Your open asks** — status pills (`2 offers` / `Waiting` / `Expires in 3d`),
   click → the ask's thread or offer list.
5. **From the school** — next 2 events + newest announcement (→ School).
6. **Profile freshness** — only when enrichment proposes a change: "Your
   profile may be out of date" → Review / Dismiss. Quiet, dismissible.

Flows out: everything on Home is a doorway; nothing completes on Home except
Accept/Decline on connect requests.

## 3 · Help — one page, two modes (the toggle)

**The pill toggle (Get help / Give help)** sits on the wash hero; wash color
follows mode (blue get / green give). Deep-linkable: `/help?mode=give`.
**Default mode ❓** — *get by default, or remember the member's last mode?*
(Suggestion: remember last, default get for first-timers.)

### 3a · Get help (blue wash)

1. **Compose** — freeform text ("Write it like you'd ask a friend — detail
   helps us match the right people"). AI assist = one conversational drafter
   (ADR 0011 D1: no types, no steps); `?skip=1` plain form survives.
2. **Topic chips** — AI-suggested from the text, editable (+ Add).
3. **Audience** — "Only people I pick" (default) ❓ *vs "Open network" — does
   v1 keep both reach modes from the mockups, or launch picked-only and let
   "ask the circle" (open asks) cover broad reach?*
4. **Recipient picker** — "Send it to the right people": AI-matched list with
   evidence line each ("Made the agency → in-house jump in 2018"), status
   chips (In your circle / ● Open to help), Include/Included toggles,
   "Reaching N people" count. The asker holds the send.
5. **Send** ("Ask for advice") → confirmation Result ("Ask sent — it stays
   open 14 days") → lands on the ask's status view.
6. **Lifecycle:** recipient accepts → thread in Messages (origin line: "Maya
   accepted your ask"). Recipient quiet-passes → asker sees *nothing* (D5).
   14-day expiry → gentle asker email ("want to renew or let it rest?").
   Offers from the open circle (3b) arrive as **offer rows on the ask**: the
   asker holds the accept; accept → thread; pass → helper sees nothing.

### 3b · Give help (green wash)

1. **Status strip** — "Open to helping" switch · capacity "1 of 3 slots used"
   (meter) ❓ *slots: keep the mockup's visible capacity, or keep caps
   invisible per ADR 0011 (only `max_pending_requests` as hidden abuse valve)?
   Visible slots contradict D1's "no caps in the interface" — recommend
   dropping the meter, keeping only the switch + "we stop matching you when
   you're busy" copy.* · expiry ("status expires in 14 days" auto-pause).
2. **What can you speak to** — editable topic chips (same data as onboarding
   step 4).
3. **Asks matched to you** — list with match evidence ("you made this exact
   call"), weak-green "Offer help" per row.
4. **Offer** → short optional note → sent. Asker accepts → thread ("You
   offered to help with…" origin line). Asker passes → helper sees nothing.

Buffer inventory for Help: quiet pass both directions, pause/auto-pause,
expiry with dignity, asker-holds-accept on offers, helper-holds-accept on
direct asks. Every one stays invisible-but-real.

## 4 · People — the directory

**Job:** find the right person; decide whether to reach out; one action per row.

1. **NL search capsule** ("designers who moved in-house in the Bay Area") +
   scope segmented (All / Open to help / In your circle) + filter pills
   (Industry · Class year · Location).
2. **Result rows** — avatar (rotation pair), name + status chip (In your
   circle / ● Open to help / Requested) + "Strong match" when true, role line,
   topic chips, **one action**: Message (already connected) / Connect /
   Pending (disabled).
3. **Profile preview rail** (chevron) — Why-this-match card with evidence +
   provenance ("From verified profile facts"), Career, "You share", actions:
   **Ask for advice** (primary) + Message/Connect.
4. **Connect flow** — two intro modes (ADR 0011 D2): quick-hello chips for
   people you know; conversational AI intro for strangers (drafts into the
   request message). Mutual accept → DM thread in Messages. Decline is quiet.
5. **Ask-from-profile** — "Ask for advice" pre-fills Help·Get with this person
   already Included in the recipient picker.

## 5 · Messages — every conversation, one room

**Job:** relationship lifecycle. List priorities: ① needs reply ② active
③ history. Filters as chips (All / Unread / My circle / Open asks), not tabs.

1. **Conversation list** — avatar, name + class year, preview, time; unread =
   heavy + blue dot; selected = tint + left accent. Pending items (connect
   requests, unaccepted asks) surface at top as actionable rows ❓ *inline in
   the list (mockup) or a separate "Waiting" group header? Recommend a
   "Waiting on you" group pinned above conversations.*
2. **Thread** — identical for every origin (D4). Class year + circle mark on
   names; **origin as a quiet system line** ("You connected", "Maya accepted
   your ask"); day dividers; read receipts; typing.
3. **Context rail** ("Profile") — who (chips: Verified '14, ● Open to mentor),
   **About this conversation** (which ask, Day N of 14, progress) when the
   thread came from an ask, actions (Schedule a call ❓ *v1? it implies
   calendar integration — recommend copy-only deep link to suggest times in
   chat, no integration*, **Mark ask resolved**), shared files/links.
   Rail open ⇒ sidebar collapses to icon rail.
4. **Resolve** — either side can mark the ask resolved → thread stays, ask
   closes, asker gets a gentle "did this help?" ❓ *do we ask for a
   thanks/outcome note (feeds the flywheel per ADR 0010 D4) — recommend yes,
   one optional line, skippable.*
5. **Post-ask connect nudge** (ADR 0011 Phase 4) — after both sides have
   written, one quiet "Add to your circle" line in-thread, once per pair.

## 6 · School — events + announcements

**Job:** keep the school pulse close, without becoming the product's center.

1. **Attending strip** — your RSVPs as a slim always-on-top strip; empty state
   = one line + "Browse events".
2. **Event cover (navy)** — the selected/next event as the punchy cover: glass
   date tile, When/Where/Format, avatar stack + capacity, RSVP ("I'm going" /
   change), Add to calendar (ICS download, no integration).
3. **Upcoming list** — date tiles, Going/Viewing chips; selecting swaps the
   cover. Full calendar view ❓ *v1 or later? Recommend later; the list + strip
   covers pilot volume.*
4. **Announcements** — pinned treatment for the one that matters, then
   reverse-chron rows; "2 new" chip. Detail = simple reading page.
5. **Newsletter tile** ("The Bridge") — read issue / subscribe.
6. **Event detail flow:** RSVP → appears in strip + Home module; reminder
   email T-1d; who's-going list respects the same privacy as the directory.

## 7 · Profile — self and others

- **Other member:** header (avatar, name, years, chips), exactly **two
  buttons** — Ask for help · Connect (or Message if connected) — plus
  circle-state line; About / Career / Education; "open to help with" chips;
  provenance line ("auto-updated from public sources · last checked May 2026").
- **Self:** same layout + edit affordances; enrichment review queue ("We found
  a change — approve?"); availability + topics (mirrors Help·Give settings —
  one source of truth ❓ *where do give-settings live canonically: Help page
  strip (recommended, per ADR 0011 folding settings into /help) with profile
  linking to it?*); email prefs; pause.

## 8 · Cross-cutting

- **Empty states** — every module: one warm line + one useful action, no
  illustration theater. (E1 neutral-pending hue is the ledger entry that will
  cover "Waiting" states — promote when designing these.)
- **Notifications/email touchpoints** (all existing plumbing): ask received,
  ask accepted, offer received, offer accepted, connect request, connect
  accepted, event reminder, expiry warning, digest ❓ *does the redesign add a
  weekly digest, or keep transactional-only for v1? Recommend transactional
  only.*
- **The two-sided buffer, audited per flow:** every decline/pass path above is
  silent to the other side; every send path shows the sender exactly who will
  see it; every "waiting" state is honest but calm. Any screen that violates
  this is wrong regardless of how it looks.
- **CircleMark (E4)** — promote the ledger entry when Messages/People screens
  are designed (names of connected members carry the mark).

## 9 · Suggested design order (Claude Design)

1. **Help (both modes)** — the product's heart, most decisions already made.
2. **Messages** — where every flow lands.
3. **Home** — composes modules from 1–2.
4. **People** — 1a is already close to final.
5. **School** — 1h is already close to final.
6. **Profile → Onboarding → notifications popover** — supporting ring.

Each screen designed as `screens/<name>.html` in this project (with
`<!-- @dsCard group="Screens" -->`), checkpoint-synced to the repo.

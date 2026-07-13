# BridgeCircle redesign — flows in words

**Status:** DRAFT v3 · 2026-07-06 · reviewed and decided by Richard 2026-07-05/06 across
the flow-artifact reviews ([page-by-page](../../../../../../explorations/help-flows-page-by-page-2026-07-05.html)
+ [desktop](../../../../../../explorations/help-people-flows-desktop-2026-07-06.html) editions,
preserved in `docs/experience/explorations/`). §3 Help: search-first ask
entry, immutable reach, five-open-ask cap, decline-with-note (no quiet pass — supersedes
ADR 0011 D5, flag the drift in the ADR at implementation), three-arm give page, capped
topics, 3-strike auto-pause, AI-helped default/custom messages, notification popover in v1.
§4 People: search auto-routes (no AI toggle; filter pills = the structured path). §5
Messages: foldable "Waiting on you" group with red badge, fold/expand context rail, no
Schedule-a-call. §6 School: 1h refined + click-through pages (event page + states,
announcements index/reading, newsletter archive/issue — newsletter renamed from "The
Bridge"; reading pages are final destinations). §7 Profile: detailed layout, "can help with"
as a section, owner-only enrichment alarms, per-item link visibility (public/circle/private),
"why this match" dropped from the profile. §1 adds the **cold-start hand-off** (ask? ·
help? · check-box classmate connects). New §7b **navigation/back model** (5 section roots,
one back rule, profiles+dialogs as overlays), §7c **trust & safety** (report → moderation
pipeline · block · disconnect · anonymity guard), §7d **account/settings + notifications
section + ask history + circle management**. Also 2026-07-06: **one recipient per ask**
(no multi-send — send separately per person); **decline gains an AI-relay layer** (tell the
AI casually, it relays the cushioned no); **14-day clock → a "3 days left" warning only**
(no running countdown); **People/Help do not cross-route** — People search auto-picks
keyword-vs-NL backend invisibly, always returns people with an explanation. All prior
"proposed for review" items (event page, Help·Give availability home) are now **decided**.
**Scope:** the complete member webapp (desktop-first, mobile follows).
Admin and native iOS are out of scope for redesign v1.

**Membership & org scope (DECIDED, Richard 2026-07-06):** **one organization
to start** (Chadwick School, Palos Verdes). Multi-school / combining schools
is a possible later expansion — v1 builds single-org, but data shapes should
not foreclose it. **Members = alumni + current students with at most 4 years
left to graduation** (so at Chadwick, upper-school students within 4 years of
graduating, plus all alumni; middle-school and younger cannot join). Every
"Anyone at [school]" reach, directory scope, and matching pool is bounded to
this single org for v1.
**Binding constraints:** ADR 0011 (two verbs, one inbox; buffer as plumbing —
except D5, superseded above), the locked IA (Home · Help · People · Messages ·
School), the divergence ledger ([OVERRIDES.md](OVERRIDES.md)), and
`docs/product/voice-guidelines.md` for every string. Items marked **❓** are open
product decisions.

> The one-sentence model (ADR 0011): *a member can do two things to another
> member — **Connect** or **Ask**. If you don't know who to ask, **ask the
> circle**. Every accepted intro becomes an ordinary conversation in Messages.*

---

## 0 · The shell (every signed-in screen)

- **Sidebar** (240px; collapses to 72px icon rail): wordmark → Home · Help ·
  People · Messages (unread count) · School → member card (self, gradient
  avatar) at bottom. Member card opens **own profile & settings**. **Active
  item = gradient fill only, no border/ring (REMOVED, Richard 2026-07-06):**
  the E3 inset ring on the selected nav item is dropped — the soft gradient
  background alone marks selection. *(Design-system source reconciled 2026-07-06:
  `--nav-active-ring: none` in `colors_and_type.css`, OVERRIDES E3 amended,
  `SKILL.md` + `desktop-shell.html` updated. Only the DesignSync push itself
  remains.)*
- **Topbar** (66px): page title · notification bell (dot + popover) · self
  avatar. **No global search / ⌘K (REMOVED, Richard 2026-07-06 — not needed):**
  there is no cross-surface command palette; search lives on the surfaces that
  need it (People's directory capsule, Help's question box). *(Design-system
  source reconciled 2026-07-06: search pill/⌘K removed from `desktop-shell.html`
  + `people-directory.html`, `--topbar-height` comment + `SKILL.md` + OVERRIDES
  E3 amended. Only the DesignSync push itself remains.)*
- **Notifications popover (DECIDED, Richard 2026-07-06):** ships in v1. The bell
  surfaces the moments neither side may miss — ask received, offer received,
  accepted, decline notes — **each shown once**, deep-linking. After that they
  live only in the notification section and Messages; the popover is a tap on
  the shoulder, not a second inbox.

## 1 · Onboarding — seamless, prefilled, three phases (REVISED 2026-07-06 · modeled on the Field Pro v2 reference)

Entry: invite email / join link → verify. Because members are **invited
through the school**, the profile **starts prefilled** (name, class year,
email from the school roster) — onboarding is *confirm and enrich*, not *fill
a blank form*. The whole thing is **bookended**: a warm navy **Welcome**, light
working steps, a navy **"you're in."** Every step shares the same chrome — a
**segmented progress bar**, a one-line **"why this matters"** subtitle, **Skip
for now** on everything, **Back** always available. Nothing traps; nothing
guilts. Copy uses current vocabulary — **helping, never "mentoring"** (ADR
0011); **"the Chadwick network," not "alumni-only"** (members are alumni +
students ≤4 years to graduation).

**Welcome (navy).** "Welcome, [name]." · "A few quick steps, about two
minutes." · a **three-phase preview** (You · Your experience · Help &
connect) · **Get started** · the quiet reassurance "Your details stay within
Chadwick."

**Phase 1 · You.** Confirm name / preferred name / also-known-as (searchable,
for members who go by another script or name) / class year — **prefilled from
the roster**, so this is the lightest step: mostly a confirm.

**Phase 2 · Your experience.** Education · today (role, city, headline,
LinkedIn URL) · past roles + skills. Opens with an **import accelerator**
("Want to fill this faster? **Import from LinkedIn / Upload résumé** — you
review every field first") so the tedious part is one click, not a wall of
empty inputs. This is the **same enrichment pipeline** that keeps profiles
fresh later (§7), surfaced up front — the single biggest seamlessness win.
Feeds matching (ADR 0009).

**Phase 3 · Help & connect.** Folds the give opt-in and the cold-start into one
warm finish, so the flow never feels like "profile, then a second wizard":
- photo nudge ("members with a photo hear back faster") + short bio, both
  optional;
- **"Open to helping" toggle + up to 5 topics** ("what can you speak to?");
- **enrichment freshness preference** — *email me proposed changes*
  (recommended) / *apply high-confidence then email* / *don't check* — this
  sets the default for the owner-only review queue (§7); chosen once, here,
  never a surprise later;
- then the **cold-start hand-off** as a natural continuation (DECIDED, Richard
  2026-07-06 — the empty-first-session fix):
  - **"Anything you're trying to figure out?"** → seeds an ask (Help·Get);
  - **"Want to help someone?"** → a few open asks matched to what they just
    entered, each with Offer;
  - **"Say hi to your class"** → the **full cohort list with checkboxes**
    (Select all / pick individuals) → one connect request each (quick-hello,
    AI-shaped optional). The highest-leverage action — it populates Messages,
    the circle, and future matching in one screen.

**All set (navy).** "You're all set, [name]. Your profile is live, and we've
lined up a few classmates worth meeting." → **Go to your dashboard** / Review
profile. Because of Phase 3, Home already has real content — a pending ask, an
offer in flight, or connect requests out.

Buffer note: onboarding never asks for commitments — availability is a mood,
not a contract (pause exists from day one). Every step and every cold-start
prompt is skippable; none guilt.
**Safety note (build time):** the cohort checklist exposes the class roster to
a just-verified member — it must obey the same directory-privacy + block rules
as People (`rls-auditor` at Phase 5).

## 2 · Home — the dashboard (DETAILED 2026-07-06)

**Job:** orient; surface the next useful relationship action. **Pure
composition** — every module is specced elsewhere; Home only arranges them.
Not a feed, not analytics, not a second inbox. **Home is a dashboard, NOT the
ask page (DECIDED, Richard 2026-07-06 — the IA lock: Home = dashboard, Help =
ask/give page; the two never merge).** Serving both sides at once — the helper
with matched asks, the asker with offers waiting — is the symmetric-buffer
thesis rendered as layout.
**Priority order (REVISED, Richard 2026-07-06):** ① the "This week in the
circle" deck ② ask entry ③ waiting on you ④ your open asks, with school pulse
+ profile upkeep as rail context. (Supersedes the earlier ①-ask-entry order —
the circle's pulse now opens the page.) **Desktop layout (DECIDED
2026-07-06):** greeting + deck full-width on top, then two columns — main =
act (2–4), rail = context (5–6).

Greeting + **the coordinator's line (DECIDED 2026-07-06):** "Welcome back,
Maren." then one warm templated sentence of network pulse — "Quiet week. 3 new
alumni joined and 1 mentor refreshed their profile." A single narrator
sentence over weekly counts (voice-guidelines register), never a stream — it
reads as the deck's caption: the line says what kind of week it is, the cards
show it.

Modules, top to bottom:

1. **"This week in the circle" — one rotating spotlight (DECIDED, Richard
   2026-07-06 — a single wide auto-advancing card, NOT three side-by-side
   cards).** Home's first component: one wide card that auto-advances every
   ~6s through tagged items — a single focal object carrying the whole pulse
   of the circle, far more variety than asks alone. Tag set:
   - **You could help**: open asks matched to the member's ≤5 standing topics,
     Offer. **Absorbs "Needs you this week."**
   - **People are asking**: public/anonymous asks near the member's cohort —
     the **permission mechanic** ("is it okay to ask this here?"). Action:
     **"Ask yours"** → seeds Help·Get's question box.
   - **School news** · **Events** (next/most relevant) · **From your circle**
     (a connected member's update).
   - **Recognition**: **warm milestones only (DECIDED 2026-07-06)** — "Maya
     just started at Figma — congratulate her", "Welcome 3 new members from
     '25". **Never a helper leaderboard**, no counts or ranking (that's the
     scoreboard banned from Home + profiles); each is a quiet doorway to a
     profile or a hello.
   - **It worked**: consented outcome stories (§5.4) — names hidden unless
     both said so.
   **Making the rotation safe — not a feed (DECIDED 2026-07-06):** it
   auto-advances (the one motion we allow) but fenced — **pauses on
   hover/focus** so an action never slides away mid-reach; **respects
   `prefers-reduced-motion`** (no auto-advance, manual only); dot indicators +
   ‹ › arrows; **~6-item cap**; "More →" exits to the relevant page (Help·Give
   browse, School), never infinite scroll; public-tier asks only, anonymity as
   specced; no popularity ranking. Optimizes time-to-action, not time-on-page;
   any tag that stops producing offers/asks/clicks comes out.
   **Paused state (DECIDED 2026-07-06):** paused members see no You-could-help
   items; a quiet one-liner sits beneath instead — "You're paused — flip the
   switch on Help·Give when you're ready."
2. **Ask entry — a live input (DECIDED 2026-07-06)** — directly beneath the
   deck: one line ("What do you need?") that is a real field; typing carries
   the text into Help·Get's question box with matches already loading (write
   once, everywhere). A deck card's "Ask yours" lands here too, pre-seeded.
   Not a full composer on Home; not a mere button.
3. **Waiting on you** — the SAME foldable, red-badged group as Messages §5.1
   (same name, same data): pending direct asks ("View ask" → accept/decline
   dialog) and connect requests (Accept / Decline inline — the one thing that
   completes on Home; connect declines stay quiet). Empty → module hidden
   entirely, badge and all.
4. **Your open asks** — status pills (`2 offers` / `Waiting` / `1 declined` /
   `Closes in 3d`), header carrying the ambient `3 of 5` slot count; row →
   the ask's status view.
5. **From the school** — next 2 events (date tile, Going chip → event page) +
   newest/pinned announcement (→ reading page). No newsletter here — School's
   card owns it.
6. **Profile freshness** — only when enrichment has something to approve; one
   card → the owner-only review queue. Absent otherwise — never a chore.

Flows out: everything on Home is a doorway; nothing completes on Home except
Accept/Decline on connect requests.

**Never on Home (DECIDED 2026-07-06):** no activity feed/stream (the loss
condition in miniature), no stats or "helped N people" (the scoreboard rule),
no "members you may know" carousel (People's job — Home shows people only when
attached to an action), no notifications list (the bell exists; duplicating it
makes both untrustworthy), no lingering onboarding checklist, no second search
box (the ask entry is need-shaped; per-surface search lives on People and Help,
and there is no global palette).

## 3 · Help — one page, two modes (the toggle)

**The pill toggle (Get help / Give help)** sits on the wash hero; wash color
follows mode (blue get / green give). Deep-linkable: `/help?mode=give`.
**Default mode (DECIDED, Richard 2026-07-06):** remember the member's last
mode; Get for first-timers.

### 3a · Get help (blue wash) — search-first (REVISED 2026-07-06)

1. **Search the question** — one box. Headline "What do you need?", coach
   line "Ask it the way it comes out — we'll find who can help." The member
   types a **question**, not a message; nothing on this page is sent to
   anyone. (No ⌘K / global search anywhere — removed 2026-07-06.)
2. **Matches, with reasons** — debounced as they type: members who can speak
   to this question, each with a question-specific evidence line ("Made the
   agency → in-house jump in 2018") and status chips (● Open to help / In
   your circle). Copy discipline: *"can speak to it,"* never *"will help"* —
   fit is not a promise. **Results are private to the asker:** a member never
   learns they appeared in a search and weren't asked.
3. **The circle door, from the start** — "Ask the circle" sits beside the
   results, a first-class door, never a fallback after browsing fails. When
   matching runs thin it becomes the empty state's primary action ("No one
   obvious — ask the circle and we'll show it to the right people").
4. **Branch A — ask a person.** Tap a person → the composer opens with the
   question carried in (never retyped). The AI drafts the note **tailored to
   both people** — the member's situation + the recipient's profile (the
   Door-1 drafting scene from the Toss exploration, now the only composer);
   tone lenses (Warmer / Shorter) survive; `?skip=1` plain form survives.
   **One recipient per ask — always (DECIDED, Richard 2026-07-06):** there is
   no multi-select. To ask several people, the asker sends a separate ask to
   each from the search results (each individually tailored, each its own
   status row, each counting against the five-slot cap). This keeps every
   note genuinely tailored and every ask a single, clean 1:1 relationship.
   Send button names the person ("Send to Maya"); the promise sits at the
   button: "Maya will answer either way — a yes, or a kind note."
5. **Branch B — open ask.** A quick AI shaping beat firms the question up for
   matching (a suggestion, never a form), then the reach + cover controls —
   which live only on this branch:
   - **Reach, two tiers (DECIDED 2026-07-05):** **Good matches** (default,
     private) — "Only people whose experience fits will see this"; routed by
     suggestion + helpers' arms, browsable by no one. **Anyone at [school]**
     (public) — "Anyone at [school] can find this"; also searchable in
     Help·Give. No middle tier; the embarrassed-asker default stays narrowest.
   - **Anonymous-until-accept (DECIDED 2026-07-05; ships v1 per 2026-07-06):**
     "Post without your name." Helpers see **"A member · Class of '27"**;
     name + profile revealed **only to the helper whose offer is accepted**.
     Match-evidence lines derive from the ask's text only (profile facts
     would leak identity); honest copy at the toggle ("Your class year still
     shows — in a small circle, people may guess").
   - Post confirmation: "Your question is shown to people who can help —
     you'll only hear from members who offer."
6. **Five open asks at once (DECIDED 2026-07-06)** — a total cap, direct or
   circle; the sixth waits for a slot. Slots return when an ask **ends**:
   resolved, retracted, declined, or closed at day 14. (With one recipient per
   ask, a direct ask ending is unambiguous — accept, decline, retract, or the
   14-day close.)
7. **Immutable once published (DECIDED 2026-07-06)** — no reach edits, no
   audience changes mid-flight. The asker can **retract** anytime (recipients'
   pending items and matched suggestions vanish quietly; the slot frees) or
   let it run. Widening happens only through the post-close recovery action
   "Open it to the circle" — a new ask, not an edit.
8. **Decline with a note — there is no quiet pass (DECIDED 2026-07-06;
   supersedes ADR 0011 D5 — record the drift in the ADR at implementation).**
   Every decline, in both directions, sends a cushioned note in real time.
   **Three ways to produce it, escalating cushion (DECIDED, Richard
   2026-07-06):**
   - **Pick a default reason** — "I can't take this on right now" · "This
     one's outside what I can speak to." One tap.
   - **Write your own** — AI polishes it toward kindness.
   - **Let the AI relay it** — the helper just tells the AI casually what's
     going on ("slammed this month, can't do it") and the AI composes and
     sends the cushioned note on their behalf. The helper never has to address
     the asker directly at all — the AI is the buffer. This is the softest
     path and the new default for anyone who hesitates to write a no.
   Recipient declining a direct ask → the asker's row flips to "Declined" +
   the note; the ask closes early with the same recovery actions as the
   14-day close. Asker declining an offer → the helper gets the same cushioned
   treatment ("Went another way on this one — thank you for raising your
   hand"). The buffer moves from *invisibility* to *cushioning*: nobody writes
   a rejection from scratch, nobody reads a bare one, and — with the AI-relay
   layer — nobody even has to speak the no in their own voice. (Scope: asks
   only — connect-request declines stay quiet as before.)
9. **The 14-day close, narrowed to silence.** If nothing has answered an ask
   by day 14, the backend closes it — now covering **pure silence only**,
   with the same no-fault wording ("This ask has closed — [name] wasn't able
   to get to it") and the recovery actions: "Ask someone else" (search
   reopens, prior recipients excluded) or "Open it to the circle" (one tap,
   text intact). Receiver side: one gentle reminder around day 5 ("Alex is
   waiting on an ask — take a look?", existing `reminder_sent_at` plumbing);
   at close the pending item silently disappears — no guilt screen — and the
   timeout counts one of three strikes toward auto-pause (§3b). Open asks:
   "Your ask has closed — want to renew it, or let it rest?"

### 3a-detail · The asking flow, page by page (REVISED 2026-07-06)

One page carries find + compose (two branches out of the search); then the
ask lives in exactly two places: its **status view** and, once accepted,
**Messages**.

**Page 1 — Help·Get, find state** (`/help`, blue wash)
- Entry points: sidebar Help · Home's ask entry (arrives with the question
  box focused) · profile "Ask for help" (skips search — lands in the composer
  with that person already chosen).
- On screen: pill toggle (Get active) · "What do you need?" · the question
  box · as the member types, matches with evidence fade in below, with the
  "Ask the circle" door beside them.

**Page 1A — the composer (person branch)** — question carries in as the
member's first turn · AI drafts the tailored note · edit + tone lenses ·
"Send to Maya" → inline Result ("She'll see it today. Asks stay open 14
days.") → status view.

**Page 1B — the open ask (circle branch)** — AI shaping beat · two-tier
reach control ("Who can find this?") · anonymity toggle · "Post your ask" →
inline Result → status view.

**Page 2 — Ask status view** (`/help/asks/[id]`, the target of every
notification about this ask)
- Header: the ask text · reach line ("Sent to Maya" / "Private — suggested
  to good matches" / "Public — anyone can find it") · **no running countdown;
  a quiet expiry warning appears only in the last 3 days** ("3 days left
  before this ask closes") — calm-not-urgent, no daily ticking (CHANGED,
  Richard 2026-07-06) · one action: **Retract this ask** · (opens) the
  anonymity state.
- Direct road: the recipient row, two honest states — "Waiting" (no read
  receipts, no last-seen) or "Declined" + the cushioned note.
- Open road: **offer rows** as they arrive — helper preview + note + Accept /
  Decline (decline sends the helper a cushioned note). Accept → thread;
  remaining offers get the no-fault closure ("This ask has been answered").
- Where it surfaces elsewhere: Home "Your open asks" module rows → here;
  Messages "Waiting" group shows a compact echo row → here.

**Page 3 — the thread** (Messages) — origin line; **no running day clock —
only a "3 days left before this ask closes" flag in the last 3 days** (CHANGED
2026-07-06: a countdown on an active conversation is quietly anxious and
against calm-not-urgent; the clock disappears once a thread is underway and
returns only as a gentle late warning); Mark resolved with an optional
one-line outcome note (DECIDED 2026-07-06: yes — skippable, feeds the ADR 0010
D4 flywheel), then the "Add to your circle" nudge. From here the ask is just a
conversation.

**Closure paths, all roads:** answered (resolved) · retracted · declined by
every recipient (early close + recovery) · 14-day close (silence only).
Every path ends with the status view in a terminal state, reachable from
history but never nagging.

### 3b · Give help (green wash) — three arms (REVISED 2026-07-06)

1. **The switch + your topics** — an "Open to helping" switch with **no
   clock expiry (DECIDED 2026-07-06)**: the status never lapses on a timer.
   It auto-pauses only on unresponsiveness — **three direct asks left to time
   out unanswered** (the day-14 close) quietly pause matching until the
   helper flips it back; any response, accept or decline, resets the count.
   **Topics: up to 5 (DECIDED 2026-07-06)** — standing chips with add/remove
   (× on each, + Add until full), the same data as onboarding step 4; they
   drive arm 1 and Home's "Needs you this week." **No capacity meter
   (DECIDED 2026-07-05):** the switch + "we stop matching you when you're
   busy" carries the reassurance; `max_pending_requests` stays the invisible
   abuse valve.
2. **Arm 1 — AI suggestions from your topics** — open asks matching the
   standing chips, each with a match-evidence line naming which topic fits.
   Below threshold = honest empty state ("Nothing needs you right now —
   we'll nudge you when something does").
3. **Arm 2 — search** — the giver searches a topic they'd like to help with
   ("career change", "moving abroad") → open asks they think they can take.
   Public asks are freely searchable; private-tier asks appear only where
   relevance already gates them (arm 1 + matched search results) — matched,
   never browsed. **A quiet list, never a feed:** no view counts, no public
   replies (offers are private 1:1), relevance/recency sort only.
4. **Arm 3 — asked you directly** — direct asks naming this helper,
   **flagged and impossible to miss**: a marked row opening the full detail
   view (ask text, who's asking, accept / decline). Canonical home: Messages'
   "Waiting on you" group; echoed here.

**Offer** (from any arm) → a note that writes itself (DECIDED 2026-07-06):
default line or custom, AI-helped either way → sent. Asker accepts → thread
("You offered to help with…" origin line; on an anonymous ask this is the
reveal moment, to this helper only). Asker declines → cushioned note to the
helper; unpicked offers get "This ask has been answered."
**Accept** (direct asks) → a default opening message or custom, AI-helped —
the thread never starts cold. **Decline** → always with a note (§3a step 8).
RLS note for build time: two read-policy shapes — match-row grant (private
tier, existing) · org-member (public tier); `rls-auditor` mandatory (extends
ADR 0011 Phase 5).

Buffer inventory for Help (revised 2026-07-06): cushioned, symmetric declines
(default reasons + AI help on both sides — saying no never means drafting a
rejection, hearing no never means silence) · search results private to the
asker · pause + 3-strike auto-pause, never announced · no-fault day-14 close
reserved for pure silence · asker-holds-accept on offers, helper-holds-accept
on direct asks · retract without trace. **Seam to watch in the pilot:** the
default decline reasons carry the buffer now — they must stay no-fault and
unranked; if visible declines make hesitant members ask less, revisit.

## 4 · People — the directory

**Job:** find the right person; decide whether to reach out; one action per row.

1. **NL search capsule** ("designers who moved in-house in the Bay Area") +
   scope segmented (All / Open to help / In your circle) + filter pills
   (Industry · Class year · Location). Per the 1a specimen
   (`preview/people-directory.html`): kicker states the room ("Directory ·
   2,412 members"), headline states the job ("Find people to connect with."),
   this capsule is the directory's own search field (no global ⌘K palette —
   removed 2026-07-06), and the **results meta always states count + sort**
   ("248 people · Best match") — never a mystery feed.
   **Search auto-routes, invisibly — no toggle, one result surface (DECIDED,
   Richard 2026-07-06; clarified — the routing is purely backend).** People
   search **always returns people**, on the People page, in one consistent
   result format with an evidence/explanation line on each row. What varies is
   only the *backend*, and the member never sees or chooses it: a simple
   keyword/structured query ("class of '14 in tech") is served by fast
   keyword+filter search; a query that keyword search can't satisfy ("people
   who reinvented themselves after a layoff") is routed through the NL /
   entity-extraction + vector pipeline. **Same page, same result shape, same
   kind of explanation, either way.** There is **no cross-routing** — People
   never redirects to Help or "ask the circle," and Help never jumps to a
   profile; each page owns its job. The filter pills are simply the structured
   entry style; typing a sentence is the NL entry style — both land people.
   (Build note: extends ADR 0006's entity extraction with a keyword-vs-NL
   route decision; 0009 supplies the vector side. Invisible to the user.)
2. **Result rows** — rotation-pair initials avatar (identity only, never
   status — E2), name + status chip (In your circle / ● Open to help /
   Requested) + "Strong match" as quiet blue text only when true, role line
   (role · company · city · class year), topic chips, **one action** by
   relationship state: Message (already connected) / Connect / Pending
   (disabled) — plus a **chevron** that opens the preview rail without
   hijacking the action.
3. **Profile preview rail** — docked 340px on desktop, persistent across
   rows: Why-this-match card with prose evidence + fact chips + **double
   provenance** ("From verified profile facts · ranked for '[query]'"),
   Career, **"You share"** (shared history: "Prof. Whitman's studio — 8 years
   apart"), actions: **Ask for help** (primary) + Message/Connect, and the
   enrichment honesty line ("Profile auto-updated from public sources · last
   checked May 2026"). **Copy drift:** the specimen's CTAs still read "Ask
   for advice" — rename to "Ask for help" (and update O8's CTA list) at the
   next DesignSync push.
4. **Connect flow** — two intro modes (ADR 0011 D2): quick-hello chips for
   people you know; conversational AI intro for strangers (drafts into the
   request message). Mutual accept → DM thread in Messages. Decline is quiet.
5. **Ask-from-profile** — "Ask for help" skips Help·Get's search and lands in
   the composer with this person already chosen.
6. **People vs Help — two separate jobs, no cross-routing (DECIDED,
   Richard 2026-07-06):** People answers "who is this kind of person?"
   (person-shaped queries: "people who graduated from the West Coast",
   "working in tech", "with a graduate degree") → profile, Connect, Message.
   Help answers "who can help with this?" (need-shaped: "I'm trying to move
   from marketing to HR") → the asking flow. They share the same NL
   understanding under the hood but **do not hand off to each other** — People
   always stays on People and returns people; Help always stays on Help. No
   "sounds like an ask?" nudge, no name-jump. Each surface owns its lane; the
   member is never bounced between them.

## 5 · Messages — every conversation, one room

**Job:** relationship lifecycle. List priorities: ① needs reply ② active
③ history. Filters as chips (All / Unread / My circle / Open asks), not tabs.

1. **Conversation list** — avatar, name + class year, preview, time; unread =
   heavy + blue dot; selected = tint + left accent. Pending items live in a
   **"Waiting on you" group pinned above conversations (DECIDED, Richard
   2026-07-06): foldable, with a red alert badge carrying the count** — the
   badge stays visible when folded, so pending things can be put away without
   losing the number. Contents: pending direct asks (flagged; "View ask"
   opens the accept/decline detail) and connect requests (Accept / Decline
   inline; connect declines stay quiet). Empty → the group disappears
   entirely, badge and all.
2. **Thread** — identical for every origin (D4). Class year + circle mark on
   names; **origin as a quiet system line** ("You connected", "Maya accepted
   your ask"); day dividers; read receipts; typing.
3. **Context rail** ("Profile") — who (chips: Verified '14, ● Open to help),
   **About this conversation** (which ask; **an expiry flag only in the last
   3 days** — "3 days left before this ask closes" — not a running Day-N-of-14
   counter, CHANGED 2026-07-06) when the thread came from an ask, one action
   (**Mark ask resolved**), shared files/links. **Fold/expandable within the chat (DECIDED, Richard
   2026-07-06):** a chevron collapses the rail so the conversation takes the
   full width; state remembered per member; expanded ⇒ sidebar collapses to
   the icon rail. **No "Schedule a call" button (removed 2026-07-06)** —
   scheduling happens in the conversation itself; no calendar integration.
4. **Resolve** — either side can mark the ask resolved → thread stays, ask
   closes, asker gets a gentle "did this help?" with an optional one-line
   outcome note (DECIDED 2026-07-06: yes — skippable, never blocking; feeds
   the flywheel per ADR 0010 D4). **Plus one opt-in checkbox (DECIDED
   2026-07-06):** "Share this win with the circle — names hidden unless you
   both say so." Unchecked (default) → the outcome never surfaces anywhere;
   checked by both sides → it becomes an "It worked" card on Home's deck
   (§2.1), names shown only if both opted into that too. This is the sole
   source of the outcome-story cards; no auto-harvesting without consent.
5. **Post-ask connect nudge** (ADR 0011 Phase 4) — after both sides have
   written, one quiet "Add to your circle" line in-thread, once per pair.

## 6 · School — events + announcements (REVISED 2026-07-06 · 1h refined)

**Job:** keep the school pulse close, without becoming the product's center.

1. **Attending strip — your going events, organized (DECIDED 2026-07-06):**
   a slim always-on-top strip, chronological, green dot + count; each chip
   (date tile · title · time · place) selects its event into the cover. The
   strip IS the manage surface — 1h's "Manage →" link is dropped. Empty
   state = one line + "Browse events".
2. **Event cover (navy) — the glance layer (DECIDED 2026-07-06):** the
   selected/next event as the punchy cover, carrying the quick-glance
   essentials without leaving the page: glass date tile, category, title,
   **one description line + host**, When/Where/Format, RSVP, Add to calendar
   (ICS download, no integration), and **"View details →"** into the event
   page. Navy is reserved for this cover alone.
   - **RSVP states:** pre-RSVP the cover leads with one-tap **"I'm going"**;
     after, **"✓ You're going · Change"**. Un-RSVP is silent — no departure
     signal anywhere; the count just recounts.
   - **Warm going-signal (CHANGED):** lead with the member's graph — "Maya,
     Jordan and 42 others · **3 from your circle are going**"; the avatar
     stack opens who's-going (respects directory privacy).
   - **Capacity (CHANGED):** 1h's fill bar is dropped — scarcity mechanics,
     against calm-not-urgent. Capacity is quiet text shown only when it
     matters ("16 spots left"); full → "This one's full — join the
     waitlist?"
3. **Event page (NEW, DECIDED 2026-07-06)** — `/school/events/[id]`, one
   page per event for the real details: itinerary/schedule, parking +
   directions, cost, host + contact, full who's-going (privacy-respecting,
   circle members first), with RSVP + Add to calendar repeated. Routes in:
   the cover's "View details", the upcoming list's chevron (the same
   chevron-for-depth pattern as People), and every event notification/email.
4. **Upcoming list** — date tiles; **"✓ Going" chips only** — 1h's "Viewing"
   chip is dropped; which event the cover shows is *selection*, carried by
   the tint + left-accent treatment (as in Messages). Selecting swaps the
   cover; chevron → event page. **Times are member-local first, campus time
   second** ("5:30 PM PT · 9:30 AM KST, Wed") — the two-campus rule; the
   event model needs an explicit time zone/campus field. Full calendar view:
   deferred — the list + strip cover pilot volume.
5. **Announcements** — pinned treatment for the one that matters, then
   reverse-chron rows; "2 new" chip; "View all →" → the index. Every row and
   the pinned banner click straight to a reading page (§6-detail).
6. **Newsletter — light card (CHANGED 2026-07-06):** demoted from 1h's navy
   tile to a light card beneath Announcements (two dark blocks fought for the
   eye, and the cover owns the navy), and **renamed from "The Bridge" to plain
   "Newsletter"**. The latest issue is the clickable thing (→ its reading
   page); "View more →" → the archive (§6-detail). No "Subscribe" button —
   email delivery is a profile preference (§7).
7. **Event flow:** RSVP → appears in strip + Home module; reminder email
   T-1d. Kicker reads "Chadwick" (not "Class of '26" — events are
   all-classes unless truly class-scoped). Empty states: no events = one
   warm line; the strip hides entirely when empty.

Specimen note: `preview/school-events.html` (1h) needs these edits at the
next DesignSync push — drop the capacity bar, "Manage →", the "Viewing"
chip, and the navy newsletter tile; add the pre-RSVP cover state, the
description + host line, the "View details" route, the circle-aware going
line, and dual time zones.

### 6-detail · School click-through pages

Standing rule (DECIDED, Richard 2026-07-06): **reading pages are final
destinations** — everything lives in the body or as inline links; no CTA
blocks, no onward modules. Both announcements and the newsletter follow a
**two-route pattern**: click the item on School (or Home) → straight to its
reading page; or "View all / View more →" → the index/archive list → a row →
the same reading page.

**Event page** (`/school/events/[id]`) — the depth layer the cover can't hold
(DECIDED, Richard 2026-07-06):
- (a) **the cover travels** — "View details" carries the same navy cover over
  as the page hero (O3 sanctions navy for event covers), details unfold on
  light canvas beneath, so the click reads as the cover expanding, not
  navigating; (b) **blocks appear only when filled** — About + host (member
  host → their profile; institutional host stays text), itinerary, "Good to
  know" fact cards (parking/directions as a maps link-out, cost, dress, +1
  policy); a casual mixer shows two blocks, a reunion dinner five; (c)
  **online events: the join link is RSVP-gated** and promoted into the cover
  as "Join now" near event time (~T-1h) — stops link leakage, gives RSVP a
  real function online.
- Who's going: circle first, expands in place, reuses the People row (one
  relationship-state action per row), directory privacy verbatim.
- **States:** **full** → waitlist, and promotion **asks, never auto-commits**
  ("A spot opened — still want in?"); **changed** → a quiet change line on the
  page + one notification to RSVP'd members (bell + email); **cancelled** →
  page stays reachable, states it plainly, notifies once; **past** → "You went
  · 44 attended" recap, controls gone, shared attendance feeds connect-intro
  suggestions in the plumbing (not on-page nudges). Off the page in every
  state: no comments, no view counts, no share-to-social — logistics + people
  only.

**Announcements — two pages:**
- Index (`/school/announcements`, the "View all →" target): tag filter chips
  (All / Mentorship / Hiring / Reunion / General), pinned item held on top
  regardless of filter, reverse-chron rows (title · tag · date · unread dot),
  each a door; month dividers only when volume earns them.
- Reading page (`/school/announcements/[id]`): reading column
  (`--container-reading 680`), no rails, marked read on arrival. **Final
  page** — anything actionable is written into the body or carried by inline
  links, never a button.

**Newsletter — two pages (renamed from "The Bridge" → plain "Newsletter",
DECIDED 2026-07-06):**
- Archive (`/school/newsletter`, the "View more →" target): reverse-chron
  issue cards (number, month, headline, three-line contents), each clickable —
  a blog archive, nothing fancier (no search, no tags).
- Issue page (`/school/newsletter/[issue]`): reads like a good email
  newsletter — plain news sections, links only where the text carries them,
  **no actions anywhere**. School's card jumps straight to the latest issue;
  the archive holds the rest. Email delivery is a profile preference (closes
  the Subscribe ❓), not a button here.

## 7 · Profile — self and others (DETAILED 2026-07-06)

**Job:** everything on the page serves one decision — reach out, or not.
Facts in the main column, warmth in the rail, exactly two verbs. **Off the
page always:** no "helped N people" stats, no endorsements, no followers, no
activity feed — numbers turn helping into a scoreboard.

### Other member (`/people/[id]`)

- **Header** — avatar (rotation pair), name + class year + Verified + ● Open
  to help chips, role line (role · company · city), and the only two verbs
  (ADR 0011): **Ask for help** (primary → composer with this person chosen) ·
  **Connect** (Message once connected; Requested disables while pending), with
  one honest circle-state line beside them.
- **Facts, now → history → shared root:** **About** (short paragraph) ·
  **Career** (reverse-chron with dates, current role heavy) · **Education**,
  always ending at "Chadwick School · Class of '14" with the circle motif —
  the one line every member shares.
- **"Can help with" — a section, not chips (DECIDED, Richard 2026-07-06; renamed from "Can speak to" 2026-07-12 — the viewer-facing templates settled on "Can help with" and it reads as an offer, matching the two-sided buffer; "can speak to it" survives as match-language copy discipline, not as the section title):**
  members phrase what they help with in their own words (a line or two each,
  not one-word tags), so it reads as a titled card of short entries, each with
  its own **Ask** button that opens the composer pre-seeded with that topic.
  Shown only when the member is open to helping; same data as their Give
  topics (one source of truth).
- **Rail (warm layer):** **Links & contact** (only the subset this viewer is
  entitled to — see self view) · **You share** (shared-history receipts:
  "Prof. Whitman's studio — 8 years apart", mutual and always true) · a quiet
  **"Profile last updated May 2026"** staleness hint. **"Why this match" does
  NOT live on the profile (DECIDED 2026-07-06)** — it answers "why is this row
  in front of me?", a question for the directory's scanning rail (§4.3), not
  for a page you've already opened; kept on the directory, dropped here.

### Connect moment (`/people/[id]` intro panel)

Two intro modes (ADR 0011 D2): quick-hello chips for someone you know (one
tap); conversational AI intro for a stranger (say why, AI shapes it into the
request message). Drafts in a side panel — the profile stays visible. Mutual
accept, always → DM thread + quiet "You connected" line + circle mark from
then on. **Connect declines stay quiet** (scoped 2026-07-06: decline-with-note
covers asks only — an ask declined is about the ask; a connection declined is
about *you*, which keeps the cover).

### Self (`/profile`)

- **Same layout, edit in place** — a quiet ✎ per block; what others see is
  exactly what you edit, no separate edit-mode page. Photo nudge survives
  ("members with a photo hear back faster"), stated once.
- **Enrichment review queue — the owner's alone (DECIDED 2026-07-06):** "We
  found a change — approve? · N alarms", one card per auto-detected fact,
  Approve / Dismiss, nothing publishes without approval. This machinery lives
  only here; a visitor sees just the "last updated" line. Home's profile-
  freshness module points here.
- **Links & contact, visibility per item (DECIDED 2026-07-06):** add a
  LinkedIn URL, portfolio, email, socials — each with its own audience:
  **Public** (any member) · **Circle** (connected only) · **Private** (just
  you) · or don't add it. The other-member rail renders exactly the subset the
  viewer is entitled to (a circle-only email is invisible to a stranger,
  present to a connection). Nothing shared by default; every link is opt-in.
- **Helping has one home (DECIDED, Richard 2026-07-06):** the availability
  switch + topics are *managed* on Help·Give (per ADR 0011 folding settings
  into `/help`); the profile shows a read-only mirror with a link — one source
  of truth, no divergent settings.
- **Email & quiet:** newsletter-by-email preference (the settled Subscribe
  question) alongside transactional prefs, and the **pause switch** — stepping
  away is a setting, never announced to anyone.

## 7b · Navigation & back-behavior (NEW, DECIDED Richard 2026-07-06)

One model, no exceptions. Two planes plus overlays.

- **Plane 1 — Sections (the sidebar):** Home · Help · People · Messages ·
  School. Always one click, always top-level, **never a back target** —
  switching sections is lateral, not a stack. The active section is always
  lit in the sidebar so "where am I" is never ambiguous.
- **Plane 2 — Detail pages (stacked inside a section):** every detail page
  belongs to **exactly one section** and has **exactly one back target — that
  section's root**, labeled "← [Section]". Ownership:
  - **Help** owns the composer, the ask status view, and *your asks* history.
  - **Messages** owns threads.
  - **School** owns event pages, the announcements index + reading pages, and
    the newsletter archive + issue pages.
  - **People** owns the directory. **Self profile & settings** live under the
    member card (a top-level destination, back → wherever you were is not
    needed because it's reached deliberately).
- **The one back rule:** *back always means up one level to the current
  section's root* — never "the previous arbitrary screen," never
  browser-history-dependent. This is what keeps it predictable no matter how
  you arrived.
- **Deep-link arrivals adopt their section.** A bell notification, email,
  spotlight card, or in-page link that opens a detail page lands you with that
  page's **section lit and its "← Section" back** — so you are never orphaned.
  (An ask link → Help; a thread link → Messages; an event link → School.)
- **Overlays never navigate — they return in place:**
  - **Other-member profiles open as a slide-over panel** over whatever you're
    on (a People row, a name in a thread, a who's-going list, a spotlight
    card). Close → exactly where you were. (This is why a profile never breaks
    your place — it is not a stacked page. On People it is the docked preview
    rail; elsewhere it is a slide-over.)
  - **Dialogs** (accept / decline / resolve / connect intro / report / RSVP
    confirm) overlay and dismiss back to the current view.
  - **In-place expansions** (context rail fold, who's-going, "Waiting on you"
    fold) are not navigation; nothing to back out of.

Net: 5 roots, each detail page has one unambiguous back target, profiles and
dialogs are overlays that return you where you stood. No history-dependence,
no orphan states, no special cases.

## 7c · Trust & safety (NEW, DECIDED Richard 2026-07-06)

The safety layer the buffer work implied but never specced. Moderation runs
**through the report pipeline** — there is no separate moderation console in
the member app (admin handles the queue, out of scope here).

- **Report** — available on every member-authored surface: an ask (direct or
  open), an offer, a message in a thread, and a profile. Report → a small
  dialog (reason: harassment · spam · inappropriate · impersonation · other +
  optional note) → sent to the admin moderation queue; the reporter gets a
  quiet "Thanks — we'll look into it," never a status thread. Reporting is
  always private to the reporter.
- **Block** — from a profile or a thread. **Always takes a confirmation step
  first (DECIDED, Richard 2026-07-06):** a warning dialog spells out exactly
  what happens — "Block [name]? You won't see each other's asks or messages,
  and neither of you can reach the other. You can undo this in Settings." —
  with **Cancel** as the calm default and **Block** as the deliberate action.
  Only on confirm does it commit. A block is then mutual-invisible: a blocked
  pair cannot see each other's asks (open or direct), cannot offer on each
  other, cannot appear in each other's People results, cannot message.
  **Anonymity does not defeat a block** — an anonymous open ask is filtered
  out of a blocked member's view server-side (the block is evaluated on the
  real identity, never revealed). Blocking is silent to the blocked person.
  A blocked-users list lives in settings (§7d), where a block can be lifted.
- **Disconnect** — remove someone from your circle. **Also takes a
  confirmation step first (DECIDED, Richard 2026-07-06):** "Disconnect from
  [name]? You'll both leave each other's circle. Your messages stay, and
  neither of you is notified." — Cancel (default) / Disconnect. On confirm:
  mutual (both lose the circle mark and the "My circle" grouping); **silent**
  to the other side, in keeping with the buffer. Existing message history
  stays (disconnect is not block); a disconnected pair simply returns to
  ordinary members to each other. Reachable from the profile and from circle
  management (§7d).
  *(Report needs no confirmation — it isn't destructive to the reporter.
  Block and disconnect do, because they change a standing relationship; the
  confirmation is the standard destructive-action guard and, per the nav
  model §7b, an overlay dialog that dismisses back in place.)*
- **Anonymity abuse guard** — because anonymous asks are a cover-granting
  feature, they carry extra backstops: they obey blocks (above), they count
  against the same five-slot cap and `max_pending_requests` valve, and a
  reported anonymous ask reveals its author **to admins only** through the
  report pipeline. The cover protects the vulnerable asker, never a bad actor.

## 7d · Account, settings & the surfaces the flows point at (NEW 2026-07-06)

The connective-tissue surfaces the core flows reference but hadn't mapped.

- **Settings** (from the member card, alongside self profile): account (email,
  sign-out, **delete account + data export** — school-community compliance,
  not optional), notification & email preferences (per-type, plus the
  newsletter-by-email toggle from §7), the **blocked-users list** (unblock
  here), and **pause**. One quiet settings page, no sub-maze.
- **The notification section** (`/notifications`, opened from the bell's "see
  all" or a sidebar-less route) — the durable list behind the popover:
  every notification in reverse-chron, each deep-linking to its target per
  §7b. The popover shows the *unmissable* few once; this page is the full
  record. Read-state clears the bell dot.
- **Your asks — history** (`/help/asks`, reached from Home's "Your open asks"
  → "See all", and from Help) — the index of *all* your asks: the ≤5 open ones
  with their status pills up top, then resolved / retracted / closed ones as
  quiet history. This is the "reachable from history but never nagging"
  surface the ask lifecycle keeps promising.
- **My circle** (a scope/filter that also has a managed view) — who you're
  connected to, with per-row Message / Disconnect. Reached from the "My
  circle" filter in Messages and from People's "In your circle" scope.

## 8 · Cross-cutting

- **Empty states** — every module: one warm line + one useful action, no
  illustration theater. Waiting and Declined use the calm neutral base roles
  directly (`--text-secondary` on `--surface-subtle`); E1's redundant aliases
  were retired 2026-07-13 after the templates settled that treatment.
- **System states (NEW 2026-07-06)** — a consistent, calm set: **not-found /
  gone** (a retracted ask, a cancelled event, a deleted profile you followed a
  stale link to → "This isn't here anymore" + a way back to the section root,
  per §7b) · **permission-denied** (a private ask or circle-only link you're
  not entitled to → the same calm "not here for you," never revealing what
  exists) · **offline / failed load** ("Couldn't load that — try again," a
  retry, no blame) · **loading** (skeletons in the module's own shape, never a
  spinner over the whole shell). Same voice as everything else: warm, plain,
  a next step.
- **Notifications/email touchpoints** (existing plumbing + new, 2026-07-06):
  ask received, ask accepted, offer received, offer accepted, **decline note
  received**, connect request, connect accepted, event reminder, expiry
  warning, **event changed**, **event cancelled**, **waitlist spot opened**
  ("still want in?"). Each surfaces once in the bell popover, then lives in
  notifications / Messages. Weekly digest: **not yet (DECIDED 2026-07-06)** —
  transactional only for v1.
- **The two-sided buffer, audited per flow (revised 2026-07-06):** every
  decline is cushioned and symmetric — default reasons + AI help on both
  sides, so saying no never means drafting a rejection and hearing no never
  means silence (connect-request declines stay quiet as before); every send
  path shows the sender exactly who will see it; search results are private
  to the asker; every "waiting" state is honest but calm. Any screen that
  violates this is wrong regardless of how it looks.
- **CircleMark (E4)** — stays proposed for a future brand pass. In v1,
  "In your circle" chips carry the relationship state; do not add the mark to
  Messages or People names.

## 9 · Suggested design order (Claude Design)

1. **Help (both modes)** — the product's heart, most decisions already made.
2. **Messages** — where every flow lands.
3. **Home** — composes modules from 1–2 (+ the "This week in the circle" spotlight).
4. **People** — 1a is already close to final.
5. **School** — 1h refined + the click-through pages (event/announcement/newsletter).
6. **Profile** — self + others, detailed 2026-07-06.
7. **Onboarding + cold-start** (§1) — the empty-first-session fix.
8. **Connective tissue** (§7b–§7d): navigation model · trust &amp; safety
   (report/block/disconnect) · settings · notifications section · ask history ·
   my circle · system states.

All member flows are now specced. Mobile remains deferred (desktop-first).

Each flow designed in the `bridgecircle` Claude Design project as a
`templates/<section>/<Name>.dc.html` DesignComponent, checkpoint-synced to the
repo. (The earlier `screens/<name>.html` plan and its Codex People/Profile
slice were superseded by the templates and removed 2026-07-12.)

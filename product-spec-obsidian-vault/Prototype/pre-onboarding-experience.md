# Pre-Onboarding Experience

**Status:** Prototype (not yet built) · draft 2026-08-03
**Scope:** invite/QR entry → signup + LinkedIn → locked first look → opening day
**Pilot context:** Chadwick School (English-only). Bilingual/Korean pre-onboarding surfaces are deferred — see [Open Questions](#open-questions).
**Reach:** Scoped as a **Chadwick special-pilot launch mechanism**, not a standing capability every org inherits — see [Pilot-specific by intent](#pilot-specific-by-intent).
**Related:** [[spec]] · [[user-flows]] (Flow M1) · [[launch-cut]] · [[North Star and Long-Horizon Roadmap]]

---

## Why this is a Prototype spec (and what it changes)

The invite plumbing is already built and shipped. What this spec adds is **not**. Placement is by implementation status, so this lives in `Prototype/` until the locked-preview gate lands in mainline.

**Already in mainline (this spec reuses it):**

- `invites` table — per-email token hash, `expires_at`, `status` check constraint (`pending` / `accepted` / `expired` / `revoked`), pre-filled `full_name` / `graduation_year` (`app/supabase/migrations/20260713231344_v2_init.sql:101`; the pre-v2 definition this spec was drafted against now sits in `app/supabase/legacy/migrations/`).
- Token issue / verify / accept (`app/src/lib/invite/`), batch send + CSV import, admin invite UI.
- `/join` landing (org name as text branding), signup via Google + password, email locked to the invited address (`app/src/app/(auth)/join/`).
- Invite email (`app/src/notify/emails/invite-email.tsx`), sign-in, OAuth callback, admin-approval / pending-membership machinery.
- 5-step `/onboarding` with LinkedIn import at `/onboarding/import`.

**New in this spec (not built):**

1. **QR / shared-URL entry** alongside the per-email invite link.
2. **LinkedIn pulled forward** into the signup step, so a rich profile exists before the member ever reaches the app.
3. **A locked "first look"** — the app is visible but not usable — that holds a reserved member until the circle opens.
4. **Admin-triggered "opening day"** that releases the whole reserved cohort at once.

> **Drift flag.** Today both signup paths `redirect('/onboarding?step=1')` the instant the account is created (`app/src/app/(auth)/join/actions.ts`, `app/src/app/auth/callback/route.ts`). This spec inserts a **reserved** state between signup and full onboarding. When this ships, those redirects change and this file graduates to `Production/`; update the redirect targets and this note in the same change. Code is canonical — if the routing already changed by the time you read this, fix this spec, not the code.

---

## The problem this solves

A warm network is worthless empty.

BridgeCircle's whole thesis is a **living, useful directory** that lowers the barrier to asking ([[spec]] — "The main wedge is… a living, useful alumni directory"). But a directory has a cold-start problem that cuts against the thesis directly:

- If members are admitted **one at a time** as invites trickle in, the first arrivals — the most enthusiastic, exactly the cohort you most want to keep — land in an empty room. No one to browse, no one to ask, no mentors open yet.
- The [priority reader](../../docs/product/brand-strategy.md) is the **embarrassed asker**, "the reader who quietly walks away when the experience is wrong." An empty directory is the most wrong first experience possible for that reader.
- Trickle-in admission also means the directory is only as fresh as its slowest joiner. On any given day it looks half-built.

The pre-onboarding experience converts the pre-launch dead time into two assets:

1. **A pre-populated directory.** Signup + LinkedIn import happen *before* the doors open, so on opening day the directory is already full of real, current, LinkedIn-fresh profiles — not a scattering of stubs.
2. **A cohort that crosses together.** A calm first look builds anticipation, and an admin-triggered opening day lets the whole reserved cohort enter at once. Nobody is the awkward first mover in an empty room — which is the [two-sided buffer](../../CLAUDE.md) applied to the very first threshold.

> **Framing rule for this feature:** the locked gate is a *feature, not a limitation*. Copy never apologizes for it. "The circle is still gathering" is a promise, not a delay.

---

## The flow at a glance

```
INVITE                    SIGNUP + LINKEDIN            FIRST LOOK (locked)        OPENING DAY
─────────────────────    ──────────────────────      ────────────────────      ─────────────────
email link  ─┐                                         your profile card         admin opens circle
             ├─► /join ─► create account ─► connect ─► the circle gathering ──► reserved cohort
QR / URL   ──┘  verify     (Google/pw)     LinkedIn     a peek at day one          released together
                token      email locked     (or skip)   (app visible, locked)      ─► /onboarding ─► app
```

A member who completes signup is **reserved**: their spot is held, their profile is building, and a [reservation token](#two-token-types) — separate from the spent invite token, with no countdown — holds their place however long the circle takes to fill. They wait on the first look until the admin opens the circle.

---

## Pilot-specific by intent

This whole mechanism — the locked first look, the reserved hold, the admin-triggered opening day — is scoped as a **bespoke Chadwick pilot launch treatment**, not a standing capability every future org automatically gets. That is a deliberate choice, and it *narrows* the build:

- **Build for one org, well.** No multi-org configuration surface, no per-org toggle for "does this org use a locked launch," no self-serve setup. Chadwick's launch is coordinated by hand with the admin.
- **Don't generalize prematurely.** Threshold-auto-open, scheduled-date-open, and reusable launch-campaign tooling are explicitly *not* in scope. The pilot's job is to prove the cold-start bet is real before we invest in generalizing it.
- **Graduation criterion.** If the pilot shows the locked-gather-then-open pattern measurably beats trickle-in admission (see [Analytics](#analytics--the-pre-onboarding-funnel) — opening-day activation), *then* a follow-on spec generalizes it into a standing capability. Until then, treat any generalization work as speculative scope to cut ([[spec]] — single-engineer discipline).

Practically: it is fine for the `reserved` status, the reservation token, and the "Open the circle" control to exist in the schema and codebase as general primitives — that costs little and keeps them clean. What we avoid is the *product surface* of making this a configurable, self-serve, every-org feature before one real launch has earned it.

---

## Entry modes

There are two ways a prospective member reaches `/join`. Both preserve the invite-only trust guarantee — nobody enters the roster without the school having put them there.

### E1: Personal email invite (built, reused as-is)

The existing path. A per-email token in the invite email links to `/join?token=…`. The token *is* the authorization; email is locked to the invited address. No change to token issue/verify/accept.

### E2: QR code / shared URL (new)

A QR code (printed on a reunion nametag, a campus poster, an alumni mailer, a class-page slide) or a shared short URL routes to the same `/join`, but **without a per-email token** — a poster is one-to-many, so it cannot carry a single-use token.

- The QR encodes an **org-scoped join URL** (e.g. `/join?org={slug}`), not a token.
- The landing asks for the member's **school email or name + graduation year**, matched server-side against the **pre-loaded invite roster** (the CSV the admin already imported — [[user-flows]] Flow A2).
- **On a roster match:** issue a token for that email on the spot and continue exactly as E1. Same trust guarantee, different doorway.
- **On no match:** route to a **request-access** state that creates a `pending` membership for admin review (reuses the existing `requires_admin_approval` machinery — [[user-flows]] Flow A3). The member is told plainly that the school confirms alumni before the circle opens.

**Key rule:** QR entry never *widens* who can join — it only offers a second doorway to people the school already listed, plus a reviewed request path for everyone else. The directory stays verified.

---

## The signup step (LinkedIn pulled forward)

Today, LinkedIn import lives inside `/onboarding` (`/onboarding/import`), *after* signup. This spec pulls it forward so a rich profile exists before the member reaches the first look — that is what makes the directory alive on opening day.

### Happy path

1. Member lands on `/join` (via E1 or E2), sees "You're invited to Chadwick," name/email pre-filled, email locked.
2. Member creates the account (Google or password) — existing `signUpWithPassword` / `startGoogleSignup`.
3. Immediately after account creation, member is offered **"Set up your profile from LinkedIn"** — one step, framed as saving effort, not as data extraction.
4. On connect, the LinkedIn-backed import (LinkdAPI, PDL fallback — [[spec]] "Profile Freshness Strategy") populates the base profile: name, headline, current role, employer, city, university, major.
5. Member is routed to the **first look**, where the imported profile appears as a card to **confirm or edit** — never silently applied ([[spec]] trust rule: "import, suggest, confirm — never silently overwrite").

### No-LinkedIn fallback

- **Skip** is always offered, equal in weight to connect — no dark pattern, no "are you sure?"
- A skipping member still reaches the first look; their profile card shows the invite pre-fill (name, grad year) and an honest, warm prompt to finish it on opening day or now.
- Members can also import via **resume / screenshot** on the first look ([[spec]] "optional resume, CV, or screenshot-based extraction as fallback input").

### Why up front

- **Freshness on day one.** The directory opens full of current profiles, not stubs. This is the freshness strategy's onboarding import, moved to where it does the most good.
- **One decision, at the highest-intent moment.** The member just accepted an invitation; asking for LinkedIn now, once, is lower friction than surfacing it later.
- **The first look has something to show.** "Here's how your circle will see you" only works if there's a real card to show. LinkedIn makes that card real with near-zero member effort.

---

## The first look (locked)

The core new surface. The app is **visible but not usable**. This is where anticipation is built and the reserved member's own profile is confirmed. In product copy this is the **first look** — never "demo" (internal term only) and never "coming soon" (generic SaaS).

### What it shows

Three honest panels. None fakes usable data.

1. **Your card — "How your circle will see you."**
   The LinkedIn-imported (or pre-filled) profile card, exactly as it will appear in the directory. **Editable now.** This is the one thing the member *can* act on — it doubles as the confirm-your-import step and gives the locked page a real, personal reason to exist.

2. **The circle gathering — honest, specific counts.**
   Real numbers only. "41 alumni have joined so far. 6 are open to mentoring." If it's small, say small. Never a fabricated tally, never "bursting with possibilities" ([voice §5.4](../../docs/product/voice-guidelines.md), §13). This is social proof told the coordinator's way — specific, not hyped — and it is the honest engine of anticipation.

3. **A peek at opening day.**
   A dimmed, non-interactive preview of the three core surfaces the member will get — the directory, mentorship, events — labeled as what opens, not as something withheld. Tapping a locked surface surfaces the calm gate message (below), never a hard "access denied."

### What it must not do

- No fabricated profiles presented as real members. A preview of *your own* card is honest; fake peers are not.
- No countdown timer, no "spots filling fast," no streaks or urgency ([voice §5.3](../../docs/product/voice-guidelines.md), §13).
- No dead end. Every locked tap returns the member to something they *can* do (edit their card, read who's gathering).

### Copy — the gate message

When a reserved member taps a locked surface, or returns to `/`:

> **Your circle is still gathering.**
>
> We're waiting until enough Chadwick alumni have joined so the directory feels alive on day one — no empty rooms. We'll email you the moment it opens. In the meantime, [confirm how your profile looks].

Voice notes: reason-first (why it's locked), honest (names the real reason — critical mass), calm (no date pressure), one warm next step. Passes the embarrassed-asker test — it makes waiting feel considerate, not excluded.

---

## Opening day

### Trigger (pilot: admin-triggered)

For the first pilot, **the admin opens the circle.** A single control ("Open the circle") in the admin dashboard releases the entire reserved cohort at once. The admin is the human who judges when the directory is alive enough — this is the coordinator's call, not a threshold an algorithm trips.

- **Recommended default: admin-triggered**, optionally paired with a soft opening *date* communicated to members ("We expect to open the week of…"). Simplest, most controllable, most human for a 500–1000-invite pilot.
- **Deferred alternatives** (don't build for the pilot): auto-open at a member-count threshold; auto-open on a scheduled date. Both remove the human judgment that makes the pilot safe, and both are generalization work that the [pilot-specific scope](#pilot-specific-by-intent) explicitly defers until the pattern is proven.

### What happens on release

1. Every **reserved** membership transitions to **active** (or to `pending` admin approval if that org requires it — the two gates compose; admin-approval is orthogonal to the opening-day gate).
2. Each released member gets the **opening-day email** (below).
3. On next visit, the locked first look is replaced by `/onboarding` to finish any remaining profile fields, then the live app.
4. The directory is immediately populated with the cohort's LinkedIn-fresh profiles — the payoff of the whole flow.

### Copy — opening-day email

> **Subject:** The Chadwick circle is open
>
> Hi Maren,
>
> The Chadwick alumni circle is open. 340 alumni joined before today, so there are already people to find — including a few in Brooklyn, and a handful open to mentoring.
>
> [Step inside]
>
> — Iris Chen, Chadwick Alumni Office

Voice notes: specific counts (the honest anticipation, now paid off), no exclamation, warm coordinator sign-off, one CTA. Subject ≤ 50 chars, specific, not clickbait ([voice §8](../../docs/product/voice-guidelines.md)).

---

## Membership state model

The gate needs a state that means *invited, signed up, profile building, but not yet admitted.* Reusing `pending` (which today means admin-approval-pending) would conflate two different holds.

**Proposed:** a distinct membership status — working name **`reserved`** — with these transitions:

| From | Event | To |
| --- | --- | --- |
| (none) | invite accepted / signup complete | `reserved` |
| `reserved` | admin opens the circle (no approval required) | `active` |
| `reserved` | admin opens the circle (org requires approval) | `pending` → `active` on approval |
| `reserved` | member self-withdraws | `withdrawn` |

Routing while `reserved`: any authenticated app route redirects to the first look. Add `reserved` handling to the middleware in `app/src/proxy.ts` and the OAuth-callback lifecycle branching (`app/src/app/auth/callback/route.ts`), alongside the existing active / pending / deactivated branches.

### Two token types

The existing invite token cannot govern the reserved phase — its 14-day life is designed to force a prompt *account decision*, but the reserved phase is **open-ended by design** (we don't know how long the circle takes to fill). Overloading one token to mean both "decide soon" and "wait indefinitely" is the trap. So the reserved phase gets its own, separately tracked token.

| | **Invite token** (built) | **Reservation token** (new) |
| --- | --- | --- |
| Authorizes | account creation on `/join` | the reserved first-look phase + durable re-entry |
| Issued at | admin sends invite | signup / reservation completes |
| Lifetime | 14 days, fixed countdown | **bound to the reservation lifecycle, not a clock** — valid while `reserved`, invalidated on `active` or `withdrawn` |
| Purpose of the clock | force a prompt join decision | none — the hold has no deadline |
| Tracked | status enum on `invites` | its own record: issued / last-used / invalidated, per use auditable |

**How the handoff works:** the invite token is consumed at signup (unchanged). Reservation then mints a reservation token. That token — not the spent invite — is what:

- powers the **durable re-entry link** in re-engagement and opening-day emails (the "Step inside" CTA), which must survive an unknown wait,
- is re-verified server-side on each first-look visit (defense in depth, mirroring how the OAuth callback re-verifies the invite token today),
- gives the funnel a trackable, per-use handle for the reserved phase.

**The invariant this guarantees:** because the reservation token's validity is tied to the *membership state* rather than a countdown, **a reserved member can never be stranded by expiry, no matter how long the circle takes to open.** The 14-day clock only ever governs someone who has not yet signed up. This is the single most important correctness property of the feature and belongs in the state-machine ADR.

---

## Edge cases

- **Doors open while a member is mid-signup.** They join `active` directly, skipping the hold — the first look becomes a brief confirm step, not a locked wait. No member should be *newly* held on a circle that is already open.
- **Reserved member returns repeatedly before opening.** Always lands on the first look. The "circle gathering" counts update, so return visits show honest progress — the only anticipation mechanic, and it's real.
- **Member connected LinkedIn weeks ago; data is now stale by opening day.** Opening-day onboarding offers a one-tap re-confirm ("Your last role is from your LinkedIn — still current?"), reusing the freshness-nudge pattern.
- **QR entrant not on the roster.** Request-access → admin review. Never a silent drop; the member sees a plain "the school confirms alumni first" state.
- **Same person, email invite *and* QR.** Dedup on `(organization_id, email)` — the existing unique constraint already covers this; QR-issued tokens must respect it.
- **Member wants out before opening.** Offer `withdrawn` with a low-friction, blameless confirm ("This releases your spot. You can rejoin any time the invite is still open."). No guilt, no retention dark pattern.
- **LinkedIn import fails / rate-limited.** Fall back to manual + resume/screenshot on the first look; never block reservation on a vendor call. Reservation must succeed even if enrichment doesn't.
- **Invite expires before the member ever signs up.** Unchanged from today — expired-token error card on `/join`. Only *un-acted* invites can expire.

---

## Analytics — the pre-onboarding funnel

Extends the [[spec]] metric "invited to completed-profile rate" by instrumenting the hold.

**Funnel events:**

- `invite_opened` (existing)
- `join_landing_viewed` — split by entry mode (`email` / `qr`)
- `signup_started` / `signup_completed`
- `linkedin_connected` / `linkedin_skipped`
- `first_look_viewed`
- `profile_confirmed_prelaunch`
- `circle_opened` (admin action — org-level)
- `reserved_member_activated` — released member's first authenticated app action
- `first_discovery_action` (existing — first browse/search after opening)

**New headline metrics:**

- **Reservation rate** — invited → `reserved`. Measures whether the invitation + first look are compelling before there's an app to use.
- **LinkedIn attach rate** — reserved members with a LinkedIn-backed profile. Directly predicts opening-day directory quality.
- **Opening-day activation** — `reserved` → `active` with ≥1 discovery action within N days of `circle_opened`. The real test that the cold-start bet paid off: did the cohort actually move together?

Admin-facing framing follows the [admin voice register](../../docs/product/voice-guidelines.md#111-admin-dashboards--insights) — "reservation rate," "activation rate," and "cohort" are admin-only vocabulary; never surface them member-side.

---

## What this spec deliberately does not change

- **Invite-only remains absolute.** No public self-serve signup, no marketing `/[org]` page. QR only adds a doorway for people the school already listed.
- **Token security is unchanged.** Per-email tokens keep their properties; QR issues a real per-email token on roster match rather than weakening the model.
- **Admin approval stays orthogonal.** Orgs that require approval still get it; the opening-day gate composes with it rather than replacing it.
- **Onboarding steps are unchanged.** The 5-step `/onboarding` still runs — it just runs on opening day, with most fields already LinkedIn-filled.

---

## Open questions

1. **Does this generalize past Chadwick at all?** This is scoped as a [Chadwick-only pilot mechanism](#pilot-specific-by-intent). The open question is not *how* to configure it for many orgs, but *whether* the pilot earns generalization in the first place — and if it does, whether later orgs even want a locked launch or just trickle-in. Answer with the pilot's opening-day-activation numbers before designing any multi-org surface.
2. **Bilingual pre-onboarding.** Chadwick International is bilingual. The invite email, first look, and opening-day email will need Korean surfaces — but machine translation is forbidden ([voice §17](../../docs/product/voice-guidelines.md)). Needs a native co-writer before any bilingual pilot. Out of scope for this English-only draft; do not ship Korean pre-onboarding copy from this spec.
3. **Mixed student / adult-alumni register.** The [voice open question on mixed-audience onboarding](../../docs/product/voice-guidelines.md#17-open-questions) applies squarely to the first look, which both students and established alumni will see pre-launch. Does the embarrassed-asker default need a younger-reader variant here?
4. **"Circle gathering" counts when the number is genuinely tiny.** At 3 joined, is the honest count still motivating, or does it undercut anticipation? Honesty is non-negotiable ([voice §5.4](../../docs/product/voice-guidelines.md)) — the question is whether to *lead* with the count or with the member's own card when the cohort is very small.
5. **Withdraw vs. defer.** Is an explicit `withdrawn` state worth building for the pilot, or is silent inaction (never sign up) sufficient? Leans defer.
6. **QR roster-matching signal.** Email is the cleanest roster key. Is name + graduation year a safe enough secondary match for QR entrants who don't recall which email the school used, or does that widen the trust surface too far?

---

## Recommended next artifacts

1. **Wireframes for the first look** — the highest-risk new surface, and the one most exposed to voice/trust mistakes. Wireframe before building, per [[user-flows]] ("Highest-Risk UX Areas").
2. **Membership state-machine ADR** — the `reserved` status, the token-expiry-can't-strand-a-reserved-member invariant, and the routing changes to `app/src/proxy.ts` and the OAuth callback. This is where the correctness risk concentrates.
3. **Admin "Open the circle" control spec** — the single most consequential admin action in the flow, including the confirm copy and the released-cohort email fan-out.

# Next Priorities

Six strategic directions identified after closing the 32-item UI/UX friction audit and centralizing the Civic Editorial design system. Each captures a recommendation, rough scope, and tradeoff. The audit closed *what was wrong*; these are the items that decide *what the product becomes*.

Captured 2026-05-06. Updated after the experience-docs restructure. Re-evaluate after #1 ships or every ~6 weeks, whichever comes first.

---

## 1. AI-assisted ask composer

**Status:** Flagged in `brand-strategy.md` as the active strategic gap. The composer at `/ask/new` is plain-text today.

**Why it matters:** The differentiation thesis ("lower the barrier to asking, turn cold email into warm welcome") requires this. It is the single feature that separates BridgeCircle from Graduway, Hivebrite, and Almabase categorically: they do not help users write the ask. Plumbing is partly there: Anthropic API key in `.env.local`, NL search already uses Haiku.

**Scope sketch:**

- "Help me draft this" button on `/ask/new`
- Server action calls Haiku with ask type, asker intent, helper profile context, and shared signals
- Returns 1-2 short opening drafts in the brand voice: warm, specific, not salesy
- User picks one or writes their own; can re-roll
- Microcopy: "a warmer way in" / "draft from your shared circle"

**Tradeoff:** Real cost on Anthropic per draft. Cheap on Haiku, but not free. One real build, not just polish.

**Recommended starting point.**

---

## 2. Onboarding and the first 60 seconds

**Status:** Unaudited. The friction audit only covered signed-in member surfaces. Invite redemption, onboarding, and first action need their own pass.

**Why it matters:** `differentiation.md` references the 60-second metric. A new alumnus's first 60 seconds determines whether they ever come back. The flow should express the asking thesis immediately, not after profile administration.

**Scope sketch:**

- Walk the full flow as a brand-new invitee: redeem invite, set up profile, land somewhere useful
- Identify drop-off risks: too many fields, unclear next step, hidden CTA
- Instrument signup and first-action milestones
- Tighten the landing CTA so asking is visible immediately
- Apply Civic Editorial screen rules from `docs/experience/` so onboarding feels guided, trustworthy, and member-first

**Tradeoff:** Could be a polish pass or a larger flow rethink depending on what the walkthrough reveals.

---

## 3. Civic system implementation pass

**Status:** The design system is now centralized in `docs/experience/ui/design-system/`. App implementation is only partially aligned through tokens and existing UI primitives.

**Why it matters:** The product thesis depends on feeling member-first, trusted, and different from incumbent portals. If production screens still read as generic SaaS, the brand work does not reach users.

**Scope sketch:**

- Audit Home, People, Inbox, Profile, Events, Admin, onboarding, and auth against `docs/experience/screens/phase-1-screen-map.md`
- Convert repeated visual decisions into app UI primitives where useful, without over-abstracting
- Align core surfaces to Civic tokens: typography, borders, radii, status colors, metadata treatment, card density, and action hierarchy
- Remove stale motifs that conflict with Civic Editorial, especially heavy gradients, generic blurple treatments, and decorative dashboard chrome
- Refresh screenshots after the pass so `docs/experience/ui/screenshots/` reflects the current app

**Tradeoff:** This is a design-system implementation pass, not a new product feature. Scope it screen by screen so it does not block thesis-critical work like ask drafting.

---

## 4. Email templates

**Status:** Resend wrappers exist in `/notify/`; template content has not had a brand or Civic visual pass.

**Why it matters:** Members see emails more often than the app. The invite email is the first impression. Ask-received, ask-accepted, ask-declined, weekly digest, and lifecycle emails carry the brand.

**Scope sketch:**

- Inventory every email template
- Audit each for brand voice: warm, specific, peer-to-peer, not salesy
- Rewrite where needed using the same standard as in-app copy
- Add Civic Editorial consistency: header, footer, restrained typography, clear action buttons, and plain signoff

**Tradeoff:** Mostly copy and design. Worth doing before real member volume because email is part of the product surface.

---

## 5. Reply-by-email parity

**Status:** Not implemented.

**Why it matters:** "Email-primary, app-available" is a brand promise. If a mentor gets an ask notification by email and hits Reply on their phone, the reply should arrive in the in-app thread.

**Scope sketch:**

- Resend inbound webhook
- Parse incoming email and match the thread by message-id or threading header
- Append to the ask thread as a message from the sender
- Handle HTML stripping, signature trimming, and attachment policy

**Tradeoff:** Real engineering work. Worth deciding before launch or deferring until first-cohort data shows whether members actually reply by email.

---

## 6. Production hygiene

**Status:** Mixed. Some pieces are in (`Sentry`, CI workflow); others are gaps.

**Why it matters:** It does not move the thesis directly, but it protects everything else. Quality compounds when changes can ship without fear.

**Scope sketch:**

- Verify `pnpm tsc --noEmit` runs cleanly in CI
- Add E2E coverage on the core loop: invite, signup, profile, search, ask, accept, conversation
- Run real user walkthroughs: 2 alumni x 20 minutes per week

**Tradeoff:** Independent items. Do à la carte if needed.

---

## How to choose what's first

If the goal is *the product becomes categorically different from incumbents:* **#1 AI-assisted ask composer**.

If the goal is *the product feels credible enough for real users:* **#3 Civic system implementation pass** alongside **#2 onboarding audit**.

If the goal is *the product is safe to put real users on:* **#6 production hygiene** first, then **#2 onboarding audit**, then **#4 emails**.

If the goal is *we want to know if the thesis is right:* **#6 user walkthroughs** unblock everything else.

Default recommendation: **#1 first, with #6 user walkthroughs running in parallel.** Use the walkthrough signal to tune #2, #3, #4, and #5.

---

## When to revisit this doc

- After #1 ships: re-rank #2, #3, #4, and #5 based on user-walkthrough signal
- After 6 weeks regardless: thesis-critical items can drift
- After any major external event, such as a competitor shipping a similar AI feature or a school committing to pilot

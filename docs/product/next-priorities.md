# Next Priorities

Five strategic directions identified after closing the 32-item UI/UX friction audit (Waves 1–5, plus follow-ups). Each captures a recommendation, rough scope, and the tradeoff. The audit closed *what was wrong*; these are the items that decide *what the product becomes*.

Captured 2026-05-06. Re-evaluate after #1 ships or every ~6 weeks, whichever comes first.

---

## 1. AI-assisted ask composer

**Status:** Flagged in `brand-strategy.md` and `project_bridgecircle.md` as the active strategic gap. The composer at `/ask/new` is plain-text today.

**Why it matters:** The differentiation thesis ("lower the barrier to asking, turn cold email into warm welcome") *requires* this. It's the single feature that separates BridgeCircle from Graduway, Hivebrite, and Almabase categorically — they don't help users *write the ask*. Plumbing is partly there: Anthropic API key in `.env.local`, NL search already uses Haiku.

**Scope sketch:**
- "Help me draft this" button on `/ask/new`
- Server action calls Haiku with: ask type (advice/mentorship), asker's intent, helper's profile context (current role, mentoring topics, headline), shared signals (school, cohort)
- Returns 1–2 short opening drafts in the brand voice (warm, specific, not salesy)
- User picks one or writes their own; can re-roll
- Microcopy: "a warmer way in" / "draft from your shared circle"

**Tradeoff:** Real cost on Anthropic per draft (cheap on Haiku, but adds up). One real two-week build, not polish.

**Recommended starting point.**

---

## 2. Onboarding & the first 60 seconds

**Status:** Unaudited. The friction audit only covered the signed-in member surfaces. Invite redemption → onboarding → first-action is its own surface area.

**Why it matters:** `differentiation.md` explicitly references "the 60-second metric." A new alumnus's first 60 seconds determines whether they ever come back. Right now we don't know what that experience is — I haven't walked it as a fresh user.

**Scope sketch:**
- Walk the full flow as a brand-new invitee: redeem invite → set up profile → land somewhere
- Identify drop-off risks: too many fields, unclear next step, hidden CTA
- Add `analytics_events` instrumentation around the flow (signup_started, profile_completed_first_field, first_ask_sent, etc.) — `differentiation.md` Section 10 already has this on the 30-day list
- Tighten the landing CTA so the asking thesis is visible immediately, not buried

**Tradeoff:** Could be 2 hours (just polish) or 2 weeks (rethink the flow) depending on what we find.

---

## 3. Email templates

**Status:** Resend wrappers exist (`/notify/`); template content has not had a brand-voice pass.

**Why it matters:** Members see your emails *more often than your app*. The invite email is the literal first impression. Ask-received, ask-accepted, ask-declined, weekly digest — every one carries the brand. The thesis is "email-primary, app-available." If the emails feel generic, every other brand effort is undone.

**Scope sketch:**
- Inventory every email template: invite, ask-received, ask-accepted, ask-declined, ask-expired, mentor-paused, friend-request-incoming, friend-request-accepted, message-received, weekly-digest, etc.
- Audit each for brand voice (banned words, warmth, peer-to-peer tone)
- Rewrite where needed — same standard as in-app copy
- Add visual consistency (header, footer, footer signoff)

**Tradeoff:** Largely a copy-and-design exercise, not engineering. Could be a 1–2 day pass with a copywriter pair.

---

## 4. Reply-by-email parity

**Status:** Listed in `project_bridgecircle.md` as on the punch list. Not implemented.

**Why it matters:** "Email-primary, app-available" is a brand promise. If a mentor gets an ask notification by email and hits Reply on their phone, the reply should arrive in the in-app thread. Today it doesn't — it goes to whatever From address Resend used.

**Scope sketch:**
- Resend inbound webhook
- Parse incoming email → match thread by message-id or threading header
- Append to `ask_threads` as a message from the sender
- Edge cases: HTML stripping, signature trimming, attachments

**Tradeoff:** Real work (a few days). Worth deciding *now* whether to build before launch or defer until first-cohort data shows it matters. Pre-launch we don't know if anyone replies by email; post-launch we'll know within 2 weeks.

---

## 5. Production hygiene

**Status:** Mixed. Some pieces are in (`Sentry`, `.github/workflows/ci.yml`); others are gaps.

**Why it matters:** Doesn't move the thesis but protects everything else. Quality compounds when you can ship without fear; degrades when every change risks regression.

**Scope sketch — three independent items:**
- **CI type-checking** — verify `pnpm tsc --noEmit` runs cleanly in CI. Easy way to confirm nothing has slipped between local checks and CI. ~30 minutes.
- **E2E coverage on the core loop** — one Playwright spec covering invite → signup → profile → search → ask → accept → conversation. ~half a day. Becomes the regression net for the next several months of refactors.
- **Real user walk-throughs** — 2 alumni × 20 minutes / week. Coworker was tagged for this in the May 6 conversation. Push if not started — outside eyes beat any internal audit.

**Tradeoff:** All three are independent and can be done à la carte.

---

## How to choose what's first

If the goal is *the product becomes categorically different from incumbents:* **#1 (AI-assisted composer)**.

If the goal is *the product is safe to put real users on:* **#5 (production hygiene)** before everything, then #2 (onboarding audit), then #3 (emails).

If the goal is *we want to know if the thesis is right:* **#5's user walk-throughs** unblock everything else. Two alumni × two sessions tells you whether to invest in #1, #3, or #4.

Default recommendation: **#1 first, with #5's user walk-throughs running in parallel.** Composer ships in two weeks while you collect walk-through signal that informs #2/#3/#4 priority.

---

## When to revisit this doc

- After #1 ships: re-rank #2/#3/#4 based on user-walk-through signal
- After 6 weeks regardless: thesis-critical items can drift
- After any major external event (a competitor ships an AI feature, a school commits to pilot, etc.)

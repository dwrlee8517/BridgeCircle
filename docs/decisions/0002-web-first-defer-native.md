# 0002 — Web-first; defer native mobile until repeat-engagement signals

- **Status:** accepted — partially superseded by [0016](0016-native-mobile-via-expo.md)
- **Date:** 2026-04-21
- **Decider:** Richard

> **Amended 2026-08-08.** [ADR 0016](0016-native-mobile-via-expo.md) reverses the "no
> React Native, no Expo" clause below: an Expo shell now lives at `mobile/`. The rest of
> this ADR still holds — the web app remains the product, notifications are still
> email-only, and native *feature* work is still gated on the repeat-engagement signals
> described here. 0016 authorizes the scaffold and its build pipeline, not parity.

## Context

Alumni networks span desktop (admins, professionals at work) and mobile (casual browsing). Building both web and native mobile for a single-engineer Phase 1 doubles the work past breaking.

We don't yet know if BridgeCircle gets repeat engagement (the open question that kills most alumni products — see `docs/product/market-analysis.md`).

## Decision

Phase 1 is **web-first only**. Responsive layouts (mobile browsers welcome). No React Native, no Expo, no Flutter, no PWA install prompts at launch.

Native mobile is gated on repeat-engagement signals — typically 30%+ of active mentees returning ≥2x/week and friction logs that point at mobile use cases (e.g. "I wanted to reply to a mentor request from my phone"). Phase sequencing lives in [`../product/feature-roadmap.md`](../product/feature-roadmap.md).

## Consequences

- **+** Single codebase, single deploy pipeline (Railway).
- **+** Notifications are email-only at launch (Resend). No push infra to build.
- **+** Don't pay the React Native ecosystem tax (build tools, native modules, app store reviews) before knowing if it's needed.
- **−** Mobile UX is a browser, not an app. Slightly worse for casual scrollable browsing.
- **−** No deep links from emails into a native app; all email links open the web app.

## Alternatives considered

- **PWA from day 1** — adds install-prompt and offline-shell engineering for unclear payoff. Defer.
- **React Native parallel build** — 2x engineering, not justified pre-product-market-fit.
- **Expo** — same; even with Expo's ergonomics, the auth/email/RLS code paths still bifurcate.

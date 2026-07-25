# Phase 1 Launch Readiness Checklist

Readiness criteria before the product is opened to real members. There is no
fixed launch date — the gate is quality, not the calendar.

> **Updated 2026-07-25** to match the shipped v2 product (the original list
> described the legacy mentorship loop; code wins). The full pre-pilot plan —
> including legal, marketing, tutorials, Chadwick, cost, and measurement
> workstreams — lives in
> [`docs/product/pilot-launch-plan.md`](../../../docs/product/pilot-launch-plan.md);
> this file remains the short product-readiness gate.

- [ ] production v2 cutover executed and verified (`/api/health` reports the promoted SHA)
- [ ] 20–50 real alumni profiles seeded through personal outreach
- [ ] 10+ members opted in as helpers with helper topics set
- [ ] core loop verified end-to-end on production: invite → signup → onboarding → ask → offer → accept → conversation
- [ ] Resend production domain verified (SPF/DKIM), test invites land in real inboxes
- [ ] Sentry receiving production errors in an isolatable prod stream
- [ ] pilot funnel instrumentation live (`track()` persists in production)
- [ ] privacy policy and terms of service published and linked from signup
- [ ] at least one real test event with RSVPs
- [ ] admin can invite (CSV), approve from the queue, and handle a report without touching SQL

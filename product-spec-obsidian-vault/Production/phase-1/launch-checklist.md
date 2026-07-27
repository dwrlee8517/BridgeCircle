# Phase 1 Launch Readiness Checklist

Readiness criteria from [`launch-cut.md`](launch-cut.md). All must be true before the product is opened to real members. There is no fixed launch date — the gate is quality, not the calendar.

- [ ] 20–50 real alumni profiles seeded
- [ ] 10+ members marked Open to help
- [ ] core loop verified end-to-end: invite → signup → profile → People search → Ask → accept → Messages thread
- [ ] Resend production domain verified (SPF/DKIM)
- [ ] Sentry instrumentation on API routes
- [ ] at least one real test event
- [ ] admin can approve members from the queue without touching SQL
- [ ] real pilot organization bootstrapped in production via `app/scripts/bootstrap-production.ts`, and a decision made on retiring the pre-pilot `test-org` (production currently runs `Test Org` / `test-org` by design — see the [production cutover record](../../../docs/architecture/database-v2-production-cutover-plan.md#execution-record))

# Phase 1 Post-Launch Backlog

Not blockers for launch. Revisit after the product is opened to real members.

## Cost monitoring on Anthropic API

Current NL search queries hit Haiku up to twice; resume import hits it once.
No observability today. Consider Sentry breadcrumbs or a counter row.

ADR 0009's hybrid Ask matching target will add more retrieval stages and may
add embedding generation/backfill plus vector search. Instrument latency and
cost by stage before shipping that as the default Ask results path.

## Persistent `dev` branch on prod project

Replace `bridgecircle-dev` (separate project, now under the same Pro org as prod — see [ADR 0005](../../decisions/0005-hybrid-supabase-branching.md)) with a persistent dev branch on the prod project (~$10/mo). Would unify the dashboard, enable cheap dev resets, and remove the manual `pnpm dlx supabase db push` step from daily dev. Skipped at the 2026-04-29 cutover because the cost-vs-marginal-improvement math didn't justify it pre-launch; revisit now that the "Free tier covers dev" argument no longer applies.

## Announcement expiry (`expires_at`)

The home banner currently hides announcements older than 14 days, but
content-level deadlines ("register by May 30") can pass while the
announcement is still fresh by age. Add an optional `expires_at` column to
`announcements` (forward-only migration) and have admins set it when an
announcement has a deadline; the banner and pinned School row should hide
expired items.

## Richer LLM rationales on home suggestion cards

The "Why they might fit" line on home falls back to a static template
(`buildHomeRationale`) when no LLM rationale exists. Worth generating short
per-viewer rationales (Haiku, cached) so the home grid reads as observed
context rather than templated copy. Mind the cost-monitoring item above.

## Notification mark-read on row click

/notifications rows navigate but don't mark as read; only the bell popover
acknowledges. Reuse the popover's mark-read action on row click so the page
isn't a read-only mirror.

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

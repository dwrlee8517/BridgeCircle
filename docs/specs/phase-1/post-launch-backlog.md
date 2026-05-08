# Phase 1 Post-Launch Backlog

Not blockers for launch. Revisit after the product is opened to real members.

## Cost monitoring on Anthropic API

Every NL search query hits Haiku twice; resume import hits it once. No observability today. Consider Sentry breadcrumbs or a counter row.

## Persistent `dev` branch on prod project

Replace `bridgecircle-dev` (separate Free project) with a persistent dev branch on the prod Pro project (~$10/mo). Would unify the dashboard, enable cheap dev resets, and remove the manual `pnpm dlx supabase db push` step from daily dev. Skipped at the 2026-04-29 cutover because the cost-vs-marginal-improvement math didn't justify it pre-launch.

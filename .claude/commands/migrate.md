---
description: Apply a new Supabase migration to dev, regenerate types, and stage them. Never touches prod.
---

The BridgeCircle migration workflow (per `docs/runbooks/migration-workflow.md`):

1. Confirm there's a new or edited `.sql` file in `app/supabase/migrations/`. If not, ask the user which migration they want to apply or stop.
2. Run `cd app && pnpm dlx supabase db push` (this applies to `bridgecircle-dev` only — the local dev project).
3. If the push succeeds: `cd app && pnpm db:types` to regenerate `app/src/db/database.types.ts`.
4. `git status` to confirm what changed.
5. `git diff app/src/db/database.types.ts | head -50` to surface the type changes for the user to eyeball.
6. Suggest staging: `git add app/supabase/migrations/<file>.sql app/src/db/database.types.ts`.

**Hard rules:**
- Never run `supabase link --project-ref bridgecircle` (that's prod). The settings.json deny rule blocks it; if you hit a denial, STOP and tell the user.
- Never run `db push --linked` — that's the prod path, and it's blocked.
- Prod migrations are auto-applied by the Supabase + GitHub branching integration when the PR merges. The user does not push to prod manually.

If `db push` fails:
- Read the error
- Check the SQL syntax against the existing migration files for patterns
- Suggest a fix; do not retry the push silently

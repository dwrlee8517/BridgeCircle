# Migration Workflow

How to author and ship a Supabase migration in BridgeCircle. Effective post-2026-04-29.

## Setup

We use a **hybrid branching setup**: `bridgecircle-dev` is still a separate Free project for daily local development, but the prod project (`bridgecircle`) has the Supabase + GitHub branching integration enabled. See [`../architecture/branching-strategy.html`](../architecture/branching-strategy.html) for the full rationale.

## Per-migration workflow

```
1. edit / add SQL file in app/supabase/migrations/
2. pnpm dlx supabase db push                       (applies to bridgecircle-dev)
3. pnpm db:types                                   (regenerate database.types.ts)
4. test locally
5. git push branch + open PR
6. → Supabase auto-creates a preview branch off prod and runs migrations
   → "Supabase Preview" status check on the PR turns green
7. merge PR → Supabase auto-applies migrations to bridgecircle (prod)
8. preview branch auto-deletes
```

## Hard rules

- **Do not push to prod manually.** The integration owns the prod side; manual pushes risk drift. (Step 7 replaced the old manual `supabase link --project-ref <prod>` + `db push --dry-run` + `db push` + re-link dance.)
- **Branch protection on `main` requires the Supabase Preview check to pass before merging.** Don't merge a PR with a failing migration check.
- **No destructive rollback in this setup.** If a migration ever needs to be rolled back: write a forward-only "revert" migration. Preview branches *can* be deleted destructively — they're throwaway by design — but prod's history is append-only.
- **Always run step 2 before opening the PR.** The local dev project (`bridgecircle-dev`) and prod stay in sync only because of this. If you skip step 2, dev will be behind main; harmless until you try to test a future feature locally that depends on the missed migration.

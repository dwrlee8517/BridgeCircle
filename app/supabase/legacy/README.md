# Legacy pre-v2 database archive

This directory preserves the application schema that ADR 0015 superseded.
It is reference material only and is intentionally outside
`supabase/migrations/`, so `supabase db reset` does not replay it.

- Final commit with the legacy migrations active: `8926758`
- Archived on: 2026-07-13
- Archived migrations: 27 files under `migrations/`
- Archived deterministic seed: `seeds/seed.sql`
- Schema-only local dump: `legacy-schema.sql`

The dump was produced from the running local Supabase database with:

```sh
supabase db dump --local --schema public --keep-comments
```

It contains no member data or secret values. Do not apply these migrations or
the seed to a v2 database. Remote migration-history repair and any remote
reset require the separate cutover approval described in ADR 0015.

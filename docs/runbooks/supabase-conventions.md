# Supabase Conventions

Reference for working with Supabase in the BridgeCircle app. Read before touching `app/src/db/`, migrations, or auth code.

## Keys and environment

- Use the new `sb_publishable_*` and `sb_secret_*` key formats. Do not use the deprecated `anon` / `service_role` JWT names in code or env var names.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are safe in the client.
- `SUPABASE_SECRET_KEY` is server-only — never import it from a client component or `'use client'` file.

## Clients (`src/db/`)

All three clients are typed `<Database>` against `src/db/database.types.ts`.

| Client | Use from |
|---|---|
| `src/db/client.ts` | client / browser code |
| `src/db/server.ts` | server components, route handlers |
| `src/db/admin.ts` | privileged server-side operations only (invite verification, admin actions) |

## Type generation

After applying any migration, run `pnpm db:types` and commit the regenerated `src/db/database.types.ts`. Otherwise the next build fails on missing tables/columns.

## Auth → users wiring

`auth.users → public.users` is wired by the `on_auth_user_created` trigger in `0001_init`. Code that creates users via `supabase.auth.admin.createUser` does **not** need to insert into `public.users` separately, but it does need to insert `base_profiles` / `organization_memberships` / `organization_profiles` rows itself (those are not triggered).

## Role grants

Tables created via `supabase db push` do **not** auto-receive role grants the way the dashboard does. The `alter default privileges` block in `grant_public_schema.sql` covers future tables in `public` — but if you add a table in a custom schema or run `db reset` in unusual contexts, the same `42501 permission denied` error will resurface. See [`../architecture/environments.md`](../architecture/environments.md).

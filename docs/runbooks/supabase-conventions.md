# Supabase Conventions

Reference for working with Supabase in the BridgeCircle app. Read before touching `app/src/db/`, migrations, or auth code.

## Keys and environment

- Use the new `sb_publishable_*` and `sb_secret_*` key formats. Do not use the deprecated `anon` / `service_role` JWT names in code or env var names.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are safe in the client.
- `SUPABASE_SECRET_KEY` is server-only — never import it from a client component or `'use client'` file.

## Clients (`src/db/`)

All three clients are typed `<Database>` against `src/db/database.types.ts`.
The generated type file includes both exposed application schemas: `public`
and `api`. The `private` schema is intentionally not part of the client
contract.

| Client | Use from |
|---|---|
| `src/db/client.ts` | client / browser code |
| `src/db/server.ts` | server components, route handlers |
| `src/db/admin.ts` | privileged server-side operations only (invite verification, admin actions) |

## Type generation

During the database-v2 backend port, generate from the local rebuilt database:

```bash
pnpm db:types:local
```

After the shared development cutover, run `pnpm db:types` against the linked
development project and compare it with the locally generated file. Commit
`src/db/database.types.ts` with every schema change. A difference between
local and linked output is drift to resolve, not a file to hand-edit.

## Schema boundary

| Schema | Rule |
|---|---|
| `public` | RLS-protected tables; client access exists only where an exact grant and policy both allow it |
| `api` | exposed views and transactional RPC wrappers; preferred for sensitive Help and lifecycle operations |
| `private` | privileged implementations, matching, moderation, outbox, audit, and enrichment internals; never expose through the Data API |

Security-definer implementations belong in `private`, use
`set search_path = ''`, fully qualify every object, and receive only narrow
EXECUTE grants. Exposed `api` wrappers must have fixed signatures and perform
input validation before delegating. Never move a helper into `public` merely
so an RLS policy can call it; policies can invoke an unexposed private helper.

## Auth → users wiring

`auth.users → public.users` is wired by `on_auth_user_created` in the active v2
baseline. Code that creates users via `supabase.auth.admin.createUser` does
**not** insert into `public.users` separately, but it still creates the
membership and profile records required by the flow.

`public.users.id` deliberately is not a foreign key to `auth.users.id`.
Account deletion retains that UUID as a non-PII “Deleted member” tombstone so
accepted conversation and safety history remains coherent. The Auth-delete
trigger calls the same idempotent private pseudonymization routine as the app.
Do not add a blanket Auth cascade.

## Role grants

Tables created via `supabase db push` do **not** auto-receive role grants the
way dashboard-created objects may. Database v2 revokes broad defaults and
grants each table, sequence, view, and function deliberately. Adding an RLS
policy without the matching role grant still yields `42501`; adding a grant
without the matching RLS policy still yields no rows or a policy error. Review
both halves for every exposed object.

Raw Help identity tables (`asks`, `ask_offers`, private matching data) are not
general client read surfaces. Use the approved `api` projections and commands
so anonymous author identity and block filtering remain database-enforced.
All Help route code lives under `/help/*`; deleting the earlier route modules
was part of the pre-launch v2 cutover, so do not add compatibility repositories
or raw-table fallbacks for them.

Raw `conversations`, `messages`, and `conversation_reads` are also not member
read surfaces. Use the fixed `api` detail, before/after keyset, send, read, and
typing functions through `src/db/repositories/conversations.ts`. Keep behavior
and result unions framework-free under `src/lib/conversations/`; do not call
Supabase from that domain layer.

## Conversation Realtime

Conversation state uses private database Broadcast, not message Postgres
Changes. Open both authenticated topics only after `setAuth()`:

- `conversation:<conversation_uuid>` carries block-aware ID-only message,
  read, and typing hints;
- `user:<viewer_user_uuid>` is owner-only and carries permission-change or
  revocation hints that must survive loss of conversation-topic access.

Treat every event as a refetch hint. Fetch durable content through the bounded
after-cursor API on subscribe, reconnect, gaps, and `message.created`;
deduplicate by event/message ID and remove both channels on cleanup. Never add
message bodies, Ask text, client nonces, profile fields, or block initiators to
Broadcast payloads. `notifications` remains on RLS-filtered Postgres Changes.

## Storage and account deletion

Storage object bytes are removed through the Supabase Storage API, not by
deleting rows from `storage.objects` in SQL. Account pseudonymization queues a
durable private `delete_storage_objects` outbox job; a privileged worker must
delete the objects and retry failures idempotently. Storage policies remain
required for ordinary avatar and resume access.

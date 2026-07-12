# Seeding The Dev Database

## Purpose

`app/scripts/seed-dev.ts` populates the `bridgecircle-dev` Supabase project with a small, hand-curated set of fake users, profiles, mentors, mentorship requests, events, and RSVPs. It exists so that any time you sit down to develop, you can get a believable, reproducible dataset in front of you without touching production data.

The complement to `docs/environments.md`: that doc explains *why* dev and prod data are separate; this doc explains *how* you populate dev with realistic-looking content.

## When To Use It

- After running `supabase db reset` to rebuild dev from scratch.
- After applying a new migration that changes the data model — re-seed so the existing data matches the new schema.
- When onboarding a new contributor — they run it once and have a full working environment.
- When you want to test a specific feature against a known starting state and don't want to waste 20 minutes manually clicking around to set up the state you need.

## When NOT To Use It

- **Against production.** The script has multiple guards but they are not infallible. Ultimate safety is your own attention.
- **When real test users you care about exist in dev.** The script wipes the relevant tables before inserting. If you have important manual test state, dump it first or skip the seed.

## Prerequisites

The script targets the schema defined in `0001_init.sql` (see `docs/data-model.md`). It will not run successfully until that migration has been applied to `bridgecircle-dev`. Specifically, it writes to:

- `organizations`
- `users` (the auth-created public user row, to mark seeded users as onboarding-complete)
- `organization_memberships`
- `base_profiles` (identity card — name, employer, city, university, …)
- `organization_profiles` (org-context overlay — graduation year, bio, mentoring topics, open-to-mentor)
- `mentorship_preferences` (keyed on `organization_membership_id`, not `user_id`)
- `mentorship_requests`
- `mentorship_threads`
- `events`
- `event_rsvps`
- `admin_role_assignments`

It also relies on the `on_auth_user_created` trigger from `0001_init.sql`: when the script calls `auth.admin.createUser`, the trigger inserts the matching `public.users` row. The script then marks that row as onboarding-complete and layers `base_profiles` / `organization_memberships` / `organization_profiles` on top.

If you run the script before the migration is applied, it fails with PostgreSQL's `relation "<name>" does not exist` error. That is the expected outcome — the script is an artifact you build toward, not a workaround for the missing schema.

The other prerequisites are environment-side:

- `app/.env.local` must point at `bridgecircle-dev` (not production).
- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY` must be set.
- The Supabase project must be reachable from your machine.

## Running The Script

From the `app/` directory:

```bash
SEED_CONFIRM=YES pnpm dlx tsx --env-file=.env.local scripts/seed-dev.ts
```

Breakdown of that command:

- `SEED_CONFIRM=YES` — explicit acknowledgement that you intend to wipe and reseed. Without this, the script refuses to run.
- `pnpm dlx tsx` — runs the TypeScript file directly without needing a separate compile step. `tsx` is fetched on demand by `dlx`; no permanent dependency added unless you choose to install it.
- `--env-file=.env.local` — loads your dev env vars into the process so the script can read `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY`.
- `scripts/seed-dev.ts` — the script itself.

Optional add-ons:

```bash
PROD_PROJECT_REF=<your-prod-project-ref> SEED_CONFIRM=YES \
  pnpm dlx tsx --env-file=.env.local scripts/seed-dev.ts
```

Setting `PROD_PROJECT_REF` to your production project ref (the random string in `https://<ref>.supabase.co`) gives the script an extra safety check: if `NEXT_PUBLIC_SUPABASE_URL` matches that ref, the script refuses to run. Belt-and-braces — useful if you have both projects' keys floating around.

## Safety Guards

Before doing anything destructive the script:

1. Refuses to run unless `SEED_CONFIRM=YES`.
2. Refuses to run when `NODE_ENV=production`.
3. Refuses to run if `PROD_PROJECT_REF` is set and `NEXT_PUBLIC_SUPABASE_URL` matches it.
4. Prints the target Supabase URL and pauses for 3 seconds. **Read the URL.** If it's wrong, hit Ctrl+C.

These checks compose: each one is a different kind of mistake (forgot to confirm, wrong shell env, wrong env file). Together they make running this against production take deliberate effort, not an accident.

The remaining vulnerability is human — if `.env.local` itself contains production keys, all the script-level guards check out and the script proceeds. The mitigation lives in `docs/environments.md` (audit env files; never paste prod keys into `.env.local`).

## What It Creates

A single fake organization (`Chadwick School (DEV)`) plus nine personas tuned to exercise different code paths:

| Persona | Role | Notable for testing |
|---|---|---|
| Amy Admin | super_admin | admin permissions, role-gated routes |
| Mark Mentor | open mentor | the typical mentorship-request flow |
| Mei Mentor | open mentor | second mentor with different topics, used in accepted-request scenario |
| Felix Atcapacity | open mentor, max_pending=1, max_active=1 | the "mentor at capacity" UI |
| Paula Paused | closed-to-mentor | the "paused while away" UI |
| Sam Student | member, current senior | mentee originating a pending request |
| Ria Recent | member, recent grad | mentee with an accepted request and an event RSVP |
| Rohan Recent | member, recent grad | mentee with a declined request and an event RSVP |
| Iris Incomplete | member, blank profile | profile-completion prompt rendering |

Plus three mentorship requests (one in each of pending, accepted, declined states), two events (one in Palos Verdes, one in Songdo to exercise multi-region UX), and two RSVPs on the first event.

All seeded personas are marked as onboarding-complete so signing in lands in the member/admin app instead of the onboarding flow. Iris still keeps intentionally sparse profile fields; use her for profile-completion prompts, not first-run onboarding-step testing.

All passwords are `devseed-password-N` where N is the persona's index in the script, so you can sign in as anyone from `localhost:3001`.

The personas are deliberately recognizable — names like "Felix Atcapacity" and "Iris Incomplete" hint at the scenario they cover. This is more useful than randomly generated names because it lets you remember "ah, that's the at-capacity mentor I'm trying to test" without consulting a key.

## How To Reset And Re-Seed

The script is idempotent by way of "wipe first, then create." Re-running it gives you the exact same starting state every time. So:

```bash
SEED_CONFIRM=YES pnpm dlx tsx --env-file=.env.local scripts/seed-dev.ts
```

That's the reset. No separate "reset" command needed.

If you want a deeper reset that also re-applies migrations (useful when testing migration ordering):

```bash
pnpm dlx supabase db reset                                      # drops + re-applies all migrations
SEED_CONFIRM=YES pnpm dlx tsx --env-file=.env.local scripts/seed-dev.ts  # re-seed
```

`supabase db reset` only works against a project linked via `supabase link`. Make sure your link points at `bridgecircle-dev`, not production.

## Extending The Script

The script is plain TypeScript; extending it is just editing the file. Common extensions:

### Add a new persona

Add an entry to the `PERSONAS` array. The shape is documented at the top of the array. Auth IDs are assigned by Supabase at `createUser` time — the script holds them in a per-run map and writes them through to the `base_profiles` / `organization_memberships` / etc. inserts.

### Add a new mentorship scenario

Edit `createMentorshipScenarios()`. Look up the relevant personas by email (the `idByEmail` map is the bridge between curated personas and the auth IDs Supabase actually assigns) and insert a new row.

### Add data for a new feature

Add a new step function (`async function createWhatever()`), call it from `main()`. The wipe step does not need editing as long as your new rows are scoped to either the seeded auth users or the seeded `organizations` row — both cascade on delete and clean up automatically. If you add data tied to neither (a global lookup table, say), wipe it explicitly in `wipe()`.

### Add randomness without losing reproducibility

Use a seeded PRNG (e.g. `seedrandom`) with a hard-coded seed. The output is "random-looking" but identical across runs. Avoid `Math.random()` and `Date.now()` in seed values — they make every run different and break the reproducibility benefit.

## Limitations And Things To Watch

### It bypasses RLS

The script uses the secret key, so row-level security policies are not exercised by the seeding itself. If your RLS policies are wrong, this script won't tell you — you'd find out by signing in as a test user and clicking around. That's a feature for seeding (you want full-write access) but a reminder that "the seed script worked" is not the same as "RLS is correct."

### It does not seed `auth.users` directly

Supabase's `auth.users` table is internal and managed by the Auth service. The script uses `admin.auth.admin.createUser()` which is the supported API. This is also why `wipe()` calls `auth.admin.deleteUser()` rather than truncating `auth.users`.

### It assumes a single organization

`bridgecircle-dev` is currently single-org. When Chadwick International joins as a second org, extend `ORG` to an array of orgs and give each persona memberships in both. The script already creates a `base_profile` per user and an `organization_profile` per membership, so multi-org just means looping membership creation across the array — the schema split does the rest.

### It does not seed Resend, Sentry, or Stripe state

Those services are external and have their own data. If a flow you're testing depends on email delivery or error capture, those happen at runtime when your code calls them — the seed script doesn't pre-populate them.

### Costs and email side effects

The personas use `@example.com` addresses (a reserved domain that does not deliver email). If your app code sends a welcome email when a profile is created, those emails go nowhere and Resend silently accepts them — perfect for dev. **Do not** swap in real-looking domains here unless you're prepared for the script to actually mail those addresses.

### Top-level `await` does not work in `pnpm dlx tsx`

`tsx` resolves `.ts` files as CommonJS unless the surrounding `package.json` has `"type": "module"`. CJS doesn't allow top-level `await`, so anything you want to `await` outside a function must live inside `main()` (or another `async` function). The countdown-before-wipe is one such case — it runs from inside `main()` for this reason. If you add a new step that needs to `await` something during script init, wrap it in an async function rather than putting it at file scope.

## Quick Reference

### Commands

| Task | Command |
|---|---|
| Seed (or re-seed) the dev database | `SEED_CONFIRM=YES pnpm dlx tsx --env-file=.env.local scripts/seed-dev.ts` |
| Reset schema then re-seed | `pnpm dlx supabase db reset && SEED_CONFIRM=YES pnpm dlx tsx --env-file=.env.local scripts/seed-dev.ts` |

### Test accounts

All passwords follow `devseed-password-N` where N matches the persona's order in [scripts/seed-dev.ts](../app/scripts/seed-dev.ts).

| # | Name | Email | Password | What they cover |
| --- | --- | --- | --- | --- |
| 1 | Amy Admin | `admin-amy@example.com` | `devseed-password-1` | super_admin role; admin permissions, role-gated routes |
| 2 | Mark Mentor | `mentor-mark@example.com` | `devseed-password-2` | open mentor; the typical mentorship-request flow |
| 3 | Mei Mentor | `mentor-mei@example.com` | `devseed-password-3` | open mentor; second mentor for accepted-request scenario |
| 4 | Felix Atcapacity | `mentor-fully-booked@example.com` | `devseed-password-4` | open mentor with `max_pending=1, max_active=1` — capacity-full UI |
| 5 | Paula Paused | `mentor-paused@example.com` | `devseed-password-5` | open mentor with `paused_at` set — paused-while-away UI |
| 6 | Sam Student | `student-sam@example.com` | `devseed-password-6` | mentee originating a pending request |
| 7 | Ria Recent | `recent-grad-ria@example.com` | `devseed-password-7` | mentee with an accepted request and an event RSVP |
| 8 | Rohan Recent | `recent-grad-rohan@example.com` | `devseed-password-8` | mentee with a declined request and an event RSVP |
| 9 | Iris Incomplete | `incomplete-iris@example.com` | `devseed-password-9` | blank profile fields — profile-completion prompt rendering |

## When This Doc Gets Outdated

Update this file whenever you:

- Add or remove personas in the script.
- Add a new step that writes to a table not already covered by the cascade-driven wipe.
- Change the run command (e.g. install `tsx` as a dev dependency to drop the `dlx`).
- Change safety guards.

Out-of-date seed docs lead to "I followed the doc and got an error" — the worst kind of onboarding experience. If reality drifts from this file, fix the file.

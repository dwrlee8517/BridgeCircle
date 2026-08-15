# Resetting the hosted dev database

A routine, guarded rebuild of the **dev** database (`bridgecircle-dev`):
replay every checked-in migration, load the starter cast, then reseed the demo
school. Run it monthly, before recording seasons, or whenever dev's data has
drifted from what the code expects. Production has no equivalent — its reset
was a one-time cutover event with its own script and stricter authorization.

## What it destroys

Everything. All dev auth users (operators re-sign-in afterwards — Google OAuth
recreates their accounts), all app rows, all sessions, all storage objects
(buckets are migration-created and come back; manually uploaded files do not).
Anyone signed into dev is logged out mid-request.

**Announce the window before executing.** Dev is shared: a reset racing a
deploy or an armed demo window is the only real hazard here. The demo door
must not be armed during the reset.

## The procedure

From `app/`, on a clean `main` checkout at the SHA you intend to reset with:

```bash
CUTOVER_SHA=$(git rev-parse HEAD) pnpm reset:dev --mode=plan
```

Plan mode is read-only: it prints the doomed-row counts ("what you are about
to destroy"), the local-vs-remote migration diff, and the exact confirmation
string execute mode will demand. Review it, then:

```bash
DEV_RESET_EXECUTE=1 \
DEV_RESET_CONFIRM="RESET <dev-project-ref> AT <sha>" \
CUTOVER_SHA=<sha> pnpm reset:dev --mode=execute
```

The script refuses anything that is not exactly the dev project (the guard
stack validates `APP_ENV`, both Supabase URLs, and the exact git state —
production identifiers are structurally impossible), and the confirmation
string must match character-for-character, SHA included.

Afterwards, follow the checklist the script prints:

1. Reseed the demo school, with scenes for the next recording session:
   `DEMO_ALLOW_REMOTE=1 SUPABASE_DB_URL=<dev pooler url> DEMO_SCENE=help-inbox,thread,ask-journey pnpm seed:demo-org`
2. Re-sign-in operator accounts; confirm Doppler `DEMO_USER_EMAIL` still
   matches the seeded persona.
3. Arm the demo door from `/demo/arm` and walk the app as the persona
   ([demo-door runbook](demo-door.md)).
4. Baseline-sweep e2e residue: `E2E_SWEEP_ALLOW_DEV=1 pnpm sweep:e2e`.
5. Log the reset in the memory vault `_log/`.

## Relationship to the old rule

[seed-dev.md](seed-dev.md) long said the deleted admin-API remote seed script
"must not be restored" — that ban was about fixture scripts encoding retired
schema as a compatibility layer, and it stands. `reset:dev` is the opposite
mechanism: the same guarded CLI reset the one-time dev cutover used (replay
checked-in migrations, load the canonical SQL seed), now operationalized as a
routine with the same authorization shape as the production reset script.

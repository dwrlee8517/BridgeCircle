# Mobile e2e (Maestro)

The mobile counterpart of `app/tests/e2e/` (Playwright). Flows live in
`flows/` and run in filename order; `sign-in.yaml` establishes the session
the later flows reuse.

## Feature tags

Every flow declares the parity features it covers as comment tags at the top:

```yaml
# feature:auth.sign-in
```

`parity/check-parity.mjs` scans these against `parity/features.json` — a
feature declared for `mobile` with no tagged flow is a parity gap. A flow
tagged `# layout:expanded` claims tablet (navigation-rail) coverage and must
run on an iPad-class device.

## Running locally

Hermetic, like the web suite — flows run against the LOCAL Supabase stack
and its seeded personas (`app/supabase/seeds/seed.sql`):

1. Install Maestro: `curl -Ls https://get.maestro.mobile.dev | bash`
2. Start the local stack: from `app/`, `pnpm db:start`
3. Build + install a dev build pointed at the local stack (simulators reach
   the host on localhost; Android emulators use 10.0.2.2):
   `EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321 EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon key from 'supabase status'> pnpm expo run:ios`
4. Run the suite:

```bash
MAESTRO_EMAIL=richard@example.com MAESTRO_PASSWORD=devseed-password-richard pnpm test:e2e
```

CI runs the same flows on an Android emulator against the same local stack —
see `.github/workflows/mobile-e2e.yml`.

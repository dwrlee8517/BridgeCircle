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

1. Install Maestro: `curl -Ls https://get.maestro.mobile.dev | bash`
2. Build + install a dev build on a simulator/emulator:
   `doppler run -p bridgecircle -c dev_personal -- pnpm expo run:ios` (or `run:android`)
3. Run the suite against the seeded dev database (`docs/runbooks/seed-dev.md`):

```bash
MAESTRO_EMAIL=mentor-mark@example.com MAESTRO_PASSWORD=devseed-password-2 pnpm test:e2e
```

CI runs the same flows on an Android emulator — see
`.github/workflows/mobile-e2e.yml`.

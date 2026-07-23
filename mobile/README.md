# BridgeCircle mobile

Expo iOS/Android app for BridgeCircle — the native counterpart of the
Next.js app in `../app/`, held to feature parity by the ratchet in
`../parity/` (see [`../parity/README.md`](../parity/README.md)).

```bash
pnpm install
doppler run -p bridgecircle -c dev_personal -- pnpm ios      # iOS simulator
doppler run -p bridgecircle -c dev_personal -- pnpm android  # Android emulator
```

Full guide: [`../docs/runbooks/mobile-dev.md`](../docs/runbooks/mobile-dev.md).
Agent rules: [`AGENTS.md`](AGENTS.md). e2e: [`e2e/README.md`](e2e/README.md).

Note: `assets/images/` still carries the Expo template icons — replace with
BridgeCircle brand assets before any store submission.

---
description: Run the full pre-PR sensor stack — biome, lint, typecheck, vitest — and report a punch list.
---

Run the full BridgeCircle pre-PR check from `app/`:

1. `cd app && pnpm biome check .`
2. `cd app && pnpm lint`
3. `cd app && pnpm tsc --noEmit`
4. `cd app && pnpm vitest run`
5. If any SQL changed in this branch, confirm `pnpm db:types` was run and `database.types.ts` is in the diff.
6. `git status` and `git diff --stat` to surface what's about to ship.

For each step, report **PASS / FAIL** and the relevant error excerpt if FAIL.

End with a punch list:
- ✅ what passed
- ❌ what's blocking the PR (with file:line)
- ⚠️ what's worth checking before merge

Do **not** run `git push` or `gh pr create` — that's the user's call.

If everything passes, suggest the next action: open the PR, or run `/migrate` if there's an unmigrated SQL change.

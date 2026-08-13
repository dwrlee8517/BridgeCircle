---
id: <initiative-slug>/<NN>-<task-slug>
initiative: "[[Initiatives/<initiative-slug>/plan|<Initiative Name>]]"
status: ready          # ready | in-progress | blocked | done
depends_on: []         # task numbers in this initiative, e.g. [01, 02]
pr:                    # PR link, filled in when opened
---

# <NN> — <Task title>

> One PR. One focused session. If this task cannot be described in the sections
> below without hand-waving, it is too big — split it in `plan.md` first.

## Cold start

*Assume the reader has never seen this initiative and will not read `plan.md`
beyond the Goal.* In a short paragraph: what this task is, what part of the
system it touches, and the one thing about the current code that makes it
non-obvious. Name the surprise if there is one.

## Scope

**In:**
- <the specific change>

**Out:**
- <the adjacent thing that looks like it belongs but does not — say why>

## Files

| Path | What changes |
|---|---|
| `app/src/lib/<module>/<file>.ts` | <the change> |

## Steps

1. <step> → <how you know it worked>
2. <step> → <how you know it worked>

## Verification

Exact commands, not a description of testing. The canonical per-task list lives
in `app/CLAUDE.md` → *Verification* — that wins if this drifts. From `app/`:

```bash
pnpm biome check . && pnpm lint && pnpm tsc --noEmit && pnpm vitest
```

- <specific assertion this task must satisfy — a test name, a query result, an
  observed behavior in the running app>
- If a **route handler** changed: `pnpm build` as well — `tsc --noEmit` alone
  does not check Next's route-handler types. Also confirm a Vitest covers the
  `/lib` function behind it.
- If **SQL** changed: run `pnpm db:types:local` twice and confirm
  `database.types.ts` is byte-identical, then lint and shadow-diff the local
  schema per `docs/runbooks/migration-workflow.md`.
- If the change is **observable in the app**: drive it end-to-end and say what
  you observed, rather than inferring it from green types.

## Done when

- [ ] <observable outcome, not "code written">
- [ ] <observable outcome>
- [ ] PR opened and CI green

## Handoff notes

*Filled in by the session that does this task, before marking it `done`. Empty
until then.*

- **What diverged from the plan:**
- **What the next task needs to know:**
- **Logged to `Backlog/`:**

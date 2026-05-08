---
description: Spec-driven workflow entry point — turn a feature idea into a spec → plan → impl → verify cycle.
---

Help the user move a feature from idea to shipped code using the spec-driven pattern.

## Context to load first

- `docs/specs/phase-1/launch-cut.md` — what's in scope for the launch cut
- `docs/specs/phase-1/spec.md` — full Phase 1 spec
- `app/CLAUDE.md` "Out Of Scope For Phase 1" — what to push back on
- `docs/decisions/` — locked decisions that constrain the design

## Workflow

For the feature the user describes:

### 1. Specify

Write a short spec (~½ page, max 1 page) covering:
- **Goal:** what the user can do after this ships
- **Surfaces touched:** which routes / screens / lib folders
- **Data model:** new tables / columns / RLS implications (if any)
- **Out of scope:** what we are deliberately NOT doing in this slice

If the feature is on the launch-cut path, prioritize it for launch readiness. If it's not, ask the user whether it belongs in the next slice or post-launch.

### 2. Plan

Write a numbered plan with verify steps:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Each step should be at most ~30 lines of code. If a step is bigger, split it. Use the BridgeCircle stack: `/lib` for business logic, route handlers for HTTP wiring, vitest for tests.

### 3. Confirm

Show the spec + plan to the user. Ask:
- Does the goal match what you wanted?
- Is the out-of-scope right?
- Is the slice small enough to ship in one PR?

Wait for the user's signoff before implementing.

### 4. Implement

Work the plan one step at a time. After each step:
- Mark it done in the plan
- Run the verify check (test, typecheck, manual smoke)
- Move to the next step only if verify passes

If a step's verify fails, STOP. Diagnose. Don't proceed to the next step.

### 5. Verify the whole

When all steps are done, run `/ship` to validate the full sensor stack before opening a PR.

## Behavioral guardrails

(See `CLAUDE.md` at repo root.) Surface assumptions before implementing. Push back on scope creep — but not on polish or correctness. There is no calendar deadline; the bar is competitive quality.

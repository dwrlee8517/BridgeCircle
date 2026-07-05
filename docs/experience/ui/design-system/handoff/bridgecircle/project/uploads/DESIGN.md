# bridgecircle — the brand fork (Layer 1)

**Status:** scaffolded · 2026-07-04 (ADR 0013 Phase E)
**Canonical home:** the `bridgecircle` Claude Design project (to be created);
this repo folder mirrors it via DesignSync.
**Baseline:** [`toss-base`](../../toss-base/project/uploads/DESIGN.md) —
faithful TDS. **Read the baseline spec for everything not overridden.**
**Divergence ledger:** [`OVERRIDES.md`](OVERRIDES.md) — the only place this
fork is allowed to differ from the baseline.

This fork is BridgeCircle's visual system. It began as a **byte-copy of
`toss-base`** and diverges one logged ledger entry at a time. The baseline
spec (principles, ramps, roles, type, contrast, component anatomy) is not
duplicated here — this document only frames what's different.

## The contract

1. **Default = Toss.** Any question this doc doesn't answer is answered by
   the `toss-base` spec.
2. **Divergence = ledger entry.** Overrides (changed values) and extensions
   (new ground: desktop, pending-status, avatar palette, brand marks) live in
   `OVERRIDES.md` with evidence and status. Unlogged divergence is drift.
3. **Applied vs proposed.** Only *applied* entries exist in the tokens and
   specimens. **2026-07-04 brand batch applied:** O1–O7 + E2 (green give
   action, section bands, Display XL, ochre warning, softer radii, hairline +
   card ring, avatar palette) — the fork now renders visibly differently from
   the baseline. Still proposed: E1 (pending hue), E3 (desktop), E4
   (CircleMark). Every entry stays adjustable or revertible via the ledger.
4. **Evidence over taste.** Entries cite the friction log
   ([`../Help Hub.html`](../Help%20Hub.html), the 2026-07-04 pristine-baseline
   test) and ADR 0013 Appendix C (the Field Pro reconciliation). New entries
   should arrive with the same kind of evidence.

## Working rhythm (ADR 0013 Phase E)

Reskin production surfaces in member-impact order. When a surface genuinely
needs a divergence, **promote** the relevant ledger entry from proposed →
applied (values + contrast re-measured), update the fork specimens, sync, then
translate to production (`app/src/app/globals.css` `@layer base, brand`; the
brand layer carries only applied entries).

## What lives here that isn't in the baseline

- `uploads/OVERRIDES.md` — the ledger.
- `Help Hub.html` — the baseline-test evidence (Ask/Give mock + friction
  log). Brand content; kept out of the pristine `toss-base` bundle by design.
- (as entries apply) brand-composed specimens diverging from the baseline's.

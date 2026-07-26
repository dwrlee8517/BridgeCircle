# Database v2 Home vertical-slice test inventory

> **Status (2026-07-16): implemented and locally verified.** This inventory is
> the acceptance contract and closeout record for the local Home slice. Remote
> environment evidence remains out of scope.

## Pre-Home checkpoint

- branch: `codex/redesign-v2`;
- commit: `7a01900 feat: build School vertical slice`;
- worktree: clean at planning start;
- local destructive reset: green at the School handoff;
- pgTAP: 14 files / 589 assertions green;
- Vitest: 62 files / 264 tests green;
- focused Foundation, Conversation, Help, Messages, People/Profile, and School
  TypeScript projects: green;
- combined People + Messages + School browser roads: 8 green after one clean
  reset;
- ESLint, Biome, database lint, shadow replay, and cutover ratchets: green;
- repository-wide production build: reaches application TypeScript and stops
  in the already-deferred legacy profile-embedding check, outside Home.

Counts are the starting baseline, not a completion forecast. Final counts must
be measured from the implementation checkpoint.

## Contract matrix

| Surface | Required evidence | Planned gate |
|---|---|---|
| outcome-share schema | bilateral rows, identity implication, revocation, participant ownership | pgTAP contract |
| outcome eligibility | resolved + note + both shares; names only after both identity choices | pgTAP + Vitest + browser |
| consent privacy | no raw grants, no other-participant choice leak, account cleanup | pgTAP privilege/deletion |
| Home-native projection | active membership, selected org, fixed bounded JSON | pgTAP + repository parser |
| blocking | viewer sees no recognition or outcome involving either blocked participant | pgTAP multi-persona matrix |
| recognition | recent unambiguous role only, visibility-aware, deterministic | pgTAP + pure composition tests |
| weekly pulse | correct current-week counts, no join double count, grammatical copy | pgTAP + Vitest |
| domain composition | bounded existing owner projections start in parallel | Vitest dependency harness |
| partial failure | one failed domain leaves successful sections and a local retry | component/browser road |
| ask handoff | question arrives in Help, focuses/searches, and is removed from URL | Vitest + browser road |
| Waiting parity | same projection/fold state as Messages; direct Ask routes to Help | Vitest + combined browser road |
| Connection decisions | accept, quiet decline, retry, stale/already-decided convergence | existing race tests + browser |
| open Asks | truthful count/status/offers/three-day warning and canonical links | Vitest + browser |
| School rail | two bounded events + pinned announcement, correct routes/states | Vitest + browser |
| deck | six-item cap, deterministic priority, manual controls, safe auto-advance | Vitest + browser clock |
| cold start | based on durable relationship activity, no checklist or pressure | Vitest + browser |
| all-clear/paused | no fabricated urgency; helper item suppressed while paused | Vitest + browser |
| responsive | accepted desktop plus 1440/1024/768/390/320 with no overflow | Playwright + visual inspection |
| accessibility | axe, keyboard, disclosure semantics, focus, reduced motion | Playwright + manual keyboard |
| fidelity | accepted template states vs latest app screenshots | `view_image` ledger |
| prior slices | complete regression stack stays green | pgTAP/Vitest/TS/lint/browser |
| destructive cutover | placeholder Home copy and mock runtime absent | static ratchet + `rg` gate |

## Database acceptance cases

### Membership and tenant boundary

Prove that:

- an active selected membership receives only its organization’s pulse and
  candidates;
- the same user’s second membership cannot bleed into the selected Home;
- pending, revoked, wrong-organization, anonymous, and deleted viewers receive
  `not_available` without existence detail;
- a supplied membership ID belonging to another user is rejected;
- all returned member identities are active and profile-visible to the viewer.

### Outcome sharing

Prove that:

- an unrelated user cannot create, read, update, or infer a share row;
- a participant cannot save consent before resolution or without an outcome
  note;
- a direct Ask resolves to exactly its asker and recipient;
- a circle Ask resolves to exactly its asker and accepted-offer helper;
- `share_identity = true` with `share_story = false` is rejected or normalized
  to false by one documented invariant;
- one side sharing never creates a Home story;
- both sides sharing creates one story with identities hidden;
- only both identity choices reveal both names;
- either side revoking removes the story immediately;
- duplicate saves are idempotent;
- concurrent opposite updates converge on the last committed choice without a
  duplicate row;
- account deletion removes consent and the story disappears while retained
  conversation history remains intact;
- block relationships suppress the entire story, not only names.

### Recognition and pulse

Prove that:

- old experiences entered today do not become “just started” milestones;
- a recent current role with permitted fields may become recognition;
- connections-only fields require a current connection;
- self, inactive, deleted, blocked, hidden, and ambiguous candidates are
  excluded;
- deterministic date/ID ordering returns at most one candidate;
- joins and profile refreshes are current-week bounded;
- a newly joined member is not counted again as a refresh;
- zero/one/plural counts preserve facts without analytics-style comparison.

### Privileges and query plans

Prove that:

- authenticated has EXECUTE only on the named `api` wrappers;
- authenticated has no direct access to `private.ask_outcome_shares` or Home
  private helpers;
- functions use empty search paths and qualified relations;
- the native projection, eligible-story lookup, recent recognition, and pulse
  counters remain selective at representative pilot scale;
- no speculative index is accepted without an `EXPLAIN` improvement.

## Framework-free and repository tests

### `src/lib/home`

- deck priority and six-item cap;
- paused helper removal without removing other categories;
- duplicate owner facts do not create duplicate spotlight items;
- all-clear fallback;
- cold-start predicate across Ask, Waiting, and conversation counts;
- status presentation for Waiting, offers, accepted/answered, declined, and
  closes-in-three-days;
- current-week pulse grammar for every zero/one/plural combination;
- Home-native failure fallback;
- one domain failure does not discard the other results;
- URLs are generated only for canonical `/help`, `/messages`, `/school`, and
  profile destinations;
- no private question is logged or placed in a durable global store.

### Repositories and operations

- strict native-result parsing rejects unknown fields and malformed identity
  modes;
- timestamps, UUIDs, counts, and nullable candidates are validated;
- outcome save result codes map without parsing SQL errors;
- Connection decision controller preserves existing Messages outcomes;
- consumed Help question handoff is membership-scoped and length-bounded;
- no Home repository performs raw owner-domain table reads.

## Durable browser roads

1. **Normal Home** — greeting, pulse, six-category deck navigation, ask entry,
   Waiting, open Asks, School rail, and canonical exits.
2. **Question handoff** — type on Home, submit, arrive on Help with the exact
   question, matching starts, URL no longer contains the private text, back to
   Home keeps no duplicate composer state.
3. **Waiting parity** — fold on Home, observe shared folded state in Messages;
   direct Ask opens Help; Connection decline disappears quietly.
4. **Connection accept** — accept on Home, row disappears, calm success appears,
   resulting one-person message room is reachable and no duplicate room exists.
5. **Outcome consent** — resolve an Ask, first participant shares, story stays
   absent; second shares, anonymous story appears; both add identity, names
   appear; one revokes, story disappears.
6. **Paused and all clear** — no matched helper card while paused, no Waiting
   module when empty, open-Ask zero state and School context stay truthful.
7. **First session** — no durable relationship activity produces only the
   three optional doors; creating one Ask returns the normal dashboard.
8. **Partial failure** — injected owner-read failure preserves other modules,
   entered question, and a working local retry.
9. **Responsive** — normal, first-session, Waiting-open, and long-copy states at
   1024/768/390/320 with reachable member navigation and no horizontal overflow.
10. **Accessibility and motion** — axe, keyboard-only deck/Waiting/actions,
    focus visibility, dialog/status announcements, and reduced-motion manual
    deck behavior.

All roads start from the canonical local seed or a test-owned fixture and clean
up after themselves. Test order must not matter.

## Visual fidelity ledger

Before implementation, capture accepted handoff references for:

- normal/as-is;
- paused;
- all-clear;
- first-session;
- loading.

At closeout, capture the app at the same native viewport plus 1440, 1024, 768,
390, and 320 px. Use `view_image` on both the accepted reference and latest
render in the same QA pass. Record at least:

1. greeting/pulse hierarchy;
2. deck geometry, type, controls, and category treatment;
3. ask-entry spacing and control proportions;
4. Waiting/open-Ask row density and status treatment;
5. School rail/date tiles/pinned announcement;
6. desktop container and two-column proportions;
7. tablet/mobile ordering and wrap behavior;
8. palette, radii, borders, shadows, and icons;
9. loading skeleton shape;
10. first-session and all-clear copy.

Every mismatch is either fixed or documented as an intentional, approved
contract correction. Functional success cannot substitute for this pass.

### Closeout comparison

The accepted handoff states were captured at a native 1440 x 1000 viewport in
`/private/tmp/bridgecircle-home-reference/`. The final seeded app was captured
at the same viewport in
`/private/tmp/bridgecircle-home-implementation/playwright-home-1440.png` and
inspected beside the reference with `view_image`.

| Area | Result |
|---|---|
| greeting and pulse | Pass. The accepted hierarchy is preserved; the live seed truthfully uses Richard and the current weekly counts instead of the specimen's Iris copy. |
| spotlight | Pass. One bounded elevated card, compact category/meta row, stable body height, previous/next controls, position controls, reduced-motion behavior, and six-second unheld rotation are implemented. The seed truthfully produces two items rather than filling all six categories. |
| question handoff | Pass. Geometry and primary action match the handoff; the app adds explicit private-handoff copy and removes the transient URL marker after Help consumes it. |
| Waiting and Asks | Pass. Density, grouping, badges, and canonical exits match. Home reuses the Messages projection and only resolves Connection requests in place; direct Asks continue to Help. |
| School rail | Pass. Two bounded event rows, RSVP state, date tiles, and the pinned announcement occupy the accepted desktop rail. |
| desktop composition | Pass. The shell fills the viewport while readable content is capped at 1020 px; the 1.55:1 action/rail split prevents the wide-screen gutters and fixed-ratio behavior previously found in the templates. |
| responsive order | Pass at 1440, 1024, 768, 390, and 320 px with no horizontal overflow. The rail stacks after the action column and every primary action remains reachable. |
| tokens and accessibility | Pass after replacing sub-AA small blue/grey action states with the approved darker semantic tokens. The design-token ratchet remains at zero new arbitrary font-size, tracking, and padding literals. |
| loading and exceptional states | Pass. The route skeleton follows real Home geometry; cold-start, all-clear, paused, empty, and partial-failure contracts remain truthful and do not manufacture activity. |

## Measured closeout evidence

- clean migration replay and seed reset: pass;
- pgTAP: 15 files / 622 assertions pass;
- Home consent contention and Home query-plan harnesses: pass;
- database lint: completes with only the two pre-existing School
  unused-variable warnings in `private.list_school_event_attendees` and
  `private.respond_school_event`;
- shadow diff across `public`, `private`, and `api`: no schema changes;
- generated database types: byte-identical across two runs at SHA-256
  `f35e9433fd0f97a73089bec9030fcf940cb01b4d88356cbe8f8ddf33522efe69`;
- focused Foundation, Conversation, Help, Messages, People/Profile, School,
  and Home TypeScript projects: pass;
- Vitest: 64 files / 274 tests pass;
- ESLint, Biome, design-token ratchet, and every slice boundary/cutover
  ratchet: pass;
- Home Playwright: 5/5 roads pass, including axe and 1440/1024/768/390/320;
- combined Help + Home + Messages + People/Profile + School Playwright: 17/17
  pass after one clean reset;
- mutation-sensitive Messages then People regression: 5/5 pass after one
  clean reset;
- production compilation: Home compiles; repository-wide TypeScript then
  stops in the explicitly parked legacy owner
  `scripts/check-profile-embedding-index.ts:44` because it still names the
  retired pre-v2 profile schema.

## Full local verification stack

From `app/`, final implementation evidence must include:

1. clean `pnpm db:reset`;
2. complete pgTAP suite;
3. Home consent contention harness;
4. Home native query-plan harness;
5. database lint and shadow-schema replay/diff;
6. two local type generations with byte-identical output;
7. focused Home plus all prior-slice TypeScript projects;
8. complete Vitest suite;
9. ESLint and Biome;
10. boundary and destructive-cutover ratchets;
11. combined Help + Messages + People + School + Home Playwright roads from one
    clean reset;
12. production build, with any failure classified by exact owning file and
    proven unrelated to Home;
13. final reset back to canonical seed;
14. clean `git diff --check` and worktree status after commit.

## Explicitly parked

### Profile freshness module

The visual insertion point is part of Home, but production rendering remains
off until a later v2 enrichment slice provides:

- an authenticated owner-only proposal list;
- safe review/accept/dismiss commands over normalized v2 profile tables;
- replacement of raw review tokens with the approved hashed-token flow;
- v2 profile-index invalidation after acceptance;
- tests proving proposal snapshots cannot leak through member reads.

Home must not use the current legacy `base_profiles` application code, expose a
service client to the member path, fabricate “2 updates,” or link to a page
that cannot review the proposal. The parked component must be visually tested
with a typed fixture but unreachable from production data until that contract
lands.

### Other deferrals

- detailed People/search ranking;
- generic activity feed or recommendation scoring;
- admin curation for Home;
- remote database/deployment evidence;
- external email/provider delivery proof;
- weekly digest.

These deferrals do not weaken Home’s composition, relationship flows, privacy,
responsive UI, or outcome-consent contract.

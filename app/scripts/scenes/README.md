# Scenes — staged starting states for demo recordings

A scene is one SQL file that stages a mid-story state on top of a fresh
`pnpm seed:demo-org` — a Help inbox with requests waiting, a conversation in
mid-flow — so a recording can open exactly where its storyline begins, with
zero hand-clicking. Apply with `pnpm seed:scene <name> [<name>...]`, or chain
from the base seed with `DEMO_SCENE=a,b pnpm seed:demo-org`.

## Registry

Each scene owns a UUID namespace `99999999-77NN-4000-8000-…`. Register new
namespaces here; never reuse an NN.

| NN | Scene | Stages |
|----|-------|--------|
| 01 | `help-inbox` | Three waiting asks addressed to Jamie Rowe |
| 02 | `thread` | An accepted-Ask conversation with Jamie in mid-flow, last message unread |
| 03 | `ask-journey` | Jamie's own asks in three states: waiting, accepted, declined-with-note |

## The contract

- **One file per scene, one transaction per file.** `begin` … `commit`, applied
  via `seed-scene.sh`, which passes `:org_id`, `:jamie_user`, and
  `:jamie_membership`.
- **Delete your own namespace first, then insert.** That makes every scene
  rerunnable and composable. Delete order matters: asks before conversations
  (`asks.conversation_id` is `on delete restrict`); messages and
  conversation_reads cascade from conversations.
- **Reference crowd rows by query, never by hardcoded `dddddddd-` ids.** The
  crowd's UUIDs carry a per-org discriminator and shift with `DEMO_MEMBERS`;
  scenes that query ("first active member with a headline and no room with
  Jamie…") survive both. Pick counterparts from disjoint row-number windows so
  composed scenes never grab the same member.
- **Messages have identity ids**, so they are namespaced indirectly: user
  messages carry a `client_nonce` in the scene's UUID range, system messages a
  `system_event_key` prefixed `scene:<name>:`. Both are unique per
  conversation, which is what makes the delete-by-conversation clean.
- **Stay inside states the command layer would allow.** Waiting asks must fit
  the recipient's pending capacity (seed-demo-org gives Jamie headroom of 10),
  accepted asks need their room linked, declined asks need the note — the
  schema's lifecycle checks enforce most of this, so a scene that loads is
  usually a scene that's honest.
- **Run-relative timestamps only** (`now() - interval …`), so the staged state
  reads fresh whenever it is applied.

## Lifecycle

Scenes are overlays on the crowd, and the crowd's regeneration deletes
by reference — so **rerunning `seed:demo-org` (or `seed:scale` into the demo
org) clears every applied scene**. That is by design: reseed, then re-apply
the scenes the next take needs.

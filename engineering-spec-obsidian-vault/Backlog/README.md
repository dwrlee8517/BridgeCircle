# Backlog

Things worth addressing that are **not** the task in hand.

The purpose of this folder is to make it cheap to notice something and keep
going. Seeing a stale comment, a missing index, an RLS policy that looks too
broad, or a test that passes for the wrong reason should cost you one small file
and zero minutes of scope creep. Log it, link where you saw it, move on.

## The rule

**Log and keep going.** Do not fix a backlog-shaped finding inside an unrelated
change. The exception is the obvious one: if what you found makes the change you
are currently making wrong or unsafe, it is no longer backlog — it is part of
your task, and it goes in the same diff.

## How to log one

Copy [`../_templates/backlog-entry.md`](../_templates/backlog-entry.md) to
`Backlog/<short-kebab-slug>.md` and fill it in. One finding per file. Keep it
short — enough that a future session can decide whether to act without
re-investigating from scratch, and no more.

Include the file and line where you saw it (`app/src/lib/asks/createAsk.ts:88`),
because the single most expensive part of acting on a backlog entry is finding
the thing again.

## Triage

Entries are not scheduled from here. When starting a piece of work, it is worth
scanning for entries in the area you are touching — those are the cheapest ones
to fix, because you already have the context loaded.

```bash
rg -l "area: asks" engineering-spec-obsidian-vault/Backlog
```

An entry leaves the backlog one of three ways: it is fixed (delete the file in
the fixing PR), it is promoted into an initiative task or a tech spec change, or
it is judged not worth doing (delete it, and say why in the deleting commit).
Entries should not accumulate forever — a backlog nobody deletes from is a
backlog nobody reads.

## Frontmatter fields

| Field | Values |
|---|---|
| `type` | `oddity` · `debt` · `bug` · `cleanup` · `question` · `risk` |
| `area` | the `app/src/lib/` module or subsystem — `asks`, `auth`, `search`, `ci`, `db`, … |
| `severity` | `low` · `medium` · `high` — how bad if left alone, not how annoying |
| `found_during` | what you were actually doing when you tripped over it |
| `date` | ISO date, `YYYY-MM-DD` |

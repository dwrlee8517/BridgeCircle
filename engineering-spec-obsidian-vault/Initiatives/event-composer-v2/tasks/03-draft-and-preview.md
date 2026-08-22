---
id: event-composer-v2/03-draft-and-preview
initiative: "[[Initiatives/event-composer-v2/plan|Event composer v2]]"
status: ready
depends_on: [02]
pr:
---

# 03 — Save as draft + member preview

## Cold start

`public.events.status` already has `'draft'` with lifecycle check constraints,
but nothing can create one: `private.save_admin_school_event_v2` hardcodes
`'published'` on insert (see the insert around
`20260722010000_complete_admin_operations.sql:582`) and its read counterpart
filters to `status in ('published','cancelled')` in places. This task adds a
`p_publish boolean` (or `p_status`) to the save RPC, a **Save draft** action
next to Publish in the form's action bar, a Drafts group in the admin events
table with edit/publish/delete row actions, and a **Preview** that renders the
member event detail for a draft. Non-obvious: member-facing RPCs must keep
excluding drafts (check every school read path, including home dashboard and
GraphQL member reads), and preview should reuse the real member components —
the admin route renders them server-side for the draft row rather than
duplicating markup. Publishing a draft sets `published_at` then and only then;
`event_changed` notifications must not fire for edits to drafts.

## Scope

**In:**
- Migration: extend save RPC with a publish flag; a `publish_admin_school_event_v2`
  transition (draft → published) or fold into save; drafts included in
  `get_admin_school_events_v2` with status.
- Form action bar: Save draft · Preview · Publish (Preview enabled once saved).
- Admin events table: Drafts section above Upcoming; draft rows can be deleted
  regardless of `has_responses` (drafts cannot have responses).
- Admin preview route (e.g. `/admin/events/[id]/preview`) rendering the member
  detail component with a "This is a preview — members can't see it" banner.
- Guard: change-note field + `event_changed` fan-out only apply to published
  events.

**Out:**
- Announce (task 05) — but leave the publish transition callable server-side so
  05 can hook it.
- Scheduled publishing ("go live at…") — backlog if wanted.

## Files

| Path | What changes |
|---|---|
| `app/supabase/migrations/<ts>_event_drafts.sql` | save RPC publish flag + reads |
| `app/src/lib/school/admin-schemas.ts` | intent field (draft/publish) |
| `app/src/lib/school/operations.ts` | draft-aware save/publish results |
| `app/src/db/repositories/school.ts` | plumb flag + drafts in admin list |
| `app/src/app/(admin)/admin/events/actions.ts` + `[id]/edit/actions.ts` | intents |
| `app/src/app/(admin)/admin/events/event-form.tsx` | action bar buttons |
| `app/src/app/(admin)/admin/events/page.tsx` | Drafts section |
| `app/src/app/(admin)/admin/events/[id]/preview/page.tsx` | new |

## Steps

1. Migration + repo plumb → save with `publish=false` yields a `draft` row;
   pgTAP/db test asserts member read excludes it.
2. Form intents (two submit buttons, `formaction` or a hidden intent field) →
   both paths round-trip.
3. Drafts table section + row actions → draft publishes from the list.
4. Preview route reusing member components → draft renders; a non-admin
   hitting the URL bounces (layout gate already covers it).
5. Verify member surfaces (School page, home dashboard, GraphQL member reads)
   never show the draft.

## Verification

```bash
pnpm biome check . && pnpm lint && pnpm tsc --noEmit && pnpm vitest && pnpm build
```

- Full journey in the running app: save draft → preview → edit → publish →
  member sees it; `published_at` set at publish, not at first save.
- Draft edits produce no notifications; a post-publish edit with a change note
  still fans out `event_changed`.
- migration-reviewer pass; `pnpm db:types:local` byte-identical twice.

## Done when

- [ ] Draft lifecycle works end-to-end in the app
- [ ] Members can never read a draft (asserted by test, not inspection)
- [ ] Preview renders the real member detail for drafts
- [ ] PR opened and CI green

## Handoff notes

- **What diverged from the plan:**
- **What the next task needs to know:**
- **Logged to `Backlog/`:**

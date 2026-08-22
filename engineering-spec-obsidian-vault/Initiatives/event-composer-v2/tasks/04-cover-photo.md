---
id: event-composer-v2/04-cover-photo
initiative: "[[Initiatives/event-composer-v2/plan|Event composer v2]]"
status: ready
depends_on: [02]
pr:
---

# 04 — Cover photo: bucket, column, upload, render

## Cold start

Events get a single optional cover image (decision 2026-08-21: cover only, no
gallery). Nothing exists yet: no column, no bucket. The established pattern to
copy is avatars — bucket seeded in a migration (`insert into storage.buckets`
with `file_size_limit` and `allowed_mime_types`, see
`20260713231344_v2_init.sql:10144`), storage RLS policies, an
`avatar-storage.ts`-style repository, and upload via a server action. The
member School page's event-page "cover travels" behavior already exists per
the 2026-07 flow decisions (`FLOWS.md` §school) — check how the current cover
placeholder is rendered on the member event detail before inventing a slot.
Storage objects must be org-scoped in the path (`<org_id>/<event_id>/...`) so
RLS can gate reads by membership, and replaced/deleted events must not leak
objects (delete storage on event delete; overwrite on re-upload).

## Scope

**In:**
- Migration: `cover_image_path text` on `public.events` (+ include in admin +
  member read RPCs), `event-covers` bucket (private; size limit ~5MB;
  jpeg/png/webp), RLS: members of the org read, event-managing admins write.
- `app/src/db/repositories/event-cover-storage.ts` (upload, signed/public URL
  resolution matching how avatars do it, delete).
- Form: upload control in the core block with client-side downscale (reuse the
  avatar crop/downscale approach if one exists — check `avatar-actions.ts`),
  preview thumbnail, remove button.
- Member School: render the cover on the event card and detail when present;
  keep the current styled placeholder when absent.

**Out:**
- Multiple photos / gallery (explicitly rejected for now).
- Image CDN/optimization beyond what avatars already do.
- Announce email imagery — 05 may embed the cover; don't pre-build.

## Files

| Path | What changes |
|---|---|
| `app/supabase/migrations/<ts>_event_covers.sql` | column + bucket + RLS |
| `app/src/db/repositories/event-cover-storage.ts` | new |
| `app/src/db/repositories/school.ts` | coverImagePath in reads/saves |
| `app/src/lib/school/contracts.ts` | field on both event types |
| `app/src/app/(admin)/admin/events/event-form.tsx` | upload control |
| `app/src/app/(admin)/admin/events/actions.ts` (+ edit actions) | accept upload |
| member School card + detail components | render cover |

## Steps

1. Migration (column + bucket + policies) → rls-auditor agent pass on the new
   policies.
2. Storage repository + unit test (mock storage client like avatar tests do).
3. Form upload + remove → create/edit round-trips; oversized/wrong-mime file
   rejected with a friendly message.
4. Member rendering → card + detail show the image; placeholder unchanged when
   absent.
5. Delete an event with a cover → object removed from storage.

## Verification

```bash
pnpm biome check . && pnpm lint && pnpm tsc --noEmit && pnpm vitest && pnpm build
```

- A non-member of the org cannot fetch the object URL (test with the second
  seeded org's user).
- `pnpm db:types:local` byte-identical twice; migration-reviewer +
  rls-auditor passes.
- Screenshot the member event detail with and without a cover.

## Done when

- [ ] Cover uploads, replaces, removes; renders member-side
- [ ] Storage is org-gated and cleaned up on delete
- [ ] PR opened and CI green

## Handoff notes

- **What diverged from the plan:**
- **What the next task needs to know:**
- **Logged to `Backlog/`:**

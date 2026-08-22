---
id: event-composer-v2/02-form-rework-comboboxes
initiative: "[[Initiatives/event-composer-v2/plan|Event composer v2]]"
status: done
depends_on: [01]
pr: https://github.com/dwrlee8517/BridgeCircle/pull/224
---

# 02 — Form rework: sections, comboboxes, time zone, conditional location

## Cold start

Pure UI/UX rework of `app/src/app/(admin)/admin/events/event-form.tsx` (~800
lines, client component, `useActionState` + FormData server actions — form
fields serialize by `name`, so new widgets must still emit plain form fields).
Four changes: (a) category and host become add-or-type comboboxes, (b) the
time zone `<select>` becomes a searchable full-IANA picker with a "use my time
zone" fill and a resolved-time echo line, (c) location/join-link fields
show/hide by format instead of always rendering, (d) the single long column
becomes a one-screen-first layout: core block on top (title, summary, when,
where, host, category), secondary sections (schedule, useful details, change
note) collapsed, sticky section nav at left, sticky bottom action bar. The
non-obvious parts: there is **no combobox primitive** in
`app/src/components/ui/` — build one on the existing `popover.tsx` and make it
reusable; and validation stays server-side in `admin-schemas.ts` — the form
only controls *presentation* of requiredness (schema already only requires
location for in-person/hybrid).

## Scope

**In:**
- `components/ui/combobox.tsx`: popover + filtered listbox + free-text entry,
  ARIA combobox pattern, emits a hidden input for FormData.
- Category options = distinct categories in this org's existing events; host
  options = distinct host names + member search (host is `host_membership_id`
  OR `host_name` — offering members makes hosts linkable later, but free text
  must stay first-class). New repo method(s) on the school admin repository
  for the distinct lists.
- Time zone: full `Intl.supportedValuesOf('timeZone')` list, searchable, with
  `Intl.DateTimeFormat().resolvedOptions().timeZone` as the "use mine" fill.
- Resolved-time echo under the date fields: start rendered in the event tz and
  in the admin's own tz when they differ.
- Format-conditional place block: `online` → join link (+ join window);
  `in_person` → location/address/maps; `hybrid` → both. Fields keep their
  names so the schema is untouched.
- Section layout + sticky nav + sticky action bar (density-pro tokens, no new
  design tokens — reuse `tokens.md` roles).

**Out:**
- Draft/preview buttons — task 03 owns the action bar's contents beyond the
  existing submit.
- Any change to `admin-schemas.ts` semantics (01 finished those).
- Combobox use anywhere else in the app (members directory filters etc.) —
  reuse later, don't migrate now.

## Files

| Path | What changes |
|---|---|
| `app/src/components/ui/combobox.tsx` | new primitive |
| `app/src/app/(admin)/admin/events/event-form.tsx` | layout + widgets |
| `app/src/db/repositories/school.ts` | distinct category/host list reads |
| `app/src/lib/school/contracts.ts` | types for the option lists |
| `app/src/app/(admin)/admin/events/page.tsx` | pass option lists to the form |
| `app/src/app/(admin)/admin/events/[id]/edit/page.tsx` | same |

## Steps

1. Build combobox against a static list; verify keyboard + free text → axe/
   manual a11y pass.
2. Repo reads for distinct categories/hosts (org-scoped, RPC or view per the
   existing fixed-API pattern) → unit test.
3. Rewire category/host/tz fields → create + edit both round-trip unchanged
   values.
4. Conditional place block driven by the existing `format` state → switching
   format hides/shows without losing entered values.
5. Section layout + sticky nav/action bar → 1440px shows the core block in one
   viewport; small screens degrade to stacked sections (no sticky nav).
6. Playwright sweep of create + edit against the seeded org.

## Verification

```bash
pnpm biome check . && pnpm lint && pnpm tsc --noEmit && pnpm vitest
```

- Create an event typing a brand-new category and picking an existing host;
  edit it back — both persist.
- Time zone search finds "Seoul"; "use my time zone" fills; echo line shows
  both zones for a KST event viewed from PT.
- Online event shows no location fields; submits with join link only.
- e2e school specs (`app/tests/e2e/school/`) still green — they drive this form.

## Done when

- [x] Core block fits one 1440×1000 viewport; sections navigable
- [x] Combobox category/host + searchable tz shipped and accessible
- [x] Location only rendered when the format needs it
- [x] PR opened: #224 (stacked on #223; CI running at handoff)

## Handoff notes

- **What diverged from the plan:** No new repo methods — both admin event
  pages already load the full `getAdminEvents` list, so category/host option
  lists are derived there and passed as props. The member-search host picker
  was dropped: the save RPC only writes `host_name` (no
  `p_host_membership_id` parameter exists), so a member-linked host is an RPC
  change, out of this task's scope — combobox offers past hosts + free text.
  The listbox uses divs with ARIA roles (biome rejects role=listbox on
  ul/li). Description became its own collapsible section rather than staying
  in Basics.
- **What the next task needs to know:** The sticky bottom action bar in
  `event-form.tsx` is where Save draft · Preview · Publish go (currently one
  submit + inline messages). Collapsible `FormSection` supports
  `defaultOpen`/`forceOpen`/`count` and auto-opens via `onInvalidCapture`
  when a hidden required field blocks native validation. Conditional place
  blocks stay mounted (`hidden` attr) so values survive format toggles;
  `required` is cleared while hidden. `Combobox` (components/ui/combobox.tsx)
  is reusable: input carries the form `name`, shows all options on focus,
  filters after typing.
- **Logged to `Backlog/`:** member-linked event hosts (host_membership_id
  picker) — needs an RPC parameter; consider folding into task 03's
  migration if wanted.

# BridgeCircle Data Model — Phase 1 Launch

> **Legacy remote-schema notice (2026-07-14):** This document explains the
> schema still used by the shared development and production databases and by
> application domains that have not yet been ported. The local
> `codex/redesign-v2` Foundation now uses the implemented
> [database v2 contract](database-v2-contract.md), governed by
> [ADR 0015](../decisions/0015-prelaunch-v2-database-reset.md). Keep this file
> until both remote cutovers and the remaining domain ports are complete; code
> remains canonical in the meantime.

This document explains the schema that ships in `0001_init.sql`. It covers every table from [phase-1-launch-spec.md](../../product-spec-obsidian-vault/Production/phase-1/launch-cut.md) "Data Model At Launch" and the rationale behind each design choice.

For a clickable visual map, open [data-model.html](data-model.html).

## Why ship the full schema on Day 1

The launch spec lists 13 tables wired to UI plus 7 tables that exist in schema but are not exposed yet. We create all of them in the same migration because:

- Migrations are cheaper to write together than to rev later.
- Foreign keys to deferred tables (`notification.user_id`, `friendship` referenced by `direct_message_thread`) need real targets, not stubs.
- RLS defaults are cleaner when applied uniformly.
- Week 3 work becomes a UI-only change, not "schema + UI."

What we do **not** do on Day 1: write RLS policies, seed data, or create indexes beyond primary/foreign keys. Those are Day 2.

---

## Domain map

The 20 launch tables fall into six domains:

| Domain | Tables | Live at launch? |
| --- | --- | --- |
| Identity & org membership | `users`, `organizations`, `organization_memberships`, `base_profiles`, `organization_profiles`, `invites` | Yes |
| Mentorship | `mentorship_preferences`, `mentorship_requests`, `mentorship_threads`, `messages` | Yes |
| Events | `events`, `event_rsvps` | Yes |
| Admin & audit | `admin_role_assignments`, `audit_log` | Yes (audit writes silently) |
| Social (week 3+) | `friend_requests`, `friendships`, `direct_message_threads` | Schema only |
| System (week 3+) | `announcements`, `notifications`, `profile_refresh_prompts`, `saved_searches` | Schema only |

`messages` straddles two domains because both mentorship threads and direct-message threads write into the same row shape.

---

## Identity and organization membership

```
auth.users (Supabase)
   │ 1—1
   ▼
 users  ───1—1──▶  base_profiles
   │
   │ 1—N
   ▼
 organization_memberships  ──N—1──▶  organizations
   │                                     ▲
   │ 1—1                                 │ 1—N
   ▼                                     │
 organization_profiles                 invites
```

### `users`
Shadow table for `auth.users`. We do **not** put profile data here. Reasons:
- Supabase manages `auth.users` rows; we do not own that schema.
- Decoupling lets us add app-only flags (`deleted_at`, `last_seen_at`) without fighting Supabase migrations.
- One row created via auth trigger on signup.

### `organizations`
At launch: two rows (Chadwick School, Chadwick International). Multi-org is the foundational design choice — every membership, profile, request, event, and admin role is scoped here.

### `organization_memberships` (the join table that does the real work)
- `(user_id, organization_id)` unique
- `status` enum: `pending | active | rejected | revoked`
- `joined_at`, `approved_by` (admin user id), `approved_at`

This separation matters: a user signing up via invite creates a `pending` membership; the admin approval queue flips it to `active`. Revoking a member does not delete data — it sets `revoked` and audit-trails who did it.

### `base_profiles` vs `organization_profiles` — the split that future-proofs multi-org

Per [phase-1-launch-spec.md:131](../../product-spec-obsidian-vault/Production/phase-1/launch-cut.md): keep the split in schema even though UI shows one combined profile until org #2 onboards.

| Table | Holds | Why here |
| --- | --- | --- |
| `base_profiles` | name, headline, current employer/title, city, university, major, LinkedIn URL, avatar | Reusable identity. One per user. |
| `organization_profiles` | graduation year, mentoring topics (org-context), bio (org-context), `open_to_mentor` | Org-specific. One per `organization_membership`. |

When Chadwick International onboards, an existing user gets a second `organization_profile` row without touching `base_profile`. Without this split, we would need a destructive migration to support multi-org.

At launch, the UI merges both into one form. The split is invisible to the user.

### `invites`
- `(organization_id, email)` plus a unique `token` (random, opaque, single-use)
- `status` enum: `pending | accepted | expired | revoked`
- `expires_at`, `sent_by` (admin user id), `accepted_by` (user id, nullable until accepted)
- Optional pre-fill fields from CSV import: `full_name`, `graduation_year`

Why an `invites` table separate from `organization_memberships`:
- Invite is a *promise* to join; membership is the *fact* of joining.
- Token validation lives on the invite row alone, before any user account exists.
- A revoked invite should not disturb membership history.
- Per [phase-1-launch-spec.md:24](../../product-spec-obsidian-vault/Production/phase-1/launch-cut.md), valid invite token = auto-approve, so `invite.accepted` triggers `organization_membership(status='active')` directly.

---

## Mentorship — the core launch loop

```
 users (mentor)        users (mentee)
   │                     │
   │ 1—1                 │ 1—N
   ▼                     ▼
 mentorship_preferences   ──┐
                            ▼
                   mentorship_requests  ──(on accept)──▶  mentorship_threads
                                                              │ 1—N
                                                              ▼
                                                          messages
```

### `mentorship_preferences`
Scoped per `organization_membership`, not per user. Why: a user could be open-to-mentor at Chadwick School but not at Chadwick International. Same forward-compatibility reasoning as the profile split.

Fields per [phase-1-launch-spec.md:50](../../product-spec-obsidian-vault/Production/phase-1/launch-cut.md):
- `is_open` boolean (open / closed toggle)
- `topics` text[] (controlled list + free-text)
- `screening_prompt` text nullable
- `max_active_mentees` int default 5
- `max_pending_requests` int default 10
- `paused_at` timestamp nullable (for the 14-day inactivity auto-pause)

### `mentorship_requests`
- `mentor_id`, `mentee_id`, `organization_id`
- `status` enum: `pending | accepted | declined | expired`
- `reason`, `help_needed`, `background`, `screening_answer`
- `responded_at`

### `mentorship_threads` — separated from requests on purpose

Why not just flip the request to "accepted" and message off it?
- A thread has a different lifecycle than a request: requests close once decided, threads stay open until archived.
- Threads can be ended without losing the original request record.
- Future feature: re-request mentorship after a thread closes — same mentor, new request, new thread.
- Keeps `messages.thread_id` polymorphic-free: a thread is always a `mentorship_thread` or `direct_message_thread`, never a request.

`mentorship_threads`:
- `request_id` FK (the originating request)
- `mentor_id`, `mentee_id` denormalized for fast lookup
- `status` enum: `active | archived`
- `last_message_at` denormalized for inbox sorting

### `messages`
- `thread_id` (uuid)
- `thread_type` enum: `mentorship | direct` — determines which thread table `thread_id` references
- `sender_id`, `body`, `created_at`, `read_at`
- Plain text only at launch (no attachments).

This polymorphic-by-enum pattern is preferred over two separate `mentorship_messages` and `dm_messages` tables because the inbox query (give me all unread messages for user X) becomes one scan instead of two unioned scans.

---

## Events

```
 organizations  ──1—N──▶  events  ──1—N──▶  event_rsvps  ──N—1──▶  users
```

### `events`
- `organization_id`, `created_by`
- `title`, `description`, `location` (free text), `starts_at`, `ends_at`
- `published_at` nullable (drafts vs live)

Per the launch spec: no event detail page (modal is enough), no reminders beyond the RSVP confirmation.

### `event_rsvps`
- `(event_id, user_id)` unique
- `status` enum: `going | not_going`
- `responded_at`

No waitlist, no maybe, no plus-ones. Add later if real demand surfaces.

---

## Admin and audit

### `admin_role_assignments`
- `(user_id, organization_id, role)` unique
- `role` enum: `super_admin | admin | event_moderator | ambassador`
- `granted_by`, `granted_at`

Per-org scoping is the whole point: founder is `super_admin` of Chadwick School and Chadwick International independently. An ambassador for one org is just a member at another.

`member` is **not** in this table — it lives on `organization_memberships`. Roles in this table represent elevation above member.

### `audit_log`
- `actor_id` (user), `organization_id` nullable
- `action` text (e.g. `invite.sent`, `member.approved`, `mentorship_request.declined`)
- `target_type`, `target_id` (the thing acted on)
- `payload` jsonb (the diff or context)
- `created_at`

Write-only at launch. We do not build an admin UI for it — but every admin action writes a row from Day 1 so we have history when we need it.

---

## Schema-only tables (week 3+ wiring)

These exist now so foreign keys resolve and so week 3 is a UI change, not a migration.

### `friend_requests` and `friendships`
The same request-then-relationship pattern as mentorship.

`friendships` stores **one row per friendship** with canonical user ordering: `user_a_id < user_b_id` enforced via `CHECK`. This avoids the "two rows per relationship" duplication and makes "is X friends with Y" a single primary-key lookup.

### `direct_message_threads`
- One row per pair of friends (`user_a_id`, `user_b_id`, canonical order)
- Created lazily on first DM, not at friendship time
- `messages` rows reference it via `thread_id` + `thread_type='direct'`

### `announcements`, `notifications`, `profile_refresh_prompts`, `saved_searches`
- `announcements`: org-scoped, admin-authored, week 3 surface
- `notifications`: per-user delivery log; email-only at launch but rows still get written so the in-app tray works on day one of week 3
- `profile_refresh_prompts`: per-org-membership, due-date driven (the 6–12 month freshness loop from [phase-1-spec.md:284](../../product-spec-obsidian-vault/Production/phase-1/spec.md))
- `saved_searches`: per-user, JSON filter blob plus optional notify cadence

---

## Cross-cutting design decisions

### Why every "scoped" thing carries `organization_id`

Mentorship requests, events, admin roles, profile overlays, audit rows — all carry an explicit `organization_id`. Two reasons:

1. **RLS simplicity** (Day 2). Every policy reduces to "is the requesting user an active member of this `organization_id`?" No multi-hop joins.
2. **Multi-org correctness**. A mentor open at Chadwick School should not receive requests from someone who only belongs to Chadwick International — even if the mentor also belongs to International. Scoping by org makes this a constraint, not a query convention.

### Why enums instead of boolean flags

`status` enums on memberships, invites, requests, threads, events let us model the lifecycle explicitly. Booleans (`is_accepted`, `is_pending`) drift into illegal combinations (`is_pending=true AND is_accepted=true`). Enums make illegal states unrepresentable.

### Why `messages` is one table, not many

One inbox query, one notification fan-out, one moderation surface. The `thread_type` enum is the only branching cost.

### Why `audit_log` ships on Day 1

Two reasons:
- The first time you need it (a mentor reports being added to an org without consent, an admin says "I never approved that"), it is too late to add it.
- Writing audit rows from the first admin action means there are no gaps.

### What the schema does **not** include yet

Per the launch spec: no `meetup_proposals`, no `mentorship_response` (the response is a state change on the request, not a separate row), no `profile_visibility_setting` table (defaults are hardcoded in app code), no `ambassador` workflow tables. Each of these is a deliberate scope cut from [phase-1-launch-spec.md](../../product-spec-obsidian-vault/Production/phase-1/launch-cut.md).

---

## Lifecycle flows

### Onboarding (the path every member takes)

```
1. Admin uploads CSV → invites created (status=pending)
2. Resend sends email with token URL
3. User clicks link → /join?token=xyz
4. Server validates token against invites table
5. User signs up via Supabase Auth → users row created
6. Token validation auto-creates organization_membership (status=active)
7. invite.status → accepted, invite.accepted_by → user.id
8. User redirected to profile setup (base_profile + organization_profile rows)
9. audit_log: { action: 'member.joined', actor: user, target: invite }
```

### Mentorship request (the core repeat loop)

```
1. Mentee searches → results filtered to mentorship_preferences.is_open=true
2. Mentee opens profile → composer
3. mentorship_request inserted (status=pending)
4. Notification + email to mentor
5. Mentor accepts → request.status=accepted
6. mentorship_thread created (request_id FK)
7. Initial system message inserted into messages
8. Both inboxes show the thread
9. audit_log: { action: 'mentorship.accepted', target: request }
```

### Mentor inactivity sweep (Railway worker, daily)

```
1. SELECT mentorship_preferences WHERE is_open=true AND paused_at IS NULL
2. For each: any mentorship_request older than 14 days with status=pending?
3. If yes → mentorship_preferences.paused_at = now()
4. Search rankings drop "paused while away" mentors
5. On next mentor login → unpause prompt → paused_at=null
```

---

## What changes in week 3+

The launch-cut schema still stands on its own. Week 3+ schema work is additive:

- Wire UI to existing `friend_requests`, `friendships`, `direct_message_threads` tables
- Add profile enrichment settings/runs/proposals for the LinkdAPI onboarding import and refresh workflow
- Wire UI to `notifications` table for in-app tray
- Wire UI to `profile_refresh_prompts`
- Wire UI to `announcements`
- Wire UI to `saved_searches`
- Build admin analytics dashboard against existing tables (no new schema)

If something in week 3 requires a destructive change to the launch-cut schema, we lost a bet. Additive tables and columns are expected for richer profile enrichment.

---

## Future profile expansion

Once members start importing LinkedIn profiles, uploading resumes, and adding richer professional history, `base_profiles` alone is not enough. This section sketches the additive migration path. **Nothing here ships on Day 1** — but the launch schema is shaped to accommodate it without rework.

Canonical provider plan: [Profile enrichment and freshness](profile-enrichment.md). In short: LinkdAPI powers initial onboarding import and manual **Update from LinkedIn**; Bright Data's Marketplace Dataset Filter API powers the monthly sweep against a pre-cleaned LinkedIn profile index; PDL is the fallback across the board (free tier covers pilot scale). The three providers sit behind a single `EnrichmentProvider` interface so failover is a config flag, not a refactor. User-confirmed proposals remain the write gate unless the user explicitly opts into auto-apply.

### The scaling rule

`base_profiles` stays as the **identity card**: name, headline, current role, current city, current employer/title (denormalized snapshot), avatar, LinkedIn URL. It does not grow wide.

Anything list-shaped — work history, degrees, certifications, projects, skills — moves to its own child table. Three reasons:

- **Search ranking wants first-class signals.** "Worked at Google" is a join, not a substring match on `current_employer`.
- **Wide rows are slow to read and scary to migrate.** Every UI form has to learn which columns it owns.
- **List-shaped data has its own lifecycle.** A job ends, a degree completes — these are row-level events, not column updates.

What we explicitly do **not** do: a `profile_data jsonb` blob on `base_profiles`. JSONB is fine for opaque payloads (`raw_linkedin_payload`), not for things that get filtered or ranked.

### New tables (additive, no Day-1 cost)

```
work_history
  id, base_profile_id (FK), employer, title, location,
  start_date, end_date, is_current, description,
  source (manual | linkedin | resume | csv_import),
  source_record_id, confirmed_at, updated_at, created_at

education_history
  id, base_profile_id (FK), institution, degree, field_of_study,
  start_year, end_year, is_current,
  source, source_record_id, confirmed_at, updated_at, created_at

skills
  id, base_profile_id (FK), name, proficiency, endorsements_count,
  source, confirmed_at, updated_at, created_at

certifications
  id, base_profile_id (FK), name, issuer, issued_at, expires_at, credential_url,
  source, confirmed_at, updated_at, created_at

projects
  id, base_profile_id (FK), title, description, url, started_at, ended_at,
  source, confirmed_at, updated_at, created_at

resume_uploads
  id, base_profile_id (FK), file_path (Supabase Storage),
  parsed_text, parse_status (pending | parsed | failed), parse_error,
  uploaded_at, version

profile_enrichment_settings
  user_id (FK), linkedin_url, linkedin_username, linkdapi_urn, pdl_person_id,
  primary_provider (linkdapi), fallback_provider (pdl),
  refresh_policy (manual_only | review_before_update | auto_apply_and_notify),
  refresh_interval (monthly | quarterly),
  consented_at, last_checked_at, last_enriched_at,
  last_profile_fingerprint,
  updated_at, created_at

profile_enrichment_runs
  id, user_id (FK), provider (linkdapi | pdl | bright_data),
  purpose (onboarding_import | manual_refresh | scheduled_check | fallback_verification),
  status (succeeded | no_match | failed | skipped_cap | skipped_unchanged),
  cost_units, fingerprint, error, fetched_at, created_at
```

Common pattern for professional profile rows: every row carries `source`, `confirmed_at`, `updated_at`. This is what powers freshness tracking and the proposal workflow below.

The `resumes` Supabase Storage bucket is already provisioned for week 3 per [phase-1-launch-spec.md:158](../../product-spec-obsidian-vault/Production/phase-1/launch-cut.md). `resume_uploads` is the metadata table that points into it.

### Freshness tracking — section level, not field or row

Field-level (`employer_updated_at`, `title_updated_at`) explodes the schema. Row-level (`base_profiles.updated_at`) is too coarse — updating your bio should not mark your job as fresh. Section-level fits how things actually get edited.

For child tables, every row already has `updated_at` and `confirmed_at` — that *is* section-level.

For the legacy fields on `base_profiles`, add explicit confirmation columns:

```
ALTER TABLE base_profiles
  ADD COLUMN identity_confirmed_at     timestamptz,
  ADD COLUMN current_role_confirmed_at timestamptz,
  ADD COLUMN location_confirmed_at     timestamptz;
```

`updated_at` = last change. `confirmed_at` = user said "yes, still correct." These diverge in a useful way: clicking "confirm" without editing advances `confirmed_at` but not `updated_at`. That distinction powers the **profile freshness rate** metric in [phase-1-spec.md:515](../../product-spec-obsidian-vault/Production/phase-1/spec.md).

### Background updates need a proposal inbox

LinkedIn/LinkdAPI enrichment, PDL fallback checks, resume re-parse, employer-domain heuristics — none of these should silently overwrite the user's data unless the user explicitly chose `auto_apply_and_notify`. The product principle in [phase-1-spec.md:289](../../product-spec-obsidian-vault/Production/phase-1/spec.md) is explicit: external profile imports must support user confirmation.

The schema enforcement is a proposal table:

```
profile_change_proposals
  id
  user_id (FK)
  source                 -- linkdapi | pdl | bright_data | resume | csv_import | inferred
  source_run_id          -- profile_enrichment_runs.id or resume_uploads.id
  target_table           -- 'base_profiles' | 'work_history' | ...
  target_row_id          -- nullable when proposing to insert a new row
  target_field           -- nullable when proposing a whole new row
  current_value (jsonb)
  proposed_value (jsonb)
  status                 -- pending | accepted | edited | declined | auto_applied | superseded
  proposed_at, reviewed_at, reviewed_by
```

Lifecycle:

1. Onboarding import calls LinkdAPI, maps professional fields, and shows the review UI before first save.
2. Background worker parses resume / checks LinkdAPI / falls back to PDL → diffs against current profile → inserts N `pending` proposals.
3. User sees a "review changes" panel: *"LinkedIn says your title is now Senior PM — accept?"*
4. Accept → write to the real table → proposal `status=accepted` → audit_log row.
5. Edit → user modifies the proposed data before applying → proposal `status=edited`.
6. Decline → proposal `status=declined`; the source respects a cooldown before re-proposing the same diff.
7. Newer parse arrives → older pending proposals get marked `superseded`.

Why this beats "just write through":

- Failed parses (resume OCR errors, LinkedIn API hiccups) never silently corrupt user data.
- Users can reject "corrections" they disagree with, and the system remembers not to nag.
- Audit trail of what was proposed vs accepted is right there in the table.
- The system surfaces uncertainty instead of hiding it — which is the whole point of the freshness loop.

### The full freshness loop (when this is wired up)

```
profile_enrichment_settings refresh interval fires (cron, monthly or quarterly)
   ↓
Bright Data Dataset Filter API returns matched records for opted-in LinkedIn URLs; writes profile_enrichment_runs
   ↓
unchanged fingerprints stop here; URLs missing from the dataset for 3+ sweeps escalate to LinkdAPI; if LinkdAPI also fails, PDL within the monthly cap
   ↓
profile_change_proposals inserted for meaningful diffs
   ↓
email + in-app prompt: "LinkedIn suggests your current role changed to Senior PM at Google"
   ↓
user clicks → confirm, edit, or decline
   ↓
audit_log row for whatever happened
   ↓
next profile_enrichment_settings check scheduled by refresh_interval
```

`profile_refresh_prompts` still handles manual "is this still correct?" prompts when no external change has been detected for 6-12 months.

### Search ranking gets richer for free

Once `work_history` and `education_history` exist, the launch spec ranking from [phase-1-launch-spec.md:39](../../product-spec-obsidian-vault/Production/phase-1/launch-cut.md) gets a quiet upgrade:

| Launch ranking signal | After expansion |
| --- | --- |
| Same university | Same institution in `education_history` (covers grad school, exchange programs, etc.) |
| Same major | Same `field_of_study` in any education row |
| String match on `current_employer` | Match against `work_history.employer` (covers "used to work at Google") |
| String match on role/industry | Match against `work_history.title` history |
| (none) | Skill overlap with `skills` |

No ranking code rewrite — the join targets just get more interesting.

### Day-1 discipline that protects this future

Three small things to internalize while writing `0001_init.sql` and the first feature code, even though the expansion doesn't ship:

1. **Don't widen `base_profiles`.** If you find yourself adding a fifth or sixth professional field, that's the signal to split off a child table instead.
2. **Treat `current_employer` and `current_title` as denormalized snapshots.** They're a convenience for the directory card. Once `work_history` exists, those fields mirror the most recent row. No code should treat them as the source of truth for employment history.
3. **Keep `base_profiles.updated_at` honest.** Bump it on every write so the existing `profile_refresh_prompts` cadence has something useful to compare against, even before the granular `*_confirmed_at` columns exist.

That's it. The expansion path is purely additive — new tables, new columns, no destructive migrations, no code rewrites in the launch surface.

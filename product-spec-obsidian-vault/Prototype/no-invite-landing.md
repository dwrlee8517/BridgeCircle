# No-invite landing — "You're signed in, the invite comes next"

**Status:** v1 draft · 2026-07-11
**Author:** _TBD_
**Maps to:** the sign-in rejection path in [auth/callback/route.ts](../../app/src/app/auth/callback/route.ts) and [(member)/layout.tsx](<../../app/src/app/(member)/layout.tsx>)
**Brand fit:** [voice-guidelines.md §3](../../docs/product/voice-guidelines.md) — the embarrassed asker; §9 permission-error class
**Companion specs:** [phase-1/spec.md](../Production/phase-1/spec.md) (invites base), [phase-1/user-flows.md](../Production/phase-1/user-flows.md)

---

## Purpose

Today, a verified Google sign-in that has **no invite and no membership** is treated as a failure: the callback signs the user out and bounces them to `/sign-in` with a red error banner ("We couldn't find an invite for this email. Ask your admin to send you one."), with the prose error string riding in the URL. The same rejection lives in a second place — the `(member)` layout guard — with identical copy.

That treatment is wrong for who this person usually is: a real alum who used the wrong Google account, signed in before the alumni office got to their batch, or heard about BridgeCircle from a classmate before receiving anything. They did nothing wrong, and they may be exactly the member we want. A red banner and a forced sign-out reads as *"you don't belong here"* — the opposite message from a product whose priority reader is the embarrassed asker.

This feature replaces the rejection with a **landing page**: the user stays signed in, lands on a calm page that explains BridgeCircle is invite-only, names the email they signed in with, and gives them real next steps — including (v1.1) asking their school for an invite without having to find and cold-email an administrator.

## North star

> The moment someone shows up without an invite is a recruiting moment, not an error. Treat it like the front porch, not a bounced badge scan.

## Proposed decisions (draft — to confirm before build)

| Decision | Choice |
| --- | --- |
| Session handling | **Keep the session.** No `signOut()`. The user is authenticated but memberless; every surface except this page and sign-out remains gated. |
| Route | `/request-invite`, rendered inside the `(auth)` editorial split layout. |
| Rejection copy transport | The no-invite case stops passing prose through `?error=`. Callback and member-layout guard both `redirect('/request-invite')`. |
| Visual register | **State, not error.** Ochre `state-warning` accent, never `destructive` red. Nothing failed. |
| v1.0 scope | Landing page + "Use a different email" (sign out → `/sign-in`) + guidance to find the invite email. |
| v1.1 scope | "Request an invite" form → `invite_requests` table → admin queue in `/admin/invites` with **Send invite** / **Dismiss**. |
| Dismissal visibility | **Silent.** The requester is never told a request was dismissed, and the page never promises a reply. (See §Two-sided buffer.) |

---

## User flow (v1.0 — landing only)

1. Member signs in with Google (or completes email/password sign-in) with an address that has no pending invite cookie, no membership rows, and no other lifecycle state (delete-grace, deactivated, pending approval all keep their existing branches).
2. Callback redirects to `/request-invite` **without signing out**.
3. Page shows (see §Copy and §Design):
   - who they're signed in as,
   - that BridgeCircle is invite-only and the school sends invitations,
   - that the invite may be waiting at a different address,
   - `Use a different email` (signs out, returns to `/sign-in`).
4. If an invite for this email arrives later, the standard invite email is the notification; the `/join` link plants the `pending_invite_token` cookie and the existing accept flow proceeds — the already-existing auth user is fine, `acceptInvite` links by `userId`.
5. Any attempt to navigate to a member route while memberless re-lands here (the `(member)` layout guard's final branch redirects here instead of signing out).

## User flow (v1.1 — request an invite)

1. From the landing page, member taps **Request an invite** (the single amber commitment on the screen).
2. Inline form: school (select from active organizations — pilot: Chadwick School, Chadwick International), full name, graduation year, optional one-line note ("Anything that helps the alumni office place you?" — 200 chars).
3. Submit → one `invite_requests` row per (organization, email), status `open`. Duplicate submits surface the existing request's state instead of erroring.
4. Confirmation replaces the form: calm, no promised timeline (see §Copy).
5. Admin sees an **Invite requests** section in `/admin/invites`: email, name, year, note, requested date. Actions per row: **Send invite** (pre-fills the existing invite send flow — admin may correct the email if school records use a different address) and **Dismiss** (silent).
6. Send invite → request status `invited`, the standard invite email goes out, and the normal `/join` flow takes over. Dismiss → status `dismissed`; requester sees no change.

### Two-sided buffer

Per the project rule, both sides get friction removed:

- **Requester:** never has to find, address, and compose a cold email to an administrator they don't know. One bounded form, written to the institution, not a person.
- **Admin:** receives a structured queue instead of cold inbound email; **Dismiss is silent and costs nothing socially** — no rejection message is generated, so admins never hesitate to clear a request that doesn't belong. Because the page never promises a reply, silence stays honest.

---

## Copy (voice-aligned)

Narrator: the thoughtful alumni coordinator. Register: warm, blameless, zero urgency. The §9 permission-error class is the anchor: *"This circle is private. The admin would need to invite you in."*

**Landing page (v1.0):**

> <small>INVITE-ONLY NETWORK</small>
>
> **We don't have an invite for this email yet**
>
> You're signed in as **dkoo.dev@gmail.com**. BridgeCircle is invite-only — your school's alumni office sends the invitations, and none has gone to this address.
>
> If you were expecting one, it may be waiting at a different email. Invites arrive from **bridgecircle.org** — the join link inside knows which address it belongs to.
>
> [Request an invite]  ·  [Use a different email]

**Request form intro (v1.1):** "Tell us where you belong and we'll pass it to your school's alumni office."

**Request confirmation (v1.1):**

> **Your request is with the alumni office.**
>
> If they send an invite, it will arrive at dkoo.dev@gmail.com. No need to check back here.

**Duplicate request:** "You've already asked — your request from Jul 8 is with the alumni office."

**Admin queue row (admin register — drier, denser):** `dkoo.dev@gmail.com · Daniel Koo · '15 · requested Jul 11 — "Was in Songdo through 2015."` Actions: `Send invite` / `Dismiss`.

Rules honored: sentence case; no exclamation marks; no "Submit" (button is "Send request"); no promised response time; the coordinator never says "denied," "rejected," or "error."

---

## Design intent (input for Claude Design)

Visual exploration happens in Claude Design against the synced design-system bundle. These are the product-level constraints the design must honor, not a layout prescription:

- **Shell:** lives in the existing `(auth)` split layout ([app/src/app/(auth)/layout.tsx](<../../app/src/app/(auth)/layout.tsx>)) — the same entry-moment framing as `/sign-in`, not a member-shell page.
- **State, not error:** the "no invite yet" condition uses `state-warning` (ochre) accents — never `destructive`/`accent-rust`. Nothing failed. Ochre stays border/dot/icon scale per the state-role rule.
- **Show the identity:** the signed-in email must be visible — it is the one fact that lets the person self-diagnose "wrong account."
- **CTA discipline:** `Request an invite` (and, once the form is open, `Send request`) is the single amber action on the viewport. `Use a different email` stays a quiet `action-primary` text action. In v1.0, with no request form, the page has **no amber at all**.
- **Form is inline, not modal** (v1.1); the confirmation replaces it with a single calm sentence — no card-of-cards nesting.
- **States to design:** landing (v1.0), request form open (v1.1), request confirmation, duplicate-request notice.

---

## Guardrails and security

- **Memberless sessions must read nothing.** Keeping the session means an authenticated-but-memberless user exists longer than today. RLS already scopes member data by membership, but this page's PR must include an `rls-auditor` pass plus a Vitest asserting a memberless session gets zero rows from member tables via the publishable-key client.
- **Route gating:** proxy/middleware and the `(member)` layout treat memberless sessions as allowed on `/request-invite`, `/cancel-delete`, `/reactivate`, `/onboarding` (pending branch), and sign-out only. Everything else redirects here.
- **No org disclosure:** the page and form must not reveal whether any email has an invite, is a member, or was dismissed. The org select lists only orgs that opted into public requestability (pilot: both Chadwicks; flag on `organizations` if needed later, hardcode for v1.1).
- **Abuse bounds:** `unique (organization_id, email)` caps rows; note field 200 chars; requests require an authenticated session (Supabase auth's own rate limits apply upstream). No CAPTCHA in v1.
- **Orphaned auth users:** first OAuth sign-in already creates an auth user + `users` row via the `on_auth_user_created` trigger (true today, too). Never-invited accounts now persist with a session; fold cleanup into the existing deletion sweep later — noted in Out of scope.

## Schema (v1.1, additive)

```sql
create table invite_requests (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  user_id          uuid not null references users(id) on delete cascade,
  email            text not null,
  full_name        text not null,
  graduation_year  int,
  note             text check (char_length(note) <= 200),
  status           text not null default 'open' check (status in ('open', 'invited', 'dismissed')),
  created_at       timestamptz not null default now(),
  resolved_at      timestamptz,
  resolved_by      uuid references users(id) on delete set null,
  unique (organization_id, email)
);
```

RLS: requester reads/creates own rows; org admins read and resolve rows for their org; no public reads. Grants follow the `grant_public_schema` defaults. Migration is additive — safe as one PR under the deploy-window rules.

## Edge cases

| Case | Handling |
| --- | --- |
| Invite exists but for a different email (mismatched `pending_invite_token`) | Callback's existing fall-through now lands here. Same copy — "it may be waiting at a different email" covers it without disclosing anything. |
| Invite is sent while the user sits on the page | Nothing live-updates. The invite email + `/join` link is the path; the page's copy points there. |
| Admin sends the invite to a corrected address | Fine — `/join` plants the cookie for whichever email the invite names; user signs in with that account. The original memberless auth user is eventually swept. |
| User signs out and back in, still uninvited | Lands here again. Idempotent, no error stacking. |
| Request then org later revokes/expires the invite | Existing invite lifecycle owns it; request row stays `invited` (historical). |
| Lifecycle states (delete-grace, self-deactivated, pending approval) | Unchanged — those branches fire before the no-invite branch in both guards. |
| Email/password sign-up path | Out of scope for v1 — password sign-up already requires the `/join` invite link; only the OAuth and returning-password sign-in rejection paths change. |

## Out of scope (v1)

- Auto-matching requests to school records or CSV rosters
- Notifying requesters of dismissal (deliberately never)
- Admin email digests for pending requests (in-app queue only; revisit with volume)
- Orphaned memberless auth-user cleanup sweep (fold into existing deletion sweep later)
- Public "request to join" marketing page for signed-out visitors
- Waitlist mechanics, referral codes, member-vouched invites

## Success metrics

| Metric | Definition |
| --- | --- |
| **No-invite landings** | Sessions reaching `/request-invite` per week. Today this is invisible — every one is a silent bounce. Baseline metric. |
| **Recovery rate** | Landings that reach an active membership within 14 days (any path: different email, invite arrives, request granted). Target: ≥30% in pilot. |
| **Request rate** (v1.1) | Landings that submit a request. Diagnostic. |
| **Grant rate** (v1.1) | Requests → `invited` / total resolved. Tells us whether arrivals are real alumni (high) or noise (low). |
| **Admin time-to-resolve** (v1.1) | Median days request → resolved. Target: <7. |

Analytics events: `no_invite_landing_viewed`, `no_invite_switch_email`, `invite_request_submitted`, `invite_request_resolved` (with `granted|dismissed`), following [user-flows.md](../Production/phase-1/user-flows.md) conventions.

## Risks

1. **Memberless-session data leak.** The whole feature rests on RLS being airtight for a session with zero memberships. *Mitigation:* rls-auditor pass + explicit memberless-session test in the PR; the page itself renders only `auth.email`.
2. **Request queue becomes admin burden.** Cold requests from non-alumni pile up. *Mitigation:* silent dismiss is one click; unique constraint prevents repeats; volume metric watches it.
3. **False hope.** A requester waits on an invite that never comes. *Mitigation:* copy never promises a reply or a timeline; the confirmation says "if they send an invite."
4. **Copy drift between guards.** The rejection lives in two code paths today and both must change together. *Mitigation:* both redirect to one route; the copy lives once, on the page.

## Implementation cut

| Layer | Work |
| --- | --- |
| v1.0 routes | `(auth)/request-invite/page.tsx` (needs session; renders email; sign-out action). Edit `auth/callback/route.ts` final branch + `(member)/layout.tsx` final branch: drop `signOut`, redirect here. Middleware/proxy allowlist. |
| v1.0 tests | Vitest: callback branch lands memberless users here; member-layout guard redirects here; memberless RLS read test. |
| v1.1 schema | One additive migration (table + RLS + grants), `pnpm db:types`. |
| v1.1 lib | `lib/invite/request.ts` (`createInviteRequest`, `resolveInviteRequest`) with injected deps, per `/lib` discipline. |
| v1.1 UI | Inline form on the landing page; **Invite requests** section in `/admin/invites` wired to the existing send flow. |
| v1.1 notifications | Admin in-app notification on new request, batched daily at most. |

**Effort estimate:** v1.0 ~1–2 days; v1.1 ~3–4 days including migration safety pass and copy review.

## Open questions

- Does an org need to opt in to receiving requests (a flag on `organizations`), or is hardcoding the two pilot Chadwicks acceptable until org #2 onboards?
- Should the landing page appear for the **mismatched-invite-email** case with variant copy ("your invite names a different address"), or is the generic copy enough? Generic assumed for v1.
- Sign-in error banner cleanup: other `error_description` cases still pass prose through the URL — worth normalizing to error codes while touching the callback, or separate change?
- Korean copy: pilot includes Songdo — this page is an entry surface; does it need the Korean voice guide before v1.1 ships? (Machine translation is forbidden.)

## Changelog

- **2026-07-11 — v1 draft.** Written after observing the production rejection path first-hand (Google sign-in with an uninvited email → red banner + forced sign-out). Scopes v1.0 landing page and v1.1 invite-request queue; decisions marked draft pending confirmation.

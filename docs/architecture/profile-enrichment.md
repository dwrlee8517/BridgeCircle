# Profile Enrichment And Freshness

This document is the approved architecture for onboarding enrichment and future
profile freshness. It supersedes older references that treated LinkedIn import
as OAuth-first, resume-first, single-provider, or sweep-via-LinkdAPI.

> **Current implementation boundary (2026-07-16):** onboarding Fast Fill is the
> only active product flow. It uses the provider registry, LinkdAPI primary,
> PDL fallback, explicit proposal review, and atomic apply. The provider
> adapters and normalized proposal types remain in the repository. Manual
> **Update from LinkedIn**, scheduled Bright Data sweeps, email-token proposal
> review, and auto-apply are future slices; their pre-v2 routes, cron callers,
> and direct profile-write helpers were removed during the destructive database
> v2 cutover. This document specifies those future flows but does not claim
> they are currently reachable.

## Product Principle

BridgeCircle should make profiles easy to keep current, but members must remain in control of what appears on their profile.

Rules:

- Use `BridgeCircle` as a trusted review layer, not a silent profile writer.
- Use a member-provided LinkedIn URL only for that member's own profile.
- Do not collect contact, demographic, address, birth date, salary, or other sensitive/personal enrichment fields for this workflow.
- Do not run first-party browser automation against linkedin.com.
- Store provider results as evidence and diffs, not as the canonical profile.
- Profile fields become canonical only after the user confirms them, edits them, or explicitly opts into auto-apply.

## Provider Architecture

Three providers, each in the slot it fits best. All three are self-service signup — no sales calls required for the pilot.

| Job | Primary | Fallback 1 | Fallback 2 |
|---|---|---|---|
| Onboarding (user pastes LinkedIn URL) | LinkdAPI | PDL | — |
| Manual **Update from LinkedIn** (profile edit, on demand) | LinkdAPI | PDL | — |
| Scheduled sweep (monthly change detection) | Bright Data Dataset Filter API | LinkdAPI (only after repeated misses) | PDL (last resort) |

The architecture uses each provider where it is strongest:

- **LinkdAPI** — live, structured, by-URL fetches. Cheap per call, fast, rich payload. Right tool for user-facing on-demand work where the user is waiting at the screen.
- **Bright Data Dataset Filter API** — bulk, pre-cleaned, normalized records pulled from a continuously-updated index of ~669M LinkedIn profiles. Right tool for cheap recurring change detection across the whole member base.
- **PDL** — aggregator-model person enrichment keyed by non-LinkedIn identifiers (name + email + grad year + last employer). Right tool when LinkedIn-based providers can't resolve a profile, and the cleanest legal/compliance story when procurement scrutiny matters.

LinkdAPI is no longer the sweep primary because its per-call cost doesn't scale, its data shape is heavier than the sweep needs, and concentrating recurring traffic on a single small provider creates a single point of failure. Bright Data's Dataset is cheap per record, returns pre-normalized fields that fingerprint cleanly, and survives any single-provider shutdown.

The manual button stays on LinkdAPI because the user is at the screen and expects live LinkedIn state, not a possibly-30-days-old dataset record. The sweep-to-manual fingerprint mismatch (sweep hashes from Bright Data's shape, manual fetches via LinkdAPI's shape) is solved by always hashing the manual fetch into the Bright Data fingerprint shape before diffing against `last_profile_fingerprint`, so the comparison stays apples-to-apples even though the underlying provider differs.

### Provider Interface

All three provider adapters are implemented behind a single abstraction. The
active application currently routes only onboarding through that abstraction.
Manual refresh and sweep orchestration must be rebuilt against the v2 schema
before those jobs are enabled; dormant provider adapters are not treated as
authorization to restore the removed pre-v2 callers.

```
EnrichmentProvider {
  fetchByLinkedInUrl(url): EnrichmentResult           // onboarding + manual update
  fetchSweepRecords(urls): SweepRecord[]              // scheduled sweep (batch)
  fetchByIdentity(name, email, gradYear, employer):   // last-resort when URL fails
    EnrichmentResult
}

LinkdApiProvider  implements EnrichmentProvider
BrightDataProvider implements EnrichmentProvider       // uses Dataset Filter API
PdlProvider       implements EnrichmentProvider
```

Active provider per job is config-driven, not code-driven. When LinkdAPI shuts down, swapping onboarding to PDL is a config flag change. At university scale, routing different members to different providers based on profile shape becomes a routing rule, not new code.

### LinkdAPI — onboarding and manual-update primary

- `GET /api/v1/profile/full` accepts a LinkedIn `username` or `urn`, so a pasted onboarding URL normalizes into a direct lookup.
- Returns structured work history, education, skills, headline, geo, and current positions.
- Default endpoint cost is documented as 1 credit per request. `profile/full`, `profile/full-experience`, `profile/education`, and `profile/skills` currently appear to use that default unless route costs change. Verify with LinkdAPI's endpoint-cost docs before implementation.
- Hobby tier: 120 credits per `$1`. 1,000 one-credit profile pulls ≈ `$8.33`.
- Sources: [LinkdAPI intro](https://linkdapi.com/docs/intro), [profile/full docs](https://linkdapi.com/docs?endpoint=%2Fapi%2Fv1%2Fprofile%2Ffull&folder=Profile), [endpoint costs](https://linkdapi.com/docs/endpoints-cost), [pricing](https://linkdapi.com/).

### Bright Data Dataset Filter API — sweep primary

- Marketplace Dataset Filter API: POST a list of LinkedIn profile URLs (up to 10,000 per call), get back matched records from the LinkedIn People Profile dataset.
- Dataset id: `gd_l1viktl72bvl7bjuj0`.
- Async flow: filter call → `snapshot_id` → poll → download snapshot via S3, webhook, or HTTPS.
- Per-record price: ~`$0.0025` at list rate. No `$250` minimum on the Filter API itself (the minimum applies to bulk-snapshot purchases, not per-query filtering).
- Subscription tiers (for future scale): −25% biannual, −50% quarterly, −80% monthly off list — relevant only at much larger volumes.
- Sources: [Filter Dataset API](https://docs.brightdata.com/api-reference/marketplace-dataset-api/filter-dataset), [Deliver Snapshot](https://docs.brightdata.com/api-reference/marketplace-dataset-api/deliver-snapshot), [Marketplace FAQs](https://docs.brightdata.com/datasets/marketplace/faqs), [LinkedIn Profiles dataset](https://brightdata.com/products/datasets/linkedin/profiles).

### People Data Labs — fallback for every job

- Person Enrichment is one credit per successful match.
- Free plan: 100 Person Enrichment credits per month. Sufficient for pilot-scale fallback if LinkdAPI fails on isolated calls.
- Pro plan: $98/month for 350 credits. Becomes relevant only if LinkdAPI shuts down and PDL takes over onboarding and manual updates.
- PDL is also the right tool when a member has no LinkedIn URL or only a sparse LinkedIn presence — its non-LinkedIn data sources cover populations the other two providers miss. This matters more at university scale than at pilot scale.
- Sources: [PDL plan types](https://support.peopledatalabs.com/hc/en-us/articles/27546010665115-Plan-types-Free-Pro-and-Enterprise), [PDL pricing credits](https://support.peopledatalabs.com/hc/en-us/articles/25794271805211-Pricing-credits).

## Onboarding Flow

Default onboarding path:

1. User reaches profile setup.
2. User may paste their own LinkedIn URL.
3. Server normalizes the URL into a LinkedIn username.
4. Server calls LinkdAPI `GET /api/v1/profile/full`.
5. If LinkdAPI fails or returns suspiciously low-quality data, server falls back to PDL keyed by the URL or by name + email + grad year.
6. BridgeCircle maps the result into the same import shape used by resume extraction.
7. User reviews career history, education history, skills, headline, city, current employer, and current title.
8. User can add, edit, delete, or decline every proposed field before saving.
9. User is asked whether BridgeCircle may help keep the profile fresh later.

Fields eligible for persistence (across providers — names differ per provider but map to the same import shape):

- provider record identifier (LinkdAPI `urn` / PDL `id` / Bright Data record id)
- LinkedIn `username` slug
- display name candidates
- `headline`
- location / `geo`
- current position (employer + title)
- full position history
- education history
- skills
- profile image URL if the user explicitly accepts it

Ignore or discard contact info, social metrics, recommendations, posts, follower counts, and unrelated LinkedIn activity for this onboarding flow.

Freshness consent options collected at the end of onboarding:

- `review_before_update` — default recommended option. BridgeCircle emails proposed changes for confirmation.
- `auto_apply_and_notify` — explicit opt-in only. BridgeCircle applies high-confidence professional updates and emails a summary.
- `manual_only` — no scheduled checks. The user can still click **Update from LinkedIn**.

Onboarding copy makes clear this is a convenience feature, not a claim of live LinkedIn API sync.

## Manual Update Flow

Profile edit includes an **Update from LinkedIn** action for an on-demand fresh fetch.

Flow:

1. User clicks **Update from LinkedIn**.
2. Server retrieves the current profile.
3. Server calls LinkdAPI using the saved LinkedIn username or URN.
4. If LinkdAPI fails or returns low-quality data, server falls back to PDL.
5. BridgeCircle normalizes the retrieved data into the same fingerprint shape the sweep uses (current company, current title, current location, most recent education institution) before diffing, so manual-vs-sweep comparisons stay apples-to-apples even though the live provider differs.
6. Server diffs the new fingerprint against `last_profile_fingerprint` and runs the same quality checks the sweep applies.
7. If no meaningful difference exists, show "No updates found."
8. If differences exist, show the review UI.
9. User confirms, edits, or declines the proposed changes.

The manual button is intentionally a *live* path through LinkdAPI rather than a dataset lookup. Users clicking the button expect their latest LinkedIn state, not a possibly-30-days-old dataset record. The Bright Data sweep is the *background* freshness pipeline; the manual button is the *on-demand* fresh fetch. Two cadences, two providers, communicated honestly to the user.

## Scheduled Sweep Flow

The scheduled sweep is the cheap, recurring change-detection layer. It is separate from onboarding and manual update.

Default cadence: **monthly** for the first pilot. Move to quarterly if email volume from monthly proposals turns out to be too high for users.

Workflow:

1. Job selects active members with `refresh_policy != manual_only` and a stored LinkedIn URL.
2. Server POSTs the URL list (up to 10,000 per call) to the Bright Data Marketplace Dataset Filter API against `dataset_id = gd_l1viktl72bvl7bjuj0`.
3. Bright Data returns a `snapshot_id`.
4. Server polls the Deliver Snapshot endpoint, then downloads the matched records.
5. For each returned record, server normalizes into a fingerprint:
   - `current_company` / `current_employer`
   - `current_title`
   - `current_location`
   - `most_recent_education_institution`
6. Server compares against the stored `last_profile_fingerprint`. Fingerprints are hashed from Bright Data record shape, not LinkdAPI, so sweep-to-sweep comparison stays apples-to-apples.
7. If unchanged: log the run, skip.
8. If changed and quality checks pass: create a `profile_change_proposals` row.
9. If a member's URL did not return a record (Bright Data corpus miss): log the miss but do not fall back immediately. Increment `consecutive_sweep_misses`. After three consecutive misses (~3 months), escalate that specific URL to a LinkdAPI fetch. If LinkdAPI also fails, escalate to PDL.
10. Email user with pending proposals.
11. Auto-apply only if the user explicitly selected `auto_apply_and_notify`.

### Dataset Refresh Lag

Bright Data's LinkedIn People Dataset refreshes on a rolling, per-record schedule that averages monthly but varies by record popularity and crawl priority. A real LinkedIn change made on day 1 could appear in the dataset anywhere from day 5 to day 60+, depending on Bright Data's re-crawl cadence for that specific profile.

Practical implication: the worst-case latency between a LinkedIn change and a BridgeCircle proposal email is roughly **60 days** (dataset crawl lag + sweep cycle). The average is closer to 30–40 days.

This lag is acceptable for the alumni-freshness use case. Job changes do not need same-week notification. Users who need fresher data click **Update from LinkedIn** on their profile, which routes through LinkdAPI (live) and bypasses the dataset entirely.

Each Bright Data record includes a `timestamp` field showing when that record was last crawled. Treat the distribution of `timestamp` values as a freshness-health signal — if the average `timestamp` age trends past ~45 days for the member base, consider tightening the sweep cadence, escalating priority profiles to a Live Scraper override, or revisiting the subscription tier.

### Quality Checks Before Trusting Provider Output

Before creating a proposal:

- LinkedIn URL still resolves to the same normalized username or stored URN.
- Name is present and sufficiently similar to the saved profile name.
- Current title and company are not empty when the previous profile had them,
  unless the provider supplies career history and every returned role has a
  real end date. In that case, preserve the member's existing current fields
  and let the ended roles proceed to review.
- Career and education arrays are parseable.
- The diff is not a total replacement caused by a partial provider response.
- Extraction does not contain obvious placeholder, redacted, or masked values.

Reject the proposal silently and log if any check fails. Better to miss a sweep than to surface a malformed proposal.

### Cost Guardrails

- Track per-provider credits and per-call costs in app tables; vendor dashboards are not the only source of cost truth.
- Cap PDL fallback calls per account per month. Start at 90, leaving headroom under the 100-credit free tier.
- Do not fire LinkdAPI on every Bright Data dataset miss. Use the three-consecutive-miss policy above so the corpus has time to grow into coverage naturally.
- Track Bright Data Filter API calls separately; alert if monthly cost exceeds expected sweep budget by >25%.

## User Review Emails

When a proposal is created, send an email with three actions:

- **Confirm** — applies the proposed changes.
- **Edit** — opens the review screen with proposed values prefilled.
- **Decline** — marks the proposal declined.

Email action links must use one-time signed tokens, expire, and be scoped to the target user and proposal.

If the user selected `auto_apply_and_notify`, send a notification email after applying the change with a link to undo or edit.

## Data Model Additions

Additive tables (provider-agnostic — column names should not bake in a vendor):

```
profile_enrichment_settings
  user_id (PK/FK)
  linkedin_url
  linkedin_username
  primary_provider_id           -- vendor-specific id (linkdapi urn, pdl id, brightdata id)
  primary_provider_name         -- linkdapi | pdl | brightdata
  refresh_policy                -- manual_only | review_before_update | auto_apply_and_notify
  refresh_interval              -- monthly | quarterly
  consented_at
  last_checked_at
  last_enriched_at
  last_profile_fingerprint      -- hashed from Bright Data record shape for consistency
  consecutive_sweep_misses
  created_at
  updated_at

profile_enrichment_runs
  id
  user_id (FK)
  provider                      -- linkdapi | pdl | brightdata
  purpose                       -- onboarding_import | manual_refresh | scheduled_sweep | sweep_miss_fallback | fallback_verification
  status                        -- succeeded | no_match | failed | skipped_cap | skipped_unchanged
  cost_units                    -- credits or successful records consumed
  fingerprint
  error
  fetched_at
  created_at

profile_change_proposals
  id
  user_id (FK)
  source                        -- linkdapi | pdl | brightdata | resume | manual
  status                        -- pending | accepted | edited | declined | auto_applied | superseded
  current_snapshot jsonb
  proposed_snapshot jsonb
  diff jsonb
  source_run_id (FK)
  confidence
  expires_at
  reviewed_at
  created_at
```

`base_profiles` remains the denormalized identity card. Rich career and education history can stay in existing JSONB columns during the launch slice, then move to child tables when search/ranking needs first-class row-level signals.

## Cost Model

### Pilot (1,000-member org, Year 1)

| Line item | Provider | Approx cost |
|---|---|---|
| Onboarding (1,000 profiles, one-time) | LinkdAPI (Hobby tier, 1 credit/profile) | ~$8 |
| Manual **Update from LinkedIn** (~3% of members/month) | LinkdAPI | ~$3/yr |
| Monthly sweep (12,000 lookups/yr) | Bright Data Filter API at list rate | ~$30/yr |
| Bright Data miss → LinkdAPI fallback after 3 consecutive misses | LinkdAPI | ~$10/yr |
| PDL fallback | PDL (free tier, 100 credits/month) | $0 |
| **Steady-state Year 1 total** | | **~$50** |

### If LinkdAPI shuts down

All LinkdAPI work falls to PDL; sweep continues unchanged on Bright Data; miss escalation also routes to PDL but only after the three-miss policy.

| Line item | Provider | Approx cost |
|---|---|---|
| Onboarding (1,000 profiles, one-time) | PDL Pro tier | ~$280 one-time |
| Manual updates (~3%/month) | PDL | ~$100/yr |
| Monthly sweep continues | Bright Data | ~$30/yr |
| Long-tail miss escalation | PDL | ~$30/yr |
| **Post-failover Year 1 total** | | **~$440** |

In either scenario the cost is bounded and the freshness loop survives a provider shutdown without an architectural rewrite. The swap is a config flag change.

## Scale-Out Considerations

At university scale (~250K members, decades of alumni), the architecture stays the same but the *primary* role for each provider may shift. None of this changes the pilot plan — it sketches what the same architecture does under load.

- **Sweep**: Bright Data Subscription becomes attractive (up to 80% off list rate via monthly refresh subscription). At 250K × 12 × ~$0.0005 ≈ $1,500/year, the per-record economics dominate. LinkdAPI's pay-per-call pricing stops being competitive for sweep at this volume.
- **Onboarding and manual update**: LinkdAPI's per-call pricing is still viable, but Bright Data Dataset Filter API does the same job at comparable quality. The choice becomes procurement preference and legal-posture story, not cost.
- **PDL becomes primary for LinkedIn-inactive alumni**: at a university spanning decades, the LinkedIn-inactive segment (older alumni, certain industries, certain regions) is a meaningful population. PDL's non-LinkedIn data sources cover this segment where LinkdAPI and Bright Data return little. Route by profile shape, not by "fallback after failure."
- **Tiered freshness**: not all alumni are equally worth refreshing monthly. A reasonable scale-up policy is monthly for tier 1 (recent grads, active mentors, advancement targets), quarterly for tier 2 (engaged but not active), and annual or on-demand for tier 3 (decades-old, low engagement). The `EnrichmentProvider` interface supports per-member routing from day 1 so tiering becomes a routing-rule change, not new code.

## Enabling the Monthly Sweep in Production

The sweep code ships disabled by default. To turn it on once the production
Next.js app is reachable at a stable URL, do these one-time steps in the
production Supabase project.

1. **Set the shared secret on the app side.** Add a random 32+ char token to
   the production app's env (`SUPABASE_FUNCTIONS_INTERNAL_TOKEN`). The cron
   API routes (`/api/cron/enrichment-sweep-start`, `/api/cron/enrichment-sweep-poll`)
   reject any request whose `Authorization: Bearer <token>` header doesn't
   match this value.

2. **Store the same secret in Supabase Vault** so pg_cron can read it without
   hardcoding it in cron definitions:

   ```sql
   select vault.create_secret('paste-the-same-32-char-token-here', 'sweep_token');
   select vault.create_secret('https://app.bridgecircle.org', 'app_base_url');
   ```

3. **Enable the extensions** (one-time per project):

   ```sql
   create extension if not exists pg_cron;
   create extension if not exists pg_net;
   ```

4. **Schedule the two cron jobs**:

   ```sql
   -- 1st of each month, 09:00 UTC: start a new Bright Data snapshot.
   select cron.schedule(
     'enrichment-sweep-monthly',
     '0 9 1 * *',
     $$
     select net.http_post(
       url := (select decrypted_secret from vault.decrypted_secrets where name = 'app_base_url')
              || '/api/cron/enrichment-sweep-start',
       headers := jsonb_build_object(
         'Authorization',
         'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'sweep_token'),
         'Content-Type', 'application/json'
       ),
       body := '{}'::jsonb
     );
     $$
   );

   -- Every 5 minutes: drain any pending snapshots.
   select cron.schedule(
     'enrichment-sweep-poll',
     '*/5 * * * *',
     $$
     select net.http_post(
       url := (select decrypted_secret from vault.decrypted_secrets where name = 'app_base_url')
              || '/api/cron/enrichment-sweep-poll',
       headers := jsonb_build_object(
         'Authorization',
         'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'sweep_token'),
         'Content-Type', 'application/json'
       ),
       body := '{}'::jsonb
     );
     $$
   );
   ```

5. **Verify**: `select * from cron.job;` should show both rows. The first
   sweep won't fire until the next month boundary, but you can trigger it
   manually with `select cron.schedule(...);` or `select net.http_post(...);`
   directly. The poll job fires within 5 minutes.

To pause the sweep without losing config, `select cron.unschedule('enrichment-sweep-monthly');`
and re-run the schedule block above when ready.

## Non-Goals

- No first-party browser automation against linkedin.com.
- No enrichment of other people's LinkedIn URLs.
- No contact enrichment for outreach.
- No silent overwrite unless the user explicitly chose auto-apply.
- No dependency on LinkedIn OAuth for career history or education history.
- No claim of "live LinkedIn sync" in onboarding copy — the sweep is monthly, the manual button is live.

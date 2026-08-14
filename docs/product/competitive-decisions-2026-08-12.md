# Competitive Decisions — 2026-08-12

Desk research only, no vendor calls or demos. Six research blocks: self-audit of our own code, a
seven-query discovery benchmark across six vendors, a school-side feature inventory, review mining
(~330 dated reviews), the school systems and free substitutes a buyer already owns, and a movement
scan since May 2026.

**How to read the verdicts.** Every capability gets one of three: **STRENGTHEN** (behind in a way
that costs us a member or a deal), **LEAVE ALONE** (at parity; more investment is waste),
**DON'T BUILD** (serves a job we've declined, a third party does it better, or nobody uses it).

**Confidence note.** Nobody obtained a logged-in session on any incumbent. Five of six vendors'
findings are *documentation about the UI*, not the UI. The exceptions are Studiously — whose
shipped client code is public and was read directly — and Hivebrite, whose OpenAPI spec (181 paths,
126 schemas) is public. Weight accordingly. Claims are marked observed vs inferred throughout the
block outputs.

---

## 1. The five findings that change decisions

**1. The category stores career history and lets nobody search it.** Five of six vendors store
multiple dated past roles. **Zero expose a member-facing filter over them, and zero model a career
trajectory.** Graduway says so explicitly — filters are scoped to "current Company, Industry and Job
Function." Almabase's own docs: "Past roles are visible on the full profile, not the card."
Hivebrite has `Experience.from`/`.to` and admin-API date filters and still gives members no
"formerly X, now Y" operator. Across the whole category, past history is something you read one
profile at a time.

This is the cheapest defensible wedge found. We already store relational dated history
(`profile_experiences`), and our directory filter already reaches into past roles via an `exists`
subquery. **We are one query-layer away from something no competitor offers.** The honest caveat:
if it's cheap for us it's cheap for them — this is a product-concept gap, not a technical moat.
It has persisted for years, which is evidence it's not on anyone's roadmap, not evidence it can't be.

**2. Nobody can express three of the four jobs you named.** Lateral/peer matching with background
nuance ("mechanical engineer from a non-engineering background") is expressible at **zero of six** —
no negation operator, no similarity endpoint, no model of *background* as distinct from current
state. Future-intent location ("moving to Seoul in September") is **zero of six** — not one vendor
has a relocation or target-city field. Timing ("who can look at my resume *this week*") is **zero of
six** — every vendor models capacity as a static counter, never a calendar. These are your stated
use cases and they are white space.

**3. Directionality is real and it's structural at the strictest vendor.** Four of six force a role
pair. Hivebrite is the hardest case: `MentorProfile` and `MenteeProfile` are separate objects keyed
to a `mentoring_program_id`, and `Relationship` is one directed edge — verified at schema level, with
no symmetric object and no community-wide "willing to help" flag on `User`. Lateral matching there
isn't unbuilt, it's **unexpressible without a migration**. ADR 0011 D1's claim that direction-neutral
matching "falls out of the single type for free" is confirmed as a genuine structural advantage.
Nobody had written it down as one.

**4. A direct competitor entered your exact segment seven months ago.** **Studiously**
(studiously.ai) pivoted to independent-school alumni in mid-January 2026. Their tagline is your
thesis nearly verbatim — "67% of alumni would mentor, almost nobody asks" — and their positioning is
"built specifically for independent K-12 schools, not adapted from a university tool." They ship
Veracross integration, RE NXT SKY API import, ~14-day implementation, and a **real hybrid search**:
an LLM parses the natural-language query into structured filters, falling back to OpenAI embedding
similarity when confidence is low. That is verified from their deployed client bundle, not marketing.
Section 8 covers what to do about them.

**5. School-side is where we're furthest from our own ambition.** You called School a surface to win
on. It is currently our weakest area by a distance: announcements are publish-immediately-to-everyone
with no scheduling, segmentation, edit, or delete; **newsletter has read-only RPCs and no authoring
path at all** — issues can only be inserted by hand via SQL; there is no open/click/bounce tracking;
and notification emails carry no content ("Your school posted a new announcement" plus a link).
Meanwhile segmentation and per-campaign open/click reporting are shipped by Almabase, ToucanTech,
and Hivebrite, and are part of the assumed floor.

---

## 2. The decision table

| Capability | Job | Us | Leaders | Gap | Verdict | Size |
|---|---|---|---|---|---|---|
| Past-role / trajectory search | J3 | data yes, query no | **0/6 expose it** | concept | **STRENGTHEN** | S |
| Lateral / peer matching | J3 | falls out of one ask type | 0/6 | structural (theirs) | **STRENGTHEN** (surface it) | S |
| Future-intent location ("moving to X") | J2 | absent | 0/6 | none | **STRENGTHEN** | S |
| Location normalization (place hierarchy) | J2 | free-text `city`, `ilike` | metro/city buckets 5/6 | ours | **STRENGTHEN** | M |
| Radius / proximity search | J2 | absent | **0/6** | none | **DON'T BUILD** | — |
| Helper protection (caps, pause, decline-note) | J4 | strongest found | 1/6 partial | structural (ours) | **LEAVE ALONE** | — |
| Anonymous-until-accept | J4 | circle asks | 1/6 (Protopia, higher-ed) | ours | **LEAVE ALONE** | — |
| Broadcast / open ask | J4 | circle asks | 1/6 (Protopia) | ours | **LEAVE ALONE** | — |
| Match explainability | J1–J3 | templated, thin | **0/6** | concept | **STRENGTHEN** | S |
| Semantic / NL search | J1–J5 | built, **gated on API key** | 1/6 (Studiously) | ours | **STRENGTHEN** | S |
| Warm-network scoring (ADR 0009 step 4) | J1–J3 | **unimplemented** | 0/6 | ours | **STRENGTHEN** | M |
| Directory pagination | J1 | 50-cap, no offset | all paginate | ours | **STRENGTHEN** | S |
| Announcement scheduling + segmentation | J5, J6 | absent | 3/6 solid | ours | **STRENGTHEN** | M |
| Newsletter authoring | J5, J6 | **absent** | 3/6 | ours | **STRENGTHEN** | M |
| Email open/click reporting | J6 | absent | 3/6 | ours | **STRENGTHEN** | M |
| Event check-in + admin roster export | J5, J6 | absent | 3/6 | ours | **STRENGTHEN** | S |
| Event waitlist | J5 | **shipped** | Hivebrite lacks it | ours | **LEAVE ALONE** | — |
| Recurring events | J5 | absent | ~0/6 documented | none | **DON'T BUILD** yet | — |
| Bidirectional CRM sync (RE NXT / Veracross) | J6 | absent | Almabase strong | **deal gate** | **STRENGTHEN** | L |
| Production analytics | internal | **stub, discards events** | shallow everywhere | ours | **STRENGTHEN** | M |
| Admin-facing engagement dashboards | J6 | minimum | shallow at all 5 | none | **LEAVE ALONE** | — |
| Class-year / cohort browsing | J5 | solid | 6/6 table stakes | — | **LEAVE ALONE** | — |
| Invite lifecycle (resend/revoke/TTL) | J6 | solid | pain point elsewhere | ours | **LEAVE ALONE** | — |
| Marketed "AI matching" | — | — | 5/6 market it | — | **DON'T BUILD** (as a claim) | — |
| Bolt-on mentoring module | J4 | is the product | dead weight elsewhere | — | **DON'T BUILD** | — |
| Job board | — | absent | shipped, unused | — | **DON'T BUILD** | — |
| Engagement scoring | — | absent | shipped, unused | — | **DON'T BUILD** | — |
| Social feed / activity wall | — | absent | shipped, unused | — | **DON'T BUILD** | — |
| Multi-language | — | absent | only ever a failure | — | **DON'T BUILD** | — |
| Video messaging | — | absent | 1 review portfolio-wide | — | **DON'T BUILD** | — |
| Giving forms, gift receipting, donor pipeline | — | absent | 4/6 cross the line | declined job | **DON'T BUILD** | — |
| Native mobile app | — | responsive web | liability at 4/5 | — | **DON'T BUILD** now | — |
| Data enrichment from a broker | J1 | absent | Studiously only | consent cost | **DON'T BUILD** — see §8 | — |

---

## 3. STRENGTHEN — ordered by job importance ÷ effort

**Tier 1 — small, and they turn existing assets into differentiators.**

1. **Expose past-role search in the member UI.** The data is relational and dated; the directory
   filter already reaches it; the free-text index doesn't. Add past employer/title to
   `directory_search_vector` and give the query layer a "formerly" concept. Zero of six competitors
   can answer this.
2. **Add a future-intent location field.** "Moving to Seoul in September." One field, one facet.
   Zero of six have it, and it's one of your four named jobs. Cheap enough that the only reason not
   to is if J2 isn't real.
3. **Turn semantic search on and index the directory.** Everything semantic is gated behind
   `VOYAGE_API_KEY`; without it, matching silently degrades to plain tsvector. The People directory
   *accepts* a query embedding and **no caller ever passes one** — semantic directory search is dead
   code today. Also: no ANN index (`ivfflat`/`hnsw`) exists on the embedding column, so vector
   retrieval is a sequential scan. Fine at 500 members, not at 50,000.
4. **Ship real match explanations.** We currently render `'Speaks to ' || topics[1]` or fall back to
   the headline. An LLM `match_explanation` task exists and the API returns the templated string
   instead. **Zero of six competitors explain a match at all** — where scores exist they are
   admin-only (Graduway's 25% threshold, Almabase's ≥5-with-2-attributes email scorer). This is
   free differentiation sitting behind a wire that isn't connected.
5. **Directory pagination.** Hard-capped at 50 with no offset parameter. Degrades badly the moment a
   real alumni body loads.
6. **Event check-in and an admin attendee roster/export.** `listEventAttendees` exists but is wired
   only into the member page, never the admin console. Both are part of the assumed floor.

**Tier 2 — medium, and they're the price of your School call.**

7. **Announcement scheduling, segmentation, edit, delete.** Currently one publish-to-everyone form.
   Segmentation by class year / region / interest is floor-level at three competitors.
8. **Newsletter authoring.** Tables and statuses exist; there is no create/edit/publish path and no
   `/admin/newsletter` route. The member-facing reader exists with no publishing back end — exactly
   inverted from what an alumni office buys.
9. **Email open/click/bounce tracking, and put real content in notification emails.**
10. **Location normalization.** `city text` matched by `ilike '%…%'`, plus a same-city badge using
    exact `lower()` equality. "Seoul" will not match "Seocho-gu" or "Greater Seoul"; "SF" will not
    match "San Francisco". Target the normalized place hierarchy that Hivebrite and Studiously use —
    **not radius** (see §4).
11. **Production analytics.** `track.ts` returns early in production with the comment "drop on the
    floor until the events table lands"; there is no `analytics_events` table. Build it **for
    ourselves, not for the buyer** — see §5.
12. **Warm-network scoring.** ADR 0009 step 4 — shared school, cohort proximity, shared city, major,
    relationship path, response likelihood — is entirely unimplemented. Location and cohort do not
    influence Ask matching at all today. The differentiator is the part that isn't built.

**Tier 3 — large, and it's the only true deal gate.**

13. **Bidirectional CRM sync, Blackbaud/RE NXT first.** This is the one capability with both a
    documented hard blocker and a documented acquisition driver. The lowest-rated review in the
    entire corpus (1.5★, PeopleGrove) is about exactly this: "There is no way to get the data out of
    people grove in a manner that allows you to update your crm - RENXT." And Almabase's inbound
    switching is almost entirely schools displaced from discontinued Blackbaud modules — Blackbaud
    retired NetCommunity and **partnered with Almabase** rather than rebuild. Studiously already
    ships Veracross + RE NXT SKY API. Integration is on-thesis: `market-analysis.md` already says
    "not a CRM replacement — we integrate, we don't replace."
    **Gated on open question 1: what does Chadwick actually use?**

---

## 4. DON'T BUILD — with the evidence

**Radius / proximity search.** Zero of six support it for members. The one instance of radius in the
entire category is Almabase's admin-only Data Studio "AREA" filter. More decisive: **no reviewer
anywhere complains about geography.** Hivebrite's map is among its *most-praised* features across
G2/Capterra, despite having no lat/long field anywhere in its 126-schema spec. The weakness is
visible in data models and vendors' own help desks — Princeton's FAQ documents "I looked up Newark,
New Jersey, but results also show alumni in Newark, Delaware" — but not in buyer sentiment. Normalize
place names; don't build distance math, and don't pitch "their geography is broken."

**Marketed AI matching.** Graduway: **zero mentions across 45 reviews** despite G2 tagging it with
"AI Copilot," "AI-based Matching," "Generative AI." Almabase: **zero mentions across 76 reviews**.
PeopleGrove: one unelaborated mention. The single exception is Hivebrite's Orbiit integration, which
is named and praised twice — notably a *third-party* matching product, not native AI. Build matching
because it works; never make it the claim.

**A bolt-on mentoring module.** ToucanTech: zero mentions in 70+ reviews. Hivebrite: one, from 2021.
Almabase: two, both 2021. Mentoring is only ever discussed at the two vendors where it *is* the
product. A mentoring module attached to an engagement platform is dead weight.

**Job board, engagement scoring, social feed, multi-language, video.** All shipped by multiple
vendors, all essentially absent from reviewer prose. PeopleGrove's job board appears only as an admin
*burden*: "proving timely to manage." Gravyty's Gratavid has one G2 review across the entire
portfolio. Multi-language is discussed at exactly one vendor and only as a failure — which also
confirms Daniel's July correction that Songdo needs no Korean copy.

**Giving forms, gift receipting, donor pipeline.** Declined job, and the research gives a clean line
to hold: **event ticketing payments are communications-side — all four all-in-one vendors treat them
so — but the moment a payment is a *gift* (receipting, donor records, CRM sync for prospect research)
you are in advancement-CRM territory.** That sentence is more defensible than "no fundraising, ever,"
and it survives a customer pushing.

**Native mobile app.** Mobile is a liability at four of five vendors — Graduway's app is a bookmarked
website, PeopleGrove's doesn't load ("Nothing fully loads, I just get spinning wheels," Mar 2026).
Note the counter-evidence honestly: "I need a true app" is Graduway's most-repeated recent member
complaint, and Hivebrite's rebuilt mobile-first app drew genuine praise. Not now; revisit after the
pilot.

**Recurring events.** Essentially undocumented across all six. Real white space, but no demand
evidence and it isn't one of your jobs. Note and move on.

---

## 5. LEAVE ALONE

**Helper protection.** We have the most complete set found anywhere outside Protopia: five active
asks per asker, per-helper pending caps, manual pause, **auto-pause after three consecutive
timeouts**, a *mandatory* decline note enforced by a check constraint, topic scoping, and
anonymous-until-accept on circle asks. Compare: Studiously has **one-click opt-out and nothing
else** — no cap, no pause, no accept/decline handshake, no anonymity. Hivebrite is worse than
nothing: its AI agent publicly @-mentions candidate helpers who never consented, converting a private
silent decline into a public one. PeopleGrove has the only real primitives among incumbents
(audience scoping, per-meeting-type caps) buried five clicks deep. This is genuinely ours. Don't
add to it; make sure the pitch says it.

**Admin engagement dashboards.** Shallow reporting is the most universal complaint in the category —
current at four of five vendors — and it is **irritation, not rejection**. Nobody churns over it.
Our five attention queues and six-value pulse are adequate. Do not build a BI product.

**Class-year browsing, invite lifecycle, event waitlist.** At or above parity. Invite resend/revoke
is a documented pain point elsewhere that we already shipped past.

---

## 6. Where competitors beat us

Stated plainly, because no competitive document is credible without this section.

- **LinkedIn beats us at raw discovery.** Its Alumni tool covers "who works in X" and "who lives in
  Y" well and free. Our discovery has to win on what LinkedIn structurally cannot do — verified
  affiliation, declared willingness to help, past-role trajectory, school-scoped privacy — not on
  being a better directory.
- **Studiously's search is ahead of ours today.** Shipped LLM query-parse plus embedding fallback,
  live. Ours is built but switched off.
- **Studiously and Almabase have solved data density; we haven't.** LinkedIn never backfills work
  history at *any* vendor (Almabase imports name/email/photo only and says so). Studiously buys
  density from People Data Labs and puts alumni in the directory opt-out. Almabase syncs from the
  school's CRM. We depend entirely on members self-reporting. **An empty directory answers no query
  well, however good the query layer is.**
- **Almabase's events and email are materially deeper** — ticket types, deferred payments, POS
  check-in kiosks, deliverability management, per-campaign open rates.
- **ToucanTech owns the K-12 relationship layer** — 30+ named independent schools, an ST4S
  safeguarding badge, 4.9/151 reviews with zero below three stars, and a live displacement play
  against bankrupt Anthology Encompass.
- **Hivebrite published real pricing on 2026-08-07** ($895/mo Core, $1,995/mo Flex). Your
  transparent-pricing moat is real but no longer unique, and the window is narrowing.

---

## 7. What this research cannot tell you

**You have no user evidence, and this isn't a substitute for it.** Pre-launch, no members, analytics
stub discarding events. Everything above is inference from competitor artifacts and other schools'
buyers.

**"The leaders have it" stayed weak evidence throughout.** CASE 2024 puts alumni engagement at
19–20%, flat for three years; Gravyty's own cited stat says 62% of alumni get little or no career
value. The incumbent feature set coexists with category-wide failure at the outcome. That's why the
don't-build list is as long as the strengthen list.

**Review sites systematically under-sample detractors.** ToucanTech has zero reviews below three
stars out of 180+. Across ~330 reviews on five vendors there is **almost no churn evidence** — every
"switched from" points inbound. The absence of rejection evidence is not evidence nothing gets
rejected; it means the four gates in §3 tier 3 and the setup/price findings are the only
rejection criteria the data actually supports.

**Four vendors' help centers are gated or closed**, so several claims rest on indexed snippets of
articles nobody could open. PeopleGrove's Zendesk went fully gated during the research.

**Not answered, by design (no demos):** real quoted pricing for a Chadwick-sized org; how any of
these products feel to use; whether Studiously renders its `interpretation` and `strongCount` fields
to members; whether Hivebrite/Almabase/Graduway employer filters return people who *left* an employer.

---

## 8. The Studiously problem

They are the only direct competitor in the segment, roughly a quarter ahead on go-to-market, and
they have correctly named the problem out loud. Three things are true at once:

**They're ahead on** search (shipped hybrid LLM + embeddings), data density (People Data Labs
enrichment plus an opt-out roster, so classmates are present without signing up), school-system
integration (Veracross, RE NXT SKY API, ~14-day implementation), and SEO — they publish dated
comparison pages against Graduway, Hivebrite, and Almabase.

**They're behind on** exactly the things we're strongest at. Their entire helper-protection model is
**one opt-out lever**: no capacity cap, no pause, no topic scoping, no accept/decline handshake, no
anonymity. An alum in their directory is searchable and reachable by any permitted student, and the
only recourse is total withdrawal. They have no matcher at all — one directory, one search, nothing
pairs people. Past roles are stored but capped at five and show no evidence of being searchable.
Lateral/peer matching is absent. And their international geography **collapses to country level** —
Seoul exists only as a tag on the country node `intl_kr`, while US locations get proper metros.
For a two-campus school with Songdo in the first launch, that is a concrete, demonstrable gap.

**They carry risk we don't.** Two founders, no third employee found, no funding announcement, no
named customers, no help center, founding-customer pricing with a cohort close. And their model has
a real consent problem a school's counsel will find: alumni are placed in the directory, enriched
from a third-party data broker, *before* they consent, with the legal burden on the school as
controller — and school admins can read message content between students and alumni.

**The read:** they took the asker's side of the barrier and left the helper's side unprotected.
Protopia solved the helper's side and won't sell to K-12 — bootstrapped, hiring one part-time
marketer, and their own boilerplate says "built exclusively for higher education." **Nobody has
built symmetric barrier reduction for K-12.** That is the two-sided framing in `AGENTS.md`, it is
already in our schema, and it is the thing to hold.

---

## 9. Next actions

1. **Answer: what does Chadwick use today** for alumni events, announcements, and the alumni
   database? One sentence. It gates the CRM-sync decision (§3 tier 3), the largest item on the
   list, and it names the real incumbent in the only live deal. If it's Veracross, Studiously
   already has the integration.
2. **Decide whether the analytics stub is in scope before the pilot.** Every judgment in this
   document becomes re-decidable with real data the moment members exist.
3. **Decide the giving line** using §4's formulation — ticketing payments yes, gifts and donor
   records no — and record it. It's more defensible than "no fundraising ever."
4. **Split tiers 1–3 with Daniel.** Tier 1 is six small items that convert existing assets into
   differentiators; tier 2 is the price of the School call; tier 3 is one large gated item.
5. **Fold this into `competitive-research.md`** and mark the May findings superseded rather than
   deleting them. Vault decision notes under handle `richard` for the giving line and anything else
   here that becomes a standing commitment.

---

*Blocks: self-audit (code) · discovery benchmark (6 vendors × 7 queries) · school-side inventory ·
review mining (~330 dated reviews) · school systems + free substitutes · movement scan since May 2026.
Full block outputs available on request; per-claim URLs and observed/inferred markers live there.*

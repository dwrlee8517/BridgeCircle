# Screen coverage map

Behavior source: [`../uploads/FLOWS.md`](../uploads/FLOWS.md), especially §0,
§4, §7, §7b, and §8.

## People and Profile — first slice

| Area | Route / state | Mockup | Status | Coverage |
|---|---|---|---|---|
| Gallery | review index | `index.html` | draft | switches between all first-slice screens |
| People | `/people` default/results | `people-directory.html` | draft | search, scope, filters, 50-result relevance cap, desktop 20-per-page pagination, mobile 20 / 20 / 10 load-more flow, result rows, and direct profile routing |
| People | row relationship states | `people-directory.html` | draft | Message, Connect, Pending; one action per row |
| People | result selection | `people-directory.html` | draft | row or member name opens the full profile on every viewport; Message / Connect / Pending remain independent; closing restores query, scope, page, and member position |
| People | no results / loading / failure | `people-directory-system-states.html` | draft | calm recovery copy, skeleton rows, retry, clear-filter, and directory-return actions |
| Profile | other member | `people-profile-overlay.html` | draft | section-led facts, expandable LinkedIn-style experience bullets, state-aware Message / Connect / Pending actions, conditional helping and contact visibility |
| Profile | Connect intro | `people-profile-overlay.html?connect=1` | draft | quick hello and conversational intro modes in an in-place panel |
| Profile | safety actions | `people-profile-overlay.html` | draft | private Report, confirmed Block, and relationship-aware confirmed Disconnect with completion states |
| Profile | unavailable states | `people-profile-system-states.html` | draft | gone, permission-denied, and blocked states with calm section-root recovery |
| Profile | self | `profile-self.html` | draft | same profile anatomy, inline edit entry points, helping mirror |
| Profile | enrichment review | `profile-self.html` | draft | approve/dismiss owner-only proposed updates |
| Profile | link visibility | `profile-self.html` | draft | Public, Circle, Private per item |

## States still required before approval

| Area | State | Planned artifact |
|---|---|---|
| Responsive | collapsed 72px rail | responsive state in every first-slice file |
| Mobile | remaining narrow-layout adaptations | direct profile routing and selected-member return are covered; remaining first-slice screens still deferred |

## Engineering handoff fields

Before a screen becomes `approved`, add its production route/component owner,
data dependencies, analytics events, and acceptance checks to this table.

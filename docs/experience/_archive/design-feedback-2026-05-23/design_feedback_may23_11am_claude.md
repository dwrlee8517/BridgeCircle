# Senior UX/UI evaluation — BridgeCircle

_Captured 2026-05-23, against the app at `localhost:3000` and the Civic Editorial design system in `docs/experience/`._

## What's working (so the critique below isn't read in a vacuum)

- **Distinctive editorial voice.** Fraunces serif headlines + mono microlabels + Electric Sky on Platinum Bone gives the product an identity that doesn't look like every other SaaS. That's rare and valuable.
- **The design-system *thinking* is already excellent.** [`tokens.md`](experience/ui/design-system/tokens.md) and [`components.md`](experience/ui/design-system/components.md) are unusually disciplined — role tokens (`request-attention`, `match-signal`, `mentor-open`), explicit contrast pairings, density tiers, motion recipes. Most of the issues below are *the live UI drifting from your own docs*, not the docs being wrong.
- **The "Why this match" + "Suggested first ask" pattern on [MatchBriefCard](../app/src/app/(member)/help-network-ui.tsx:163)** is the single best UX idea in the product. It lowers the activation energy of cold outreach. Protect it.

---

## The biggest problem: too many things claiming "primary"

Open the home screen at 1440px. Try to answer: *what does this product want me to do right now?* Five things are competing:

1. The 7xl serif headline "Ask your school circle."
2. The AskBar with a bright blue "Find people" CTA.
3. Six prompt chips below the AskBar.
4. Three "0 / 6 / 3" stat cards with serif numbers and arrow affordances.
5. The dark Midnight panel restating *the same three stats* with bigger serif numbers.

The page has no single dominant decision. The contract itself says it: [`components.md:88`](experience/ui/design-system/components.md:88) — *"Every screen should have at most one visually dominant primary action per local decision area."* The home page has at least three.

**Concrete fix:**
- The AskBar should win. Make it the visual anchor (`shadow-2xl` + a slightly larger height, ~92px) and pull it physically *above* the dark motif on desktop, not beside it.
- Demote the headline to display-md (28px) — at the current 72px it bullies the AskBar even though the AskBar is what you want clicked.
- Kill the three stat tiles on the left **or** the three stats inside the Midnight panel. Showing `6 open helpers` twice within 600px of each other is duplication, not emphasis.

---

## The "Live school circle" Midnight panel is decoration pretending to be a card

The dark `NetworkMotif` shows up on Home, Ask, Help, and School ([help-network-ui.tsx:83](../app/src/app/(member)/help-network-ui.tsx:83)) with the same headline ("A trusted map of people who can help…") and roughly the same stats. Three observations:

1. **It violates the contract.** [`components.md:24`](experience/ui/design-system/components.md:24): *"Cards are decision surfaces. Do not use cards as page section wrappers or stack cards inside cards…"* The motif is a marketing card — it doesn't drive any decision, and it's repeated on multiple pages.
2. **The SVG path doesn't mean anything.** Five dots on a sine wave is generic. Either make the motif read live data (actual member positions, e.g. a stylized cohort/city scatter) or remove it.
3. **It eats ~30% of above-the-fold on the most important screen.** Real estate that could show *who's actually waiting on you*.

**Concrete fix:** Use Midnight as an **entry moment** (sign-in, first-run home, empty states), not as recurring page furniture. The docs already say this: [`tokens.md:264`](experience/ui/design-system/tokens.md:264) — *"Do not use Midnight for ordinary cards, tables, sidebars, or dense member workflows."* The product is breaking its own rule.

---

## The numbered nav (`01 Ask  02 Help  03 People …`) costs more than it earns

I respect the editorial gesture, but:

- Numbers imply sequence. These aren't sequential — they're parallel destinations. A new user looking at "01 Ask · 02 Help" will reasonably guess they should *start with Ask*. That's wrong — most members will live in /inbox.
- The numerals are mono-xs (~9px); they're sub-readable noise next to the labels.
- They're never referenced anywhere else (no "step 02" callout, no anchor links).

**Concrete fix:** Drop the numerals. `Ask · Help · People · School · Inbox` carries the editorial feel through type alone. If you want a magazine note, give the *active* item a small mono kicker like `NOW` or the count of items needing attention.

---

## Mono-xs (9px) is being asked to do too much

The token contract explicitly warns: [`tokens.md:171`](experience/ui/design-system/tokens.md:171) — *"important meaning should not depend on `mono-xs` alone."* But the live UI uses 9–10px mono labels for:

- Section orientation: `WHY THIS MATCH`, `SUGGESTED FIRST ASK` on every Match card.
- Stat labels on dark panel: `OPEN HELPERS`, `NEED REPLY`, `SCHOOL EVENTS`.
- Profile metadata: `CAREER`, `CHRONOLOGICAL RAIL`, `SKILLS & EXPERTISE`, `OPEN TO`, `LINKS`, `VERIFICATION`.
- Page kickers: `PEOPLE · 15 MEMBERS`, `CLASS OF 2005 · CHADWICK SCHOOL (DEV)`.
- Backlinks: `← PEOPLE`.

The cumulative effect is that **everything looks like metadata** — there's no quiet space for the eye to rest. It also fails for older alumni (the pilot includes Class of '05 and earlier — readers will be 40+).

**Concrete fix:** Reserve mono-xs for genuinely decorative kickers (the page kicker `CLASS OF 2005 · CHADWICK SCHOOL` is fine). For section orientation inside a card, use caption (11px) sentence case. `Why this match` is more readable than `WHY THIS MATCH`.

---

## The MatchBriefCard does too much work per card

The home card shows: avatar + name + class year + two status pills + role + "Why this match" panel + "Suggested first ask" panel + ("match signal" OR fallback copy) + primary CTA + secondary CTA. That's 9 distinct content blocks. Stacked 3-deep on the homepage with `compact={true}`, it feels like reading three brochures.

Two specific tells that the card is over-stuffed:

1. **The suggested asks are identical across cards** when there's no query — "Could I ask for your perspective based on your path?" appears verbatim under Mark, Mei, and Felix. Templating shows through and erodes trust in the personalization.
2. **The right rail collapses to fallback copy** ("Start with a lightweight ask. They can respond at their own pace.") on every card because there's no `matchScore`. That's a whole column of repeated coaching copy.

**Concrete fix on the home feed only:** drop the Suggested first ask block when there's no query. Stack identity + role + Why this match + one CTA. Save the full card for the /ask result view, where the user has actually typed a question.

---

## Action hierarchy on the People grid is inverted

On `/people` each card has three actions in this visual order: `Ask for Advice` (ghost) · `Request Mentorship` (filled blue, primary) · `View profile` (ghost). The whole product thesis is "lightweight asks first, formal mentorship later" — but `Request Mentorship` is the dominant blue button by default. The lowest-friction, most-promoted action is rendered as the least visually weighted.

**Concrete fix:** Default the primary action by helper signal. If `open_to_advice` is true, "Ask for Advice" is the filled primary. "Request Mentorship" becomes outline. If only `open_to_mentorship` is true, then Mentorship gets primary.

---

## Border-radius drift

The contract says 6px by default ([`tokens.md:177`](experience/ui/design-system/tokens.md:177)). In practice:

| Component | Actual | Source |
|---|---|---|
| `AskBar` | 8px | [help-network-ui.tsx:41](../app/src/app/(member)/help-network-ui.tsx:41) |
| `NetworkMotif` | 8px | [help-network-ui.tsx:93](../app/src/app/(member)/help-network-ui.tsx:93) |
| `MatchBriefCard` | 8px | [help-network-ui.tsx:190](../app/src/app/(member)/help-network-ui.tsx:190) |
| `HelpOpportunityCard` | 8px | [help-network-ui.tsx:301](../app/src/app/(member)/help-network-ui.tsx:301) |
| `SchoolPulseCard` | 8px | [help-network-ui.tsx:333](../app/src/app/(member)/help-network-ui.tsx:333) |
| `HomeSignal` stat tiles | 8px | [dashboard-client.tsx:246](../app/src/app/(member)/dashboard-client.tsx:246) |
| `PersonAvatar` | 8px | [help-network-ui.tsx:415](../app/src/app/(member)/help-network-ui.tsx:415) |
| `Button` | 6px (specified inline) | various |

So the "6px editorial sharpness" promise of the system is only true for buttons. The cards are visually softer than the design spec. Either update the spec to admit the 8px tier exists, or normalize the cards back to 6px and use 8px as a deliberate signal (e.g., only AI-generated content uses 8px).

---

## Inbox: explainer panel is permanent furniture

The "Warm reactions — no emoji, just intent" panel on the right rail is a beautiful product idea, but at present it's an *instructional* surface (rows explaining what each reaction means) docked permanently on the most-visited page. After visit #2 a user knows what "Wave back" means; the panel becomes wallpaper.

**Concrete fix:** First-visit popover + small persistent "?" affordance, *or* compress to icons only with hover tooltips after the user has reacted once.

Also: empty-state copy ("Ask, help, and connection threads will appear here") is generic. Lean into the brand voice: *"Nothing demands a reply right now — go look around People, or set what you're open to."*

---

## Smaller issues that add up

- **Avatar colors are randomized but feel arbitrary** ([help-network-ui.tsx:434](../app/src/app/(member)/help-network-ui.tsx:434)). Three people in a row can pull the same rust color while a fourth gets sage — viewers will look for meaning in the colors and find none. Either tie color to a real property (cohort, city, region) or use a single muted token for all initials.
- **Times appear UTC-shifted** on the School page event cards (`Wed, May 27 · 2:25 AM`). Real members in PV/Songdo will be confused.
- **The home `FreshnessReviewCard`** ([help-network-ui.tsx:351](../app/src/app/(member)/help-network-ui.tsx:351)) is *always* visible to every user — even users who literally just finished onboarding 30 minutes ago. Gate it on actual profile-staleness signals.
- **Verified pill on the profile header** uses success green (`Verified '08`). Verified is a category (identity proof), not a state (open/available). It currently reads visually identical to `Open to mentor` — both green dot pills, side by side. Differentiate.
- **`/announcements` empty state** is gray and clinical compared to every other surface. Brand voice goes missing exactly where it would best reinforce that this is a *quieter* network than social media.
- **Three identical Mark/Mei/Felix cards** on the home page are seeded test data, but the visual monotony reveals a real issue: when matches are weak or templated, the system shouldn't stack three full-weight cards. Demote to a list row when the only signal is "they exist."

---

## Two things I'd ship in week 1 of design polish

If you only have time for two changes, do these:

1. **Re-anchor the home page around the AskBar.** Demote the headline (display-md, not 7xl), drop the duplicated stats, and either remove the Midnight motif or move it below the fold. Verify the result by asking a friend "what is this product asking you to do?" and timing how fast they say "type a question."

2. **Cut mono-xs labels on cards and section headers in half.** Keep them on page kickers and dark editorial surfaces (where they read as deliberate). Replace in-card section labels (`WHY THIS MATCH`, `SUGGESTED FIRST ASK`, etc.) with caption-sized sentence-case headers. This single change will make the whole product feel calmer and more readable at no cost to identity.

---

## What I couldn't evaluate

- **True mobile (≤480px).** Window-resize in the browser MCP doesn't change the page viewport, only the Chrome chrome. The `@container` hamburger at 900px and the `lg:grid-cols-[1fr_420px]` hero collapse are sound *on paper*, but a real device pass should land before week-1 polish ships.
- **Dark mode.** The token file has full dark coverage; the system was not viewed in dark.
- **Loading and error states.** Live data was fully populated; skeletons and error panels were not exercised.

# Warm variant experiment — May 2026

> **Status: ADOPTED · 2026-05-25.** This exploration became the production
> design system. Canonical tokens now live at
> [`../../../ui/design-system/tokens.md`](../../../ui/design-system/tokens.md)
> and `app/src/app/globals.css`. The Warm theme + density modes (default /
> cozy / pro) are wired into the live app. This folder is preserved as the
> decision record — do not edit or reference for production work.

---

**Question:** Does a "warmer" variant of the design system feel more like a community / membership product, while the current Civic Editorial feels more like an alumni database?

This folder is the artifact that lets us answer that question without committing any production code.

---

## Why this experiment exists

The ui-ux-pro-max library's category match for BridgeCircle is **Membership/Community** → Soft UI Evolution + Vibrant & Block-based. The current Civic Editorial system, however, sits in the **Trust & Authority + Minimalism** band typical of legal/consulting products.

That gap may be fine — calm restraint is a deliberate brand choice. But before locking in a redesign of the page-level surfaces (which the previous design audit flagged for redesign anyway), it's worth a low-cost test: do real Chadwick alums respond differently to the two directions?

### The hypotheses

1. **Warm wins on "what kind of product is this?"** Testers will identify Warm as a community/network and Civic as a database/portal.
2. **Warm wins on "where would you click first?"** The amber CTA in Warm will be unambiguous; Civic's all-Electric-Sky surfaces force a longer scan.
3. **Civic wins on "would you trust this with your information?"** The editorial restraint will read more institutional.

Whether the third hypothesis matters more than the first two is the real decision.

---

## What's different in the warm variant

All deltas live in [`tokens-warm.css`](./tokens-warm.css). The variant is one CSS class (`.theme-warm`) overriding production tokens. No component code changes. Specifically:

| Token | Civic | Warm | Why |
|---|---|---|---|
| `--radius` | 6px | **10px** | Community/membership products universally use 8–12px (library: Soft UI Evolution) |
| `--font-size-body-md` | 13px | **16px** | Library: 16px mobile-readability minimum |
| `--font-size-h1` | 20px | **25.6px** | Library: community/editorial wants strong h1 hierarchy |
| `--font-size-display-md` | 28px | **32px** | 1.25 modular scale |
| `--font-size-display-lg` | 36px | **40px** | 1.25 modular scale |
| `--font-size-caption` | 11px | **13px** | Readable caption, not metadata-only |
| `--cta` | (none — uses primary) | **#f59e0b amber** | Library Result 1: "Contrasting accent color, at least 7:1 contrast" |
| Accent palette | ochre + rust + sage + plum | **amber + sage** (plum folds to muted, ochre folds to amber) | Library: SaaS/community wants 1–2 accents, not 4 |
| Card hover | 1px border lift | **scale(1.02) + shadow-card-hover** | Library: community products universally use micro-delight |

Primary color (Electric Sky #2563eb), background (Platinum Bone #fafaf9), text (Obsidian #0c0c0b), and font family (Inter / Inter Tight) are **unchanged**. The experiment isolates the "community vs database" feel from "trust blue vs something else."

---

## How to run the test

1. Open `compare/home.html` in a browser at 1440×900. Civic on the left, Warm on the right.
2. Walk through `compare/ask.html` and `compare/profile.html`.
3. Take screenshots if needed (Cmd+Shift+P → "Capture screenshot" in DevTools).
4. For each alum tester (aim for 5–8):
   - Show **one variant at a time, full-screen, for 5 seconds**, then hide.
   - Ask: *"What is this product? Who is it for?"*
   - Show the other variant for 5 seconds, ask same question.
   - Repeat for ask-results and profile screens.
   - Finally, show side-by-side and ask which would feel more comfortable for (a) a hesitant 22-year-old recent grad and (b) a 45-year-old established alumna.

**Don't ask "which is better."** People pick the novel one. Ask category-identification questions instead.

---

## Two orthogonal axes: theme and density

BridgeCircle is a hybrid product — community/social on the member-facing surfaces, professional/operator on the admin surfaces, and used by alums from age 22 to 60+. A single visual mode would fail at one of those poles. The cleanest model is **two orthogonal axes**:

| Axis | What it controls | Values |
|---|---|---|
| **Theme** | Brand identity — radius, palette, font family, CTA color | `civic` (default) · `warm` |
| **Density** | Surface job — type size, padding, shadow weight | `default` · `cozy` · `pro` |

A surface declares both via `<html>` classes: `class="theme-warm density-cozy"` = warm identity, list-item density.

### The three density modes

| Mode | Body | h1 | Amber CTA? | Card hover lift? | Use case |
|---|---|---|---|---|---|
| **default** | 16px | 25.6px | yes | yes (2px) | Single hero surfaces — onboarding, auth, profile detail header |
| **cozy** | 14px | 22px | **yes** (brand kept) | yes (1px) | List-of-cards member surfaces — home, ask results, inbox |
| **pro** | 14px | 20px | no (reverts to blue) | no (bg tint only) | Operator surfaces — admin tables, analytics, ambassador dash |

Cozy and pro share font sizes but differ on brand-identity treatments. Cozy is "default but compressed for scanning lists"; pro is "default but operator." The rule is simple: amber CTA + warm hover lift = brand identity for *members*, drop both for *operators*.

### Where each combination fits

| Surface job | Theme | Density | Why |
|---|---|---|---|
| Onboarding, auth, sign-in | warm | **default** (roomy) | New reader needs confidence; single focus |
| Profile detail (single person header) | warm | **default** | Single-hero surface, identity moment |
| **Home (list of match cards)** | warm | **cozy** | Scanning 3-5 cards, not focusing on one |
| **Ask results (list of match cards)** | warm | **cozy** | Scanning 3-5 cards, not focusing on one |
| **Inbox list, message threads** | warm | **cozy** | Repeated rows, each row is a relationship |
| Mentor settings, profile editor | warm | default | Decisions matter, user-controlled |
| **Admin members table** | warm | **pro** | Operator workflow, scan-dense, no amber over-claim |
| **Admin analytics, ambassador dash** | warm | **pro** | Operator workflow, scan-dense |

### What changes when density flips to `cozy` ([`tokens-density-cozy.css`](./tokens-density-cozy.css))

- Type compresses ~1.15x (16→14 body, 26→22 h1)
- Card padding tightens (1.5rem → 1.125rem)
- Shadow weight slightly lighter
- Avatars compress to 40px (LinkedIn-feed-post sweet spot)
- Card hover travel shrinks (2px → 1px)
- **Amber CTA stays. Warm identity preserved.**

### What changes when density flips to `pro` ([`tokens-density-pro.css`](./tokens-density-pro.css))

- Type scale drops one step (16→14 body, 26→20 h1)
- Padding tightens further (1.5rem → 0.875rem)
- Shadow weight drops to hairline-only
- Avatars and badges shrink to 32px
- Card hover loses the scale lift entirely
- **CTA reverts to primary blue** — admin surfaces have many equal-weight actions; an amber button would over-claim attention

### What does NOT change when density flips

- `--radius` (10px in warm, 6px in civic — brand identity)
- Color palette
- Font family
- Focus styles

**The reason this works:** radius and color carry brand identity, density carries surface job. Mixing brand identity across pages fragments the product; mixing density across pages signals "this surface is doing different work."

### About older users

A common instinct is "make professional surfaces smaller and tighter." For **operator** surfaces (admin tables) this is right. For **member** surfaces used by older alums (45+), it's wrong — declining near-vision after 40 means larger type matters more, not less. Pro density is for *operator workflow*, not "professional vibe in general." Member-facing mentor/help surfaces stay at default density even when they're "serious" content.

See `surfaces/admin-warm.html` vs `surfaces/admin-pro.html` and `compare/admin.html` for the density demonstration.

## How to extend

- **Tweak the warm variant during a call:** edit `tokens-warm.css` and refresh. Both variants update instantly.
- **Tweak the pro density mode:** edit `tokens-density-pro.css`. Affects every surface using `density-pro`.
- **Add a new surface:** copy an existing pair (e.g. `surfaces/home-civic.html` + `surfaces/home-warm.html`), swap content. The only HTML difference between the pair is `<html class="theme-warm">`.
- **Add a new density mode** (e.g. `density-compact-mobile`): create `tokens-density-{name}.css` with `.density-{name}` selector. Composes with any theme.
- **Show the system itself:** see `warm-design-system.html` for a single-page reference of the warm tokens, type scale, components.

---

## Decision log

_Fill this in after running the test._

### Testers

| # | Name | Class | Date | Notes file |
|---|---|---|---|---|
| 1 | _TBD_ | | | |
| 2 | | | | |

### Patterns observed

_(fill in)_

### Decision

_(fill in — one of: keep Civic / migrate to Warm / hybrid)_

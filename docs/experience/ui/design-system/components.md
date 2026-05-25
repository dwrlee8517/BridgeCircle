# Civic Editorial Component Usage

This is the production component guide for BridgeCircle's Civic Editorial system.
Use it with [`tokens.md`](tokens.md), [`states-and-motion.md`](states-and-motion.md),
and the live app primitives in `app/src/components/ui/`.

The interactive prototype and `reference-src/` files are visual reference only.
Do not copy component code, token exports, or raw colors from them into the app.

## Production Rules

- Start from existing app primitives before creating local component styling.
- Use Civic tokens through Tailwind variables, not raw hex values.
- Use role tokens such as `action-primary`, `state-success`, and
  `surface-panel` for new surfaces. Base hue tokens remain a compatibility
  layer for existing primitive APIs.
- Keep 6px editorial corners by default. Use full circles only for avatars,
  dots, radio controls, notification counters, progress bars, and search
  capsules.
- Important labels must be at least caption/body scale. The smallest allowed
  size in the scale is `mono-sm` (10.5px); the 9px `mono-xs` token was removed.
- Cards are decision surfaces. Do not use cards as page section wrappers or
  stack cards inside cards unless the inner item is a repeated row/list item.
- Member screens must expose the next relationship action without requiring
  browsing.
- Admin screens may be denser, but they still use the same tokens, status
  language, and action hierarchy.

## Production Primitive Map

| Primitive | Use For | Production Notes |
|---|---|---|
| `Button` | Primary actions, secondary actions, destructive actions, icon buttons | Use variants before local classes. Primary action uses Electric Sky by default. Use `asChild` for links. |
| `Card` | Repeated decision surfaces, modals, compact panels | Default radius and border should be enough. Avoid decorative shadows unless the screen pattern requires lift. |
| `Input`, `Textarea`, `Select` | Forms and filters | Prefer shared primitives over raw fields. Raw search inputs are acceptable only when the shell needs custom layout. |
| `Badge` | Topics, tags, compact labels | Use for non-status labels. Keep topic labels readable and avoid making critical state depend on tiny mono text. |
| `StatusBadge` | Semantic state | Use for mentor availability, request lifecycle, membership state, RSVP state, and admin status. Uses role and tint tokens so warning text stays readable. |
| `Avatar` | Member identity | Photo first. Fallback initials may use stable generated token colors. |
| `Dialog` | Confirmation, explanation, focused secondary tasks | Keep content editorial and concise. Avoid turning dialogs into full pages. |
| `DropdownMenu`, `Popover` | Menus and compact overlays | Use for navigation menus, account actions, and contextual controls. |
| `Tabs` | Sibling views within one job | Keep tab labels concrete. Avoid using tabs for unrelated destinations. |
| `EmptyState` | Empty lists and blank sections | Every empty state should name the state and offer the next useful action when possible. |
| `Skeleton` | Loading placeholders | Match the final layout closely enough that loading does not reflow the page. |
| `CapacityGauge` | Mentor/event capacity | Use when a numeric capacity affects a user's decision. |

## Variant And State Contract

Shared primitives must own their default visual states. Routes should not
rebuild hover, focus, disabled, loading, or invalid behavior with one-off class
strings unless the screen pattern is genuinely unique.

| Primitive | Required Variants | Required States |
|---|---|---|
| `Button` | `default`, `secondary`, `outline`, `ghost`, `destructive`, `link`; sizes `xs`, `sm`, `default`, `lg`, `icon*` | Hover, active, focus-visible, disabled, aria-invalid, icon spacing |
| `Card` | `default`, `sm` density | Default, hover where the card is interactive, footer, media edge cases |
| `Input`, `Textarea`, `Select` | Default and compact only when needed | Focus-visible, disabled, aria-invalid, placeholder, autofill/password-manager tolerance |
| `Badge` | `default`, `secondary`, `destructive`, `outline`, `ghost`, `link` | Focus-visible, link hover, icon spacing |
| `StatusBadge` | `info`, `open`, `warn`, `alert`, `muted`, legacy hue aliases | Dot and no-dot, compact and default, light and dark mode |
| `LifecycleStatusBadge` | `pending`, `accepted`, `active`, `completed`, `declined`, `revoked`, `expired`, `paused`, `unread`, `disabled`, `error` | Common lifecycle words mapped to canonical tones |
| `EmptyState` | `default`, `inline` | With icon, without icon, with action, without action |
| `CapacityGauge` | `default`, `compact`, `inline` | Low, medium, high, full, zero-limit handling |

State rules:

- Focus-visible is mandatory for all interactive primitives and should use
  `focus-ring` plus `focus-ring-muted`.
- Disabled states should reduce interactivity without lowering readable text
  below acceptable contrast.
- Invalid states use `state-danger` and `danger-tint`; warning states use
  `state-warning` for marks and `state-warning-foreground` for copy.
- Loading states should preserve the final control footprint. Do not shrink a
  button or row when swapping text for a spinner.
- Interactive cards may lift 1-2px, but static cards should not animate.
- Use `states-and-motion.md` for lifecycle mapping before adding route-local
  status color logic.

## Action Hierarchy

| Action Level | Component Treatment | Use |
|---|---|---|
| Primary | `Button` `variant="default"` | The one next best action in the local context |
| Secondary | `Button` `variant="secondary"` or `outline` | Useful alternative action |
| Tertiary | `Button` `variant="ghost"` or `link` | Navigation, disclosure, or low-risk secondary movement |
| Destructive | `Button` `variant="destructive"` | Delete, revoke, cancel, decline, destructive account actions |
| Status-only | `StatusBadge` | Communicates state but does not invite action |

Every screen should have at most one visually dominant primary action per local
decision area. If two actions compete, the product decision is unresolved.

## Product Component Specs

These are product-level components, not primitive replacements. They describe
the repeated BridgeCircle objects that carry the member-first warm-network
thesis. A route-local implementation is acceptable while the pattern appears in
one place; once it appears in two places, extract the shared component with this
contract.

### Person Card

Current local source: `app/src/app/(member)/people/result-card.tsx`.

Purpose: help a member decide whether this person can help, should be asked,
or is worth opening in profile detail.

Required content:

| Element | Rule |
|---|---|
| Identity | Avatar or initials, display name, class year when known |
| Current role | Title and employer first; city second |
| Trust signals | Friend, verified cohort, shared city, mutual profiles, or other available relationship proof |
| Help signals | Mentor/advice availability, paused/full state, capacity where relevant |
| Match explanation | Search or recommendation rationale when available |
| Action | One primary next step: view profile, ask for advice, request mentorship, or message if already friends |

States:

| State | Treatment |
|---|---|
| Default | `surface-card`, clear identity, quiet metadata |
| Hover/focus | Border or 1px lift only; preserve layout |
| Selected | `primary-tint` or stronger border; no competing CTA color |
| Friend | `StatusBadge tone="info"` or relationship-specific label |
| Open to help | `StatusBadge tone="open"` |
| Paused/full | `StatusBadge tone="warn"` with readable `state-warning-foreground` copy |
| No data | Use explicit fallback copy: "No role listed", "No location listed" |

Responsive rules:

- Compact rows may collapse role/location, but must preserve name, class year,
  help state, and primary action.
- Mobile cards stack identity, status, rationale, then action. Do not push the
  action below long biography text.

Do not:

- Use color alone to communicate match or capacity.
- Show more than two status badges before the name wraps.
- Put long AI rationale directly in the card; use disclosure or dialog.

### Request Card

Current local sources: `app/src/app/(member)/inbox/inbox-container.tsx`,
`app/src/app/(member)/ask/[id]/page.tsx`, and dashboard request modules.

Purpose: make an ask or friend request actionable without requiring inbox
archaeology.

Required content:

| Element | Rule |
|---|---|
| Actor | Who needs a response, with avatar or initials |
| Request type | Advice, mentorship, friend request, direct message, or system request |
| User need | The actual question or shortest useful summary |
| Lifecycle | Pending, accepted, declined, active, unread, sent, or completed |
| Timing | Created date or last activity; due/age when it changes urgency |
| Action | Accept/decline, reply, view thread, or view profile |

States:

| State | Treatment |
|---|---|
| Incoming pending | `request-attention`, `warning-tint`, primary action visible |
| Outgoing pending | `state-muted` metadata; no false urgency |
| Accepted/active | `state-info` or `state-success` depending on context |
| Declined/revoked | `state-danger` only when the user must notice it |
| Unread | Dot plus stronger title weight; do not rely on dot alone |
| Disabled action | Keep text readable and explain why in nearby copy |

Responsive rules:

- In list rows, keep actor, lifecycle, time, and unread state visible.
- In detail views, show the user need before secondary metadata.

Do not:

- Hide accept/decline behind an overflow menu for incoming requests.
- Use destructive styling for routine decline until the user enters a
  confirmation or final action.

### Profile Header

Current local source: `app/src/app/(member)/profile/[id]/page.tsx`.

Purpose: summarize identity, trust, and relationship actions at the top of a
profile.

Required content:

| Element | Rule |
|---|---|
| Identity | Avatar, display name, class year or verified status |
| Current role | Title, employer, city |
| Headline | One concise line when available |
| Help status | Mentor/advice availability, paused/full state |
| Relationship status | Friend, pending request, not friends, self profile |
| Primary action | Message, add friend, request advice, request mentorship, or edit own profile |

States:

| State | Treatment |
|---|---|
| Own profile | Edit/import actions are primary; ask/message actions hidden |
| Friend | Message can be primary; friendship shown as status |
| Not friend | Add friend or request help is primary based on context |
| Mentor full | Warning status visible; mentorship CTA disabled or explained |
| Saved/error flash | Use notification spec, not ad hoc alert styling |

Responsive rules:

- Mobile stacks avatar, identity, statuses, then actions.
- Do not let decorative motif crowd the name or action area.

Do not:

- Turn the profile header into a full landing hero.
- Use more than one decorative motif in the header.

### Event Card

Current local sources: `app/src/app/(member)/events/events-master-detail.tsx`,
`app/src/app/(member)/events/[id]/page.tsx`, and admin event surfaces.

Purpose: help members decide whether an event is relevant and whether to RSVP.

Required content:

| Element | Rule |
|---|---|
| Event title | Primary card heading |
| Date/time | Visible without opening detail |
| Category | Compact metadata, not a marketing badge |
| Location | Required when the event is in-person; otherwise virtual marker |
| Attendee signal | Count and small preview when available |
| Capacity/RSVP | Going, waitlisted, ended, register, or cancel RSVP |

States:

| State | Treatment |
|---|---|
| Upcoming | Primary action available on card or immediately adjacent |
| Going | `state-success` mark; action becomes cancel/update |
| Waitlisted | `state-warning` mark plus clear copy |
| Full | Capacity visible; action explains waitlist or disabled reason |
| Past/ended | Muted status; no primary RSVP color |
| Featured | Use `event-featured` sparingly for one event per surface |

Responsive rules:

- Mobile cards show title, date, location/category, and RSVP before prep notes.
- Attendee stacks can collapse to count only.

Do not:

- Use arbitrary per-event raw colors unless category colors are documented.
- Let decorative index numbers outrank date and action.

### Inbox Thread Row

Current local source: `app/src/app/(member)/inbox/inbox-container.tsx`.

Purpose: let members scan for what needs attention and resume the right
conversation.

Required content:

| Element | Rule |
|---|---|
| Actor/thread name | Primary text |
| Type badge | DM, advice, mentorship, friend request, sent |
| Preview | Last message or request summary |
| Time | Last activity or request date |
| Unread | Dot plus stronger title/preview weight |
| Selection | Distinct surface and border without shifting layout |

States:

| State | Treatment |
|---|---|
| Unread | `request-attention` dot, stronger title, accessible label where possible |
| Selected | `surface-card` with border; no movement |
| Hover/focus | `surface-subtle`; keyboard focus ring visible |
| Muted/closed | `state-muted` badge and metadata |
| Search-empty | Use `EmptyState inline` copy specific to inbox search |

Responsive rules:

- Mobile list rows navigate to detail; include back affordance in detail.
- Preserve row height across unread/selected changes.

Do not:

- Encode lifecycle with local badge color maps. Use `StatusBadge`.
- Hide unread count/state inside the detail pane only.

### Empty State

Current shared source: `app/src/components/ui/empty-state.tsx`.

Purpose: explain why a surface is empty and provide the next useful action.

Required content:

| Element | Rule |
|---|---|
| Title | Names the state, not the feature |
| Description | Explains why it is empty or what will appear here |
| Action | Present when there is a credible next step |
| Icon | Optional; decorative only |

States and variants:

| Variant | Use |
|---|---|
| `default` | Whole-page or major-tab empty state |
| `inline` | Section, table, inbox pane, or card body |
| No action | Only when user cannot do anything useful |
| Error-adjacent | Use notification/error pattern first, then empty state if data is absent |

Do not:

- Use empty states as marketing copy.
- Leave blank table/card shells without title copy.

### Form Section

Current local sources: `app/src/components/profile-form.tsx`,
onboarding steps, admin forms, and ask composer forms.

Purpose: group related fields so members can complete profile, ask, admin, or
settings work without losing context.

Required content:

| Element | Rule |
|---|---|
| Legend/title | Short noun phrase, uppercase metadata style acceptable |
| Description | Only when it changes how the user answers |
| Fields | Label, input, helper/error text, required marker when needed |
| Validation | Field-level error near the field plus form-level error near submit |
| Submit area | Primary action, disabled/pending copy, secondary action if needed |

States:

| State | Treatment |
|---|---|
| Default | `surface-card` or unframed form region depending on page |
| Required | Text marker plus native `required` where valid |
| Invalid | `state-danger` copy, `danger-tint` focus/halo, aria-invalid |
| Pending | Preserve button width; copy changes to verb-ing |
| Disabled | Disabled control plus explanation when not obvious |

Responsive rules:

- Two-column field rows may collapse to one column below tablet width.
- Error text must stay with its field on mobile.

Do not:

- Use placeholder text as the only label.
- Use dense admin spacing on onboarding or profile setup.

### Admin Table

Current local sources: `app/src/app/(member)/admin/*` table surfaces.

Purpose: support repeated operational decisions with high scan density and low
ambiguity.

Required content:

| Element | Rule |
|---|---|
| Title/description | State what population the table contains |
| Counts/filters | Summary counts visible above or beside table |
| Header row | Plain language, stable order |
| Primary identifier | Name/email/title depending on object |
| Status | `StatusBadge`, not ad hoc color text |
| Row actions | Right aligned; destructive actions require confirmation |
| Empty state | Inline `EmptyState` with next admin action |

States:

| State | Treatment |
|---|---|
| Loading | Skeleton rows matching column widths |
| Empty | Inline empty state inside the table card |
| Error | Notification/error block above table |
| Selected/bulk mode | `primary-tint` row background; sticky bulk action bar if needed |
| Revoked/deactivated | Muted row text plus status, not hidden rows |

Responsive rules:

- Admin tables may scroll horizontally. Do not collapse critical columns into
  unreadable stacked cards unless the task is mobile-primary.
- Actions remain reachable at the row end.

Do not:

- Use text below `mono-sm` (10.5px) anywhere; the 9px `mono-xs` token was
  removed because the "don't use it for important meaning" rule was easier to
  break than to enforce.
- Put destructive actions in the same visual weight as neutral row actions.

### Notification

Current local sources: `app/src/app/(member)/notifications-bell.tsx`,
`app/src/app/(member)/notifications/page.tsx`, flash messages, and dashboard
recent activity.

Purpose: tell members what changed and whether action is required.

Required content:

| Element | Rule |
|---|---|
| Actor/object | Who or what changed |
| Event label | Accepted, requested, canceled, messaged, approved, etc. |
| Time | Relative in feeds; absolute where auditability matters |
| Action | Link to the object when useful |
| Read state | Unread mark and stronger text weight |

States:

| State | Treatment |
|---|---|
| Info | `state-info`, `primary-tint` |
| Success | `state-success`, `success-tint` |
| Warning/action needed | `state-warning`, `warning-tint`, readable foreground copy |
| Error/destructive | `state-danger`, `danger-tint` |
| Unread | Dot plus font weight; do not rely on color alone |
| Toast/flash | Short copy, no marketing language, dismissible where persistent |

Responsive rules:

- Bell popover rows are compact, but must preserve actor, event, and time.
- Full notification page may add descriptions and filters.

Do not:

- Mix lifecycle states with arbitrary accent colors.
- Use notifications as a second navigation system.

### Email Template

Current shared source: `app/src/notify/emails/civic-email.tsx`.
Lifecycle templates live in `app/src/notify/emails/*`; delivery is centralized
in `app/src/notify/resend.ts`.

Purpose: carry lifecycle messages into email while preserving Civic Editorial
trust, typography, and action clarity.

Required content:

| Element | Rule |
|---|---|
| Preview text | Concrete lifecycle event |
| Header | BridgeCircle wordmark text, not app navigation |
| Greeting | Personal when recipient name exists |
| Body | One clear reason the email was sent |
| CTA | One primary button when action exists |
| Plain link | Visible fallback URL for critical CTAs |
| Footer | Why they received it and how to change the relevant setting |
| Plain text | Required fallback for every lifecycle template |

Shared implementation:

| Piece | Source | Rule |
|---|---|---|
| Frame/header | `CivicEmail` | BridgeCircle wordmark plus "Verified alumni network"; no app nav |
| Typography | `CivicHeading`, `CivicText` | Uses email-safe foreground/muted values and fixed line heights |
| CTA | `CivicButton`, `CivicButtonRow` | One primary CTA; secondary only for proposal review |
| Fallback URL | `CivicPlainLink` | Include for action-critical links |
| Callout/quote | `CivicCallout`, `CivicQuote` | Use for summaries, reasons, and member-provided notes |
| Plain text | `sendRenderedEmail` | Render every template as both `html` and `text` before sending |

Email-safe tokens:

| Role | Token |
|---|---|
| Body | `email-background` |
| Container | `email-card` |
| Copy | `email-foreground` and `email-muted` |
| Divider | `email-border` |
| CTA | `email-primary`, `email-radius` |
| Destructive copy | `email-destructive` |
| Font | `email-font-family` |

States:

| State | Treatment |
|---|---|
| Invite/approval | Primary CTA, warm copy, expiration or access detail |
| Request/action needed | Primary CTA, request actor, clear next step |
| Accepted/success | Success copy, link to thread/profile/event |
| Canceled/deactivated/destructive | No alarming visual unless action is required; explain consequence |
| Best-effort email failure | Product flow must still succeed if database action already succeeded |

Do not:

- Use app CSS variables in email markup.
- Use dark/editorial surfaces in email until tested across clients.
- Send multiple CTAs with equal visual weight.
- Create template-local headers, footers, buttons, or raw color constants.

## Component Promotion Backlog

These patterns are repeated enough to deserve extraction once their product
contracts stabilize. Until then, keep their local implementations token-driven.

| Candidate | Why It Matters | Before Promotion |
|---|---|---|
| `PersonDecisionCard` | Core browsing and referral object | Normalize match reason, friend signal, helper status, and CTA props |
| `RequestLifecycleRow` | Inbox and dashboard action-required rows | Normalize status language and due/response affordances |
| `ProfileSection` | Profile read/edit/admin review panels | Normalize title/action/header density and empty states |
| `EventSummaryCard` | Event list, home modules, admin review | Normalize category, RSVP, capacity, and featured treatment |
| `AdminDataTable` | Admin members/events/invites/announcements | Normalize density, bulk actions, row actions, empty/error states |

## Component Import Pattern

```tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
```

Use the shared component API first:

```tsx
<Button asChild>
  <Link href="/people">Find someone to ask</Link>
</Button>

<StatusBadge tone="open" dot>
  Open to mentor
</StatusBadge>
```

Avoid local restyling like this unless there is a documented screen-level reason:

```tsx
<button className="rounded-[18px] bg-[#123abc] shadow-xl">...</button>
```

## Promotion Checklist

Before turning a local route pattern into a shared component:

1. Confirm the pattern represents the same user job in each location.
2. Name the semantic props, not the visual slots.
3. Use tokens and shared primitives internally.
4. Add empty, loading, disabled, error, and mobile states when relevant.
5. Update this guide with the component's role and usage constraints.

## Non-Canonical Sources

Do not copy from:

- `reference-src/ds-tokens-export.jsx`
- `reference-src/ds-foundations.jsx`
- `reference-src/ds-components.jsx`
- Any snippet labeled Atrium, terracotta, oat, lamplight, or token export

Those files remain useful for visual archaeology, but production work starts
from this guide, [`tokens.md`](tokens.md), and the live app primitives.

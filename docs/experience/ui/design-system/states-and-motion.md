# Civic Editorial States And Motion

This is the production state and motion contract for BridgeCircle. Use it with
[`tokens.md`](tokens.md), [`components.md`](components.md), and the live CSS
contract in `app/src/app/globals.css`.

State styling must explain product meaning. Do not create one-off color maps in
routes for lifecycle states that already exist here.

## State Model

| State | Product Meaning | Token Treatment | Required Behavior |
|---|---|---|---|
| Loading | Data or action is in progress | `surface-subtle`, `motion-slow` pulse | Preserve the final footprint; do not move surrounding content |
| Empty | No relevant objects exist or match filters | `EmptyState` with optional `surface-card` | Name the state and show the next useful action when one exists |
| Disabled | Action is unavailable | `state-muted`, readable copy, reduced affordance | Explain why when the reason is not obvious |
| Error | Something failed or is invalid | `state-danger`, `danger-tint` | Put field errors beside fields and form errors near submit |
| Hover | Pointer is exploring an interactive element | `surface-subtle` or `action-primary-hover` | Color/border change only, unless the element is an interactive card |
| Selected | Object is the active selection | `primary-tint` or `primary-tint-strong` | No layout shift; use `aria-current`, `aria-selected`, or `aria-pressed` |
| Unread | Member has not seen new activity | `request-attention`, `warning-tint` | Dot plus stronger text weight; never color alone |
| Pending | Waiting for member/admin/system decision | `state-warning`, `warning-tint` | Make the owner of the next action clear |
| Accepted | Request, RSVP, or membership succeeded | `state-info` or `state-success` | Prefer calm confirmation over celebratory styling |
| Declined | Request was rejected or revoked | `state-danger` only when attention is needed | Avoid destructive treatment for routine decline choices |
| Paused | Member/account/capacity is intentionally inactive | `state-warning-foreground`, `warning-tint` | Explain whether the pause is user-set, admin-set, or automatic |
| Mobile | Hover is unavailable and detail may become a new view | Same semantic tokens | Keep primary action reachable before long descriptive content |
| Dark/editorial | Expressive entry surface, not dense workflow UI | `surface-editorial`, `action-on-editorial`, `editorial-rule` | Do not use ordinary `primary` text on Midnight surfaces |

## Lifecycle Badge Mapping

Use `StatusBadge` for custom semantic labels and `LifecycleStatusBadge` for
common lifecycle words.

| Lifecycle | Badge Tone | Dot | Notes |
|---|---|---:|---|
| `pending` | `warn` | Yes | Needs decision or is awaiting response |
| `accepted` | `info` | Yes | Request accepted; thread/action may now exist |
| `active` | `info` | Yes | Ongoing thread, membership, or selected workflow |
| `completed` | `open` | Yes | Finished successfully |
| `declined` | `alert` | Yes | Negative lifecycle state that still matters |
| `revoked` | `alert` | Yes | Admin/account state, not routine user choice |
| `expired` | `muted` | No | No longer actionable |
| `paused` | `warn` | Yes | Temporarily inactive or capacity-limited |
| `unread` | `warn` | Yes | Also needs text weight change |
| `disabled` | `muted` | No | Include explanation when non-obvious |
| `error` | `alert` | Yes | Use with nearby recovery copy |

## Motion Recipes

| Recipe | Duration | Easing | Allowed Properties | Use |
|---|---:|---|---|---|
| Control hover | `motion-base` | `ease-standard` | color, background, border, opacity | Buttons, links, tabs, compact controls |
| Selection change | `motion-fast` | `ease-standard` | background, border, text color | Inbox rows, table rows, selected cards |
| Interactive surface hover | `motion-base` | `ease-standard` | background, border, box-shadow, 1px transform | Clickable cards only |
| Overlay enter | `motion-medium` | `ease-emphasized` | opacity, transform | Dialogs, popovers, menus |
| Loading pulse | `motion-slow` repeated | `ease-standard` | opacity | Skeletons only |
| Error reveal | `motion-fast` | `ease-standard` | opacity | Inline validation and alert text |

Motion rules:

- Never animate layout-critical size, row height, or text wrapping.
- Hover lift is capped at 1px for production app surfaces.
- State changes caused by submit, accept, decline, RSVP, or admin actions must
  not be delayed by decorative animation.
- Loading skeletons should mimic the final layout closely enough that hydration
  does not reflow the page.
- `prefers-reduced-motion: reduce` disables non-essential transitions and
  animations in the live CSS contract.

## Surface-Specific Rules

| Surface | State Requirement |
|---|---|
| Person cards | Hover/focus and selected state must preserve card height; paused/full mentor state uses `warn` |
| Request cards | Incoming pending requests need visible primary action; outgoing pending is muted |
| Inbox rows | Unread requires dot plus stronger title/preview; selected uses `primary-tint` without movement |
| Event RSVP | Going/waitlisted/not-going states must keep button footprints stable while pending |
| Admin tables | Selected/bulk rows use `primary-tint`; revoked/deactivated rows stay visible with muted text |
| Forms | Disabled and pending buttons preserve width; errors stay attached to fields on mobile |
| Notifications | Unread uses dot plus weight; action-needed uses warning tint, not arbitrary accent colors |
| Email | No app motion; state comes from copy, one CTA, and email-safe color tokens |

## Do Not

- Invent route-local hue maps for `pending`, `accepted`, `declined`, or
  `paused`.
- Use `accent-ochre` as small warning text on light backgrounds.
- Let hover be the only indication that a control is interactive.
- Collapse mobile actions below long biographies, descriptions, or event notes.
- Use dark/editorial treatment for ordinary cards, tables, inbox rows, or forms.

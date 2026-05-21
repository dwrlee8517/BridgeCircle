# BridgeCircle — Functions And User Experience

This document describes every function and user workflow in BridgeCircle. It pairs with [`docs/experience/`](docs/experience/) for redesign work: this file describes what the product does and how a user moves through it; the experience docs describe active UX interpretation, screen-level guidance, and visual treatment. Workflows must remain as described; visual treatment is open.

---

## 0. What BridgeCircle Is

BridgeCircle is a **verified warm-network platform** for trusted communities — currently alumni networks for private schools. The product helps members feel safe asking for help, proud to offer help, and more connected to the circles that shaped them. It is not a CRM, not an alumni-management database, not a generic social network.

Five user types share the product:
- **Member** — verified alumnus or student of a participating organization
- **Asker** — a member sending a request
- **Helper** — a member who has opted to receive advice/mentorship requests
- **Friend** — two members who have mutually accepted a friend request (gates DMs)
- **Admin** — staff who invite, approve, moderate, and run programming for one organization

Every member can play multiple roles simultaneously. The product gates the *capabilities* of each role separately: friendship is its own track, asks are their own track, and DMs require mutual friendship.

There are two parallel "ask" types, both running on the same data model:
- **Advice** — a one-off, low-friction question. Anyone open to advice can receive these.
- **Mentorship** — an ongoing relationship. Subject to capacity caps the helper sets.

---

## 1. Top-Level Information Architecture

Authenticated members land in an app shell with a sticky header. The header has, left to right: the BridgeCircle wordmark (linking home `/`), the primary nav, a "Search the circle…" input that submits to `/people` on wide viewports, a notifications bell with a popover, and an avatar account menu. On narrow viewports the nav collapses to a hamburger drop-down.

Primary nav (in order, for every member):
- **People** (`/people`) — the alumni directory + search
- **Inbox** (`/inbox`) — unified request lifecycle (friend requests, asks, direct messages)
- **Events** (`/events`)
- **Admin** (`/admin/...`) — appears only for admins, as the last slot before the bell

Legacy URLs redirect (308) to current ones so old links keep working: `/search → /people`, `/discover → /people`, `/friends → /people?peopleIKnow=on`, `/ask → /inbox`, `/messages → /inbox`, `/mentorship/request/* → /ask/*`, `/mentorship/thread/* → /ask/thread/*`.

The account menu (avatar dropdown) contains: My profile, Edit profile, Helper preferences, and Sign out.

---

## 2. Getting In — Auth, Invite, Onboarding

### 2.1 Sign In (`/sign-in`)

Public route. The page is a two-column auth layout: a dark left panel with brand messaging ("Build from a circle you already trust"), and on the right a centered card. The card offers, in order:

1. **Sign in with Google** (primary OAuth path).
2. A divider, then **email + password** form: email, password, "Sign in".

Errors arrive two ways:
- URL params (e.g. `?error=admin_deactivated`) surface as a red banner at the top of the card.
- Form validation surfaces inline under the offending field.

On success, the user redirects to `?next=` (if a valid same-origin path) or to `/`. If a user is already signed in, the page redirects immediately.

### 2.2 Invite Acceptance (`/join?token=…`)

The only path to creating a new account. There is no open self-signup. The page requires a one-time invite token in the URL.

If the token is missing or invalid, the card displays a single helpful error keyed to the failure:
- "This invite link is not valid. Check that you opened the most recent email."
- "This invite has expired. Ask your admin to send a new one."
- "This invite has been revoked."
- "This invite has already been used. Sign in instead."

If valid, the card shows:
- A welcome line: "You're invited to **{Organization Name}** on BridgeCircle"
- A pre-filled (read-only) email pulled from the token
- "Sign up with Google" button, then "or use a password" divider
- Password sign-up form (min 8 chars)

On success the user is created with an `active` organization membership and redirected to `/onboarding?step=1`.

### 2.3 Onboarding (`/onboarding?step=1..5`)

A five-step wizard with query-param routing so browser back/forward work natively. The shell across all steps shows the BridgeCircle wordmark (links home, allowing escape), a progress indicator ("Step N of 5"), a 5-dot progress bar, an uppercase eyebrow, an editorial title, and a lede. From step 2 onward there is a "← Back" link.

**Step 1 — About You (required).** Fields: full name, preferred name (optional), also-known-as (optional, e.g. Korean name), graduation year. Only "Save and continue" is offered — no skip. The user cannot advance until name and year are filled. Attempting to jump to step 2+ before completing step 1 force-redirects back to step 1.

**Step 2 — Education (skippable).** University, major, plus an "+ Add school" dynamic list for additional schools with degree, field, and dates. Both "Save and continue" and "Skip for now" are offered.

**Step 3 — Today (skippable).** Current employer, current title, city, optional one-line headline (≤200 chars, shown under names on profile cards), LinkedIn URL. Copy acknowledges that members may be between roles, retired, or students.

**Step 4 — Past Experience (skippable, strategically emphasized).** This step opens with a large dashed-border block labeled "Upload resume" that links to `/profile/import?return=/onboarding?step=4`. The copy explains: "Past roles are how mentors get matched on the harder questions." Below the import box are manual fallbacks: career-history editor with "+ Add role" and a skills tag input.

**Step 5 — How You Can Help (skippable, final).** Profile photo (avatar uploader, uploads immediately), short bio (≤1000 chars), and a single mentoring opt-in checkbox: "I'm open to mentoring fellow alumni." When checked, a topics field activates (comma-separated, e.g. "consulting, business school, returning to Korea"). The CTA reads "Save and finish" (not "continue") to signal the end.

On completion, `users.onboarding_completed_at` is set and the user lands on `/`.

### 2.4 Account Lifecycle Recovery

Two recovery flows handle users who try to sign in to an account that isn't fully active:

**Reactivate (`/reactivate`)** — A user whose only memberships are `self_deactivated` (paused) lands here. A single card: "Welcome back. Your account is paused. Reactivate to get full access." with a "Reactivate my account" button and a "Sign out" escape.

**Cancel deletion (`/cancel-delete`)** — A user with a self-scheduled deletion lands here. The card states the scheduled deletion date, optionally shows the reason they gave, and offers "Cancel deletion and restore access." Admin-initiated deletions skip this screen — those users are rejected at sign-in with `?error=admin_deactivated`.

---

## 3. Member Home (`/`)

The first screen after sign-in. A Civic Editorial action surface that adapts based on the member's helper status, organization activity, and the time of day.

This section defines behavior and content priority. Visual execution belongs to [`docs/experience/screens/phase-1-screen-map.md`](docs/experience/screens/phase-1-screen-map.md) and the active design system in [`docs/experience/ui/design-system/`](docs/experience/ui/design-system/).

### 3.1 Hero Band

An editorial action band carrying the product voice:
- Time-aware greeting: "Good morning / afternoon / evening, {firstName}."
- A dynamic activity line below the greeting that shifts to a brand-accent color: "Your circle is active today." when there are pending mentor requests, new joiners this week, or upcoming events; otherwise "A quiet day in the circle."
- A one-sentence subline that combines the live signals into natural language: "3 mentees are waiting on your reply, and the Spring Mixer is in 2 days." Falls back to "Quiet across the network today. A good moment to refresh your profile or send an intro." when nothing is happening.
- Two CTAs: a primary button that toggles between "Review mentor requests" (if pending) and "Find someone to ask" (default), and an outline "Upcoming events" button.
- A four-tile stat strip: "New this week", "Open mentors", "Upcoming events", and the viewer's own cohort (e.g. "Class '24").

### 3.2 Latest Announcement Banner

If the org has a recent announcement, a horizontal card appears between hero and body: megaphone icon, "Latest announcement" eyebrow, title, 2-line body preview, relative timestamp, and an arrow. Clicking anywhere on the banner routes to `/announcements`.

### 3.3 Main Grid

On desktop, a 3-column grid: a 2-column main rail on the left and a 1-column sidebar on the right.

**Mentees waiting on you** *(left, helper-only)*. Hidden unless the viewer has `open_to_advice` or `open_to_mentorship` enabled. Shows pending mentor requests as cards — each with the mentee's name, "Class of 'XX" pill, a "Pending response" status badge, a quoted 3-line excerpt of their ask, a "Review request" primary button, and a "View profile" ghost button. The header offers a "View all N" link to `/inbox`. Empty state: an encouraging line plus a button to update helper preferences.

**New alumni in your area** *(left)*. The three most recent joiners as profile tiles. Each tile shows the editorial-style name, current title + employer, graduation year pill, and city. Tiles link to `/profile/{id}`. Empty state offers a "Browse the directory" link.

**Featured event** *(right top)*. The next upcoming event in a Civic Editorial card with a clear metadata header and "Featured event" eyebrow. Body: date/time, location, attendance count ("N / capacity attending"), and a "View event" button. Empty state: "Nothing on the calendar right now. See past events."

**Recent activity** *(right bottom)*. A list of up to four recent notifications, each as a row with a circle-icon avatar tinted to the notification type, a one-line label, and a relative timestamp. Unread rows have a soft accent background and a small dot. Clicking a row navigates to its target. Footer link: "View all" → `/notifications`.

---

## 4. People — The Alumni Directory (`/people`)

The product's directory and search surface. Two search modes share one results grid.

### 4.1 Search Surface

A page-leading card with two paths:

**Natural-language input.** A single large text field with placeholder "What kind of alumni are you looking for?" and an example below ("someone who can mentor me on a photography career in the US"). The helper line reads: "Reads career history, education, and skills — not just current title." Submitting triggers a Claude-backed pipeline: entity extraction → structured matching → reranking.

**Structured filters.** A collapsible "Filters" panel reveals a grid of inputs: city, employer, university, major, mentor topic, free-text keyword, graduation-year min/max, plus two toggle chips — "Only show mentors" and "Only people I know" (friend-aware). Checkboxes commit instantly; text fields commit on Enter or Search.

A "Clear all" button is always visible and resets every filter back to defaults. Active filters surface as removable chips above the results so the user can see what is currently constraining the search.

### 4.2 Search Feedback

NL queries run with a scripted stage banner so users understand that the model is doing real work:
- 0–300 ms: silent
- 300 ms: "Reading your search…"
- 1.0 s: "Looking through your circle…"
- 1.4 s+: "Reading career histories…"

While a search transitions, the previous results dim to ~60% opacity so the page doesn't blank out.

### 4.3 NL Summary Card

When an NL search completes, a summary appears above the grid: the original query in quotes, the filters Claude extracted as outline chips ("city: Seoul", "open to mentor", "class of '15–'20"), and a count: "Showing X of Y matched alumni, ranked by Claude." A rare fallback note may appear: "(Reranker hiccupped — falling back to default order.)" The summary is the user's window into *why* they got the results they got — transparency over magic.

### 4.4 Result Cards

A 3-column grid (2 on tablet, 1 on mobile). Each card shows:
- Avatar with a green dot overlay if the member is open to mentoring
- Name and (NL only) a small rerank-score badge
- "Title at Employer" with the employer emphasized
- A line of meta pills: graduation year, friendship signal (e.g. "Friend"), and mentor availability ("Open to mentor", "Mentorship full", "Paused while away")
- A short italic bio pull-quote in an editorial style
- City · School, Major in muted small text
- *NL only*: an expandable "Why this match?" disclosure containing a one-paragraph rationale plus a top career-history line

States:
- **No query, no filters**: "Type a question above or open the filters to browse alumni."
- **No matches**: "No alumni matched these filters." or "No candidates scored highly. Try a broader query."
- **Error**: a calm sentence pointing the user to the structured filters as a fallback.

Clicking a card opens `/profile/{id}`.

---

## 5. Profiles

### 5.1 Public Profile View (`/profile/[id]`)

Layout from top to bottom:

- **Hero**: a large avatar, name (editorial style), "Preferred name" if different, a graduation-year badge, the headline string, and — if the member is opted-in — a mentorship status badge: "Open to mentor" (positive), "Mentorship full right now" (warning), or "Paused while away" (warning).
- **Now**: current role and city.
- **Education**: university and major.
- **Bio**: free-form prose with optional mentoring-topic chips below it.
- **Career history**: list of past roles — employer, title, dates, and optional one-line description.
- **Education history**: schools, degrees, fields, dates.
- **Skills**: chip cloud from resume import or manual entry.
- **Links**: LinkedIn (other links may follow). Visibility-gated by the owner's privacy settings.

A sticky action cluster at the bottom of the hero contextualizes by viewer:
- **Self**: "Edit profile" button.
- **Other**: helper actions ("Ask for advice" and/or "Request mentorship", disabled with a reason if the helper is full or paused), plus friendship action ("Add friend", "Pending", "Cancel request", or "Remove friend"), and "Message" (only if currently friends).

Every section header uses the canonical uppercase eyebrow ("NOW", "CAREER HISTORY", etc.) so the page reads as a single editorial document.

### 5.2 Profile Edit (`/profile/me/...`)

A multi-card form on a single page (or a series of small pages — flow is unchanged either way):

- **Avatar uploader** at the top, in a light accent block. Drag-drop or click. Uploads immediately, independently of the rest of the form, so a user who only wants to add a photo can do that in one action.
- **Basics**: full name, preferred name, also-known-as, graduation year, city.
- **Work**: current employer, current title, headline.
- **Education**: university, major, plus an expandable list of additional schools.
- **Career history**: expandable list of roles (employer, title, dates, description).
- **Skills**: editable tag list.
- **Mentorship**: a single "I'm open to mentoring other alumni" checkbox with a small inline link to "Helper preferences" for finer-grained settings.
- **Links**: LinkedIn URL (others may follow).

A second card houses **privacy controls** — a dropdown per section (contact links, career history, education history, bio & mentoring topics, skills) with three tiers: **Org-visible**, **Friends only**, **Only me**. Defaults: org-visible for most; friends-only for contact links.

A "Danger zone" card at the bottom holds account deactivation and account deletion (which schedules with a grace period and surfaces `/cancel-delete`).

### 5.3 Resume Import (`/profile/import`)

Accessed from onboarding step 4 and from "Refresh from resume" on the edit page. The user uploads a PDF or DOCX. The system extracts career history, education, and skills (via Claude Haiku), then shows a **review screen** that displays extracted fields side-by-side with what's already on the profile. Each extracted field has a checkbox so the user can choose what to keep, change, or discard. No silent overwrites — the user always confirms before anything writes to their profile. "Save selected" applies the choices and returns to the calling page.

### 5.4 Helper Preferences (`/mentorship/settings`)

Accessed from the account menu and from profile-edit. The page lets a member tune *how* they help:

- Two top-level toggles: "Open to one-off advice" (unlimited, low-commitment) and "Open to ongoing mentorship" (subject to caps).
- When mentorship is turned off, a soft amber notice notes that younger alumni are looking for mentors and suggests keeping it on with low caps instead.
- Mentorship-specific fields below — dim when mentorship is off:
  - **Mentoring topics** (comma-separated; visible on profile)
  - **Screening prompt** (textarea shown to potential mentees before they request)
  - **Max active mentees** (number; current count shown alongside)
  - **Max pending requests** (number; current count shown alongside)
- If the member was auto-paused (14 days without responding to any pending request), a "Paused while away" badge appears with copy explaining the pause auto-lifts on next save or sign-in.
- "Save" commits; "Saving…" while pending; success state confirms.

---

## 6. Friendship

Friendship is a separate, mutual relationship — it does not gate viewing profiles, but it does gate direct messaging. Friend signals also surface in the People directory ("Only people I know" filter, friend badges on cards).

The flow:
1. On a profile, the viewer clicks "Add friend." The action sends an outgoing friend request, optionally with a short personal message.
2. The recipient sees the incoming request in `/inbox` under "Friend requests" and can Accept, Decline, or View profile.
3. On accept, both members appear in each other's friend list, the friend badge appears on cards, and the "Message" button unlocks on the other's profile.

Either party can remove a friendship later from the other's profile. Removing a friend closes the DM channel (the existing thread becomes read-only with a banner explaining so).

---

## 7. Asks — Advice & Mentorship

The product's center of gravity. All asks share one data model with a type discriminator (`advice` | `mentorship`).

### 7.1 Starting Asks and Request Lifecycle

Top-level `/ask` is no longer a destination; it redirects (308) to `/inbox`. The product has moved away from a standalone search-first ask picker:
- **Starting an ask**: A member initiates advice or mentorship requests directly from another member's profile page (`/profile/[id]`) using the context-aware CTA buttons ("Ask for advice" or "Request mentorship").
- **Tracking request state**: Sent requests, incoming requests, and active conversation threads are all managed centrally on the **Inbox** (`/inbox`) dashboard. Outgoing pending requests appear under the "Sent requests" section in the Inbox, which shows status badges (Pending, Accepted, Declined). Clicking any sent request opens its read-only detail page at `/ask/[id]`.

### 7.2 Composing An Ask (`/ask/new?to=…&type=…`)

Two parallel paths, both reaching the same submission action:

**Guided wizard (default).** A small step flow.
1. **Context** — "Tell me what you're working on." A textarea for 1–2 sentences. Helper's name is interpolated: "We'll use this to draft a note to {helperName}." A small "I know what to say" link skips to the direct form.
2. **Genre** *(mentorship only)*. Radio options: Career path, Industry intro, Decision review, School/academics, Skill question, Something else. Each has a short helper hint.
3. **Signals** *(only shown when there are shared attributes)*. Toggleable chips for things like same graduation year, same city, same school, same major, related mentoring topics. All pre-checked. The user can untick signals that aren't actually relevant; the draft will reflect that.
4. **Compose** — an auto-drafted opening message in a textarea, with buttons to regenerate variants or submit as-is.
   - For **advice**: a single `help_needed` field (the question).
   - For **mentorship**: `help_needed` (the ask) and `reason` (optional "why you" framing). Optional `background` if added in the direct form.
   - Failure copy: "Couldn't generate a draft right now — try again, or write it manually."

**Direct form (`?skip=1`).** A simpler version of the compose step.
- Advice: one textarea ("Their question").
- Mentorship: two textareas ("Why you specifically" optional + "What they're hoping to explore").

Submission creates the ask in `status=pending`. The helper receives a notification (in-app + email).

### 7.3 Ask Detail (`/ask/[id]`)

A read-only card showing the full ask. The viewer's role flips the framing.

**Helper view (recipient).** Title: "Request from {name}." Below: type and status badges, sent date, and (if applicable) responded date. Then the helper's headline. The fields display per type:
- Advice: just "Their question."
- Mentorship: "Why you specifically" (if present), "What they're hoping to explore," and "Anything else" (if present).

Action buttons depend on status:
- Pending → **Accept** and **Decline** (both confirm with a short modal).
- Accepted → **Open thread** linking to `/ask/thread/{threadId}`.
- Declined / Expired → no actions; the card is purely a record.

**Asker view (sender).** Title: "Your request to {name}." Same fields, read-only. The button cluster shows "View their profile" and, if accepted, "Open thread."

On accept, a thread is created and the asker is notified. On decline, the helper may optionally include a respectful note ("Not the right fit right now") which the asker sees on the detail page.

### 7.4 Ask Thread (`/ask/thread/[id]`)

Live conversation tied to an accepted ask.

- **Header**: the other person's avatar, name, and a role label — "You're the Mentor / Mentee / Helper / Asker in this conversation." A link opens the other person's profile.
- **Original ask summary**: a muted card pinning the original "why" and "help" fields at the top so context never drifts.
- **Messages**: chronological, oldest to newest, with bubbles (right-aligned + brand color for self, left-aligned + muted for the other person). Each message has a small avatar and a relative timestamp. Empty state: "No messages yet. Say hello."
- **Composer**: a textarea ("Type a message…") with a Send button. On send, the form clears and refocuses. Failures display a calm error message above the button.

Inactive threads (helper auto-paused, ask closed, friendship broken) display a clear read-only banner instead of the composer.

### 7.5 Mentor Inactivity Auto-Pause

If a member with helper preferences enabled goes 14 days without responding to any pending request, the system flips their status to "Paused while away" automatically. This is communicated everywhere it matters: on the member's profile, in helper preferences (with an explanation), and to anyone who tries to send them a new request (the helper buttons become disabled with a reason). The pause auto-lifts on next sign-in or when the member saves any helper-preferences change.

---

## 8. Inbox (`/inbox`)

A single unified surface for everything waiting on the member. The page explains: "Asks, friend requests, direct messages, and your open threads — everything in one place."

Six sections, top to bottom:

**Friend requests.** Incoming requests with avatar, name, "Friend request" badge, an italic quoted message if attached, and three actions: Accept, Decline, View profile. Empty: "No friend requests."

**Incoming asks.** Each row shows avatar, name, ask-type badge, "Awaiting your response" status, and the 2-line ask summary. Clicking opens `/ask/{id}`. Empty: an empty-state card with an icon, a reassuring sentence, and a link to "Update what you can help with" → helper preferences.

**Active threads.** Conversations that began with an accepted ask. Each row shows the other party's avatar, name, your role in the thread, and a relative timestamp. Click → `/ask/thread/{id}`. Empty: "Once an ask is accepted, your conversation will appear here."

**Direct messages.** Threads with friends. Each row shows avatar, name, last-message snippet (prefixed with "You:" when the viewer sent the last message), an unread count badge, and a relative timestamp. Unread rows render in heavier weight. Empty: "Find an alum and add them as a friend to start a thread." with a link to `/people`.

**Your sent asks.** A list of the 20 most recent advice or mentorship requests you've sent. Empty: "You haven't sent any asks yet" with a link to find people (`/people`).

**Sent friend requests.** Outgoing friend requests awaiting reply. Rows mirror the incoming-requests format but without action buttons — just "View profile." This section hides itself when empty.

Across sections, status colors are consistent with the rest of the product: pending/awaiting = warning, accepted = success, declined/expired = alert, info-blue for role/active states, muted for neutral.

---

## 9. Direct Messages (`/messages/[id]`)

Per-thread DM viewer. Reachable from `/inbox`, from a profile's "Message" button, or from a notification.

- **Header**: the partner's avatar, name, headline, and (if applicable) a "Read-only" indicator if the friendship has been removed.
- **Body**: messages chronological, self right-aligned, partner left-aligned. Realtime subscription pulls new messages live; outgoing messages render optimistically so they appear instantly even on slow networks.
- **Composer**: a textarea at the bottom and a Send button when the friendship is active. When read-only, the composer is replaced by a small explanatory line.

The root `/messages` URL redirects (308) to `/inbox` — the inbox is the canonical list; the `/messages/[id]` route is just the conversation viewer.

---

## 10. Events (`/events`)

### 10.1 Events List

A header naming the organization and the upcoming-events count, then two tabs: **Upcoming** and **Past** (each with a count). On wide viewports the list and the detail panel sit side by side; on narrow viewports the list scrolls to a full-width detail view when a card is selected.

Each list card shows:
- Title
- Date and time
- Location
- Two RSVP buttons: **Going** and **Not going**.

When the event is at capacity, "Going" relabels to **Join waitlist**. Once the viewer has RSVP'd, the active state shows a checkmark and a filled style. Selecting a card opens the detail view.

### 10.2 Event Detail (`/events/[id]`)

Full title, formatted date and time, location, and a capacity indicator ("12 / 20 going" or a waitlist count). If the viewer is waitlisted, an inline banner says so and shows their position. The RSVP buttons mirror the list. Additional actions: **Add to calendar** (iCal download) and, for admins, **Edit**.

Below the meta are two cards:
- **Who's going** — a grid of attendee avatars with names and graduation years, capped at 50 with an "N more" overflow chip.
- **Waitlist** (if any) — names with their position numbers, in order.

Event-canceled notifications display in the recent-activity feed and in `/notifications` with destructive-toned iconography.

---

## 11. Announcements (`/announcements`)

A vertical archive feed. Header: "News and updates from {Organization}." Each entry is a card with title, relative timestamp (hover for full date), author name in small text, and body (preserved whitespace). Detail pages (`/announcements/[id]`) repeat the same layout at full width. Empty state offers admins a "Post the first one" CTA.

Announcement banners surface on the member home (latest only) and through email if the admin opts to broadcast at publish time.

---

## 12. Notifications

### 12.1 Bell Popover

The bell in the header shows an unread badge (`9+` past nine). Clicking opens a popover with up to 15 recent notifications, newest first. Each row carries an icon tinted to the category (sapphire for asks/messages, emerald for friendship, amber for announcements, red for canceled events), a one-line label like "Sara requested mentorship," and a relative timestamp. Unread rows have a soft background tint.

A **"Mark all as read"** button appears at the top when there's anything unread. Clicking any row marks it read optimistically and routes to its target. A **"See all"** link at the bottom opens `/notifications`.

Realtime: high-signal notifications (friend request, new mentor request, DM, ask response) prepend live, bump the badge, and surface a small auto-dismissing toast in the top-right.

### 12.2 Notification Page (`/notifications`)

A full-page archive of the last 100 notifications with the same row layout. Used to find something the popover dropped off the bottom.

---

## 13. Admin (`/admin/*`)

Admin tools live behind a `requireAdmin` gate. The admin shell has its own horizontal tab bar (Invite, Approvals, Members, Events, Announcements, Analytics) with a pending-count badge on Approvals. `/admin` itself redirects to `/admin/invite`.

### 13.1 Invite (`/admin/invite`)

Two tabs:

**Single invite.** Email (required), graduation year (optional, 4-digit), full name (optional). Submit sends a one-time-link email via Resend with the org-branded sender. Inline success: "Invite sent to {email}."

**CSV upload.** Drag-drop or browse to a CSV with columns for email, full name, graduation year. The admin sees a preview table, can fix or skip rows, and confirms to fan out. Background job processes the queue.

Below the tabs, a **Recent invites** table shows the last 50 with email + name, status badge (pending / accepted / expired / revoked), sent date, and accepted date. Empty state: "No invites yet. Send your first invites with the form above."

### 13.2 Approvals (`/admin/approvals`)

Visible only when the org has approval mode enabled. A top badge indicates current mode: **Approval required** vs **Auto-approve**. If auto-approve is on, an info banner explains the implication and links to `/admin/members` to flip the setting.

The queue lists every pending member as a wide row:
- Name (bold) + graduation-year pill + email
- Current title and employer (or "no current role")
- City + university + major
- Bio (2-line clamp)
- Links (LinkedIn if present), "signed up 3 hours ago," "invite sent X days ago" or "(no matching invite)" when a user signed up through some other path
- A button cluster on the right: **Approve** (success) and **Reject** (destructive). Both confirm with a short modal.

Empty: "No one's waiting. Pending members will show up here as they sign up."

### 13.3 Members (`/admin/members`)

The directory's admin view.

- A **mode toggle** card at the top flips approval mode on/off with explanatory copy.
- A summary badge row: "N active," "N pending," "N revoked," "N open mentors."
- A members table with columns: Name (linked) + mentor pill if applicable, graduation year, city, employer, status badge (active / pending / rejected / revoked / self-paused), profile-completion percent (color-coded), joined date, and a row-actions dropdown.

Row actions vary by state: View profile, Approve (pending), Revoke, Reactivate, Schedule deletion, Cancel scheduled deletion, Resend invite.

Empty: "No one's joined yet. Send your first invites."

### 13.4 Events (`/admin/events`)

A **Create event** form at the top: title (≤200 chars), start datetime, end datetime (optional), location, description, capacity (optional integer), and a "Save as draft" toggle. Drafts are visible only to admins; publishing makes the event live and notifies the org.

Below the form, an **Events** table with tabs for Upcoming and Past:
- Title (linked) with badges for "past," "canceled," and "N waitlisted" where relevant
- When (date/time)
- Location
- Going (count) / Capacity (or `∞` when uncapped)
- Edit action linking to `/admin/events/[id]/edit`

The edit page mirrors the create form with prefilled values and adds two extra actions: **Cancel event** (notifies attendees, shows a destructive confirmation) and **Delete event** (irreversible, confirms via typed confirmation).

### 13.5 Announcements (`/admin/announcements`)

A compose form: title (≤200), body (≤5000), and a single critical toggle — **"Email this to every active member."** Off by default. Submit publishes and (optionally) fans out emails via the worker queue. Success copy includes a count: "Announcement published. Emailed N of M members."

Below, a list of the last 30 announcements with title, relative published time, and body preview (2–3 lines, preserving whitespace).

### 13.6 Analytics (`/admin/analytics`)

A community-health snapshot. Header: "A snapshot of community health for {orgName}. Most metrics cover the last 30 days." A grid of six metric cards, each with:
- Uppercase label (e.g. "Signups this week")
- Large value
- Trend indicator (↑ / ↓ / —) with comparison context ("↑ 8% from last week")
- A small footnote explaining the metric

Metrics shown: signups, invite-to-join conversion, active members (7-day), mentorship requests sent, accept rate, average profile completeness, event RSVPs. A footer line reads "Computed 3 hours ago. Refresh to recompute." The page is deliberately read-only — no charts that require drill-down. The intent is *signal at a glance*, not analyst workbench.

---

## 14. Cross-Cutting Behaviors

### 14.1 Privacy

- Defaults: name, graduation year, city, employer, title, university, and major are org-visible. Contact links default to friends-only.
- Members can downgrade any of those sections via the privacy controls on profile-edit.
- The product never shows hidden fields to viewers who shouldn't see them, even when admins query. Admin views show the same field-level gating, with the exception that admins always see status and contact email for moderation.

### 14.2 Notifications & Email

Every state transition that matters for someone else triggers both an in-app notification and (where helpful) a transactional email through Resend, sent from an org-branded address. Examples:
- Friend request received / accepted
- Ask received / accepted / declined
- New direct message
- New ask thread message
- Announcement published (only if the admin opts to email)
- Event canceled

### 14.3 Search Visibility

A member must complete onboarding step 1 to be searchable. Members with `self_deactivated` membership status are filtered out of the People directory, list cards, and search. Deleted users disappear entirely.

### 14.4 Mobile Responsiveness

Every member-facing page is fully responsive. The desktop nav collapses to a hamburger on narrow widths. Master-detail layouts (events, inbox) stack on mobile and fold the secondary panel inline. Admin tables, by contrast, are desktop-primary; on phones they scroll horizontally — admin workflows assume a laptop.

### 14.5 Empty And Error States

Every list and panel has an explicit empty state. The pattern is: a small icon in an accent circle, a one-line reassuring title, an optional one-sentence description, and a next-action button when there is one to offer. Errors use the same scaffolding but with a destructive icon tone and a calm sentence that names the cause when known.

### 14.6 Realtime

DM threads and the notification bell subscribe to Supabase Realtime. New messages append optimistically; new notifications prepend live. Polling is avoided everywhere it can be.

### 14.7 Accessibility

- Keyboard focus is visible everywhere via a consistent ring style.
- All controls have visible labels (no placeholder-only fields).
- All non-text content has alt text or aria-labels.
- Reduced-motion preferences are respected — decorative motion is static, and transitions stay short.
- Forms surface invalid state via both color and aria-invalid.
- Touch targets meet 40px minimums.

---

## 15. Workflows In One Glance

Three end-to-end loops describe what BridgeCircle is actually *for*. The redesign must preserve all three.

**Asker loop.** Member signs in → home shows time-aware greeting → either clicks a hero CTA or opens **People** → searches in natural language or filters → opens a profile or starts an ask from the search row → wizard or direct compose → submits → tracks status in **/inbox** → on accept, opens the thread → conversation continues until the asker has what they needed.

**Helper loop.** Member opts in via **Helper preferences** → receives requests in **/inbox** (also surfaced on home as "Mentees waiting on you") → reviews each ask in detail → accepts or declines → on accept, threads continue in `/ask/thread/[id]` → if the member goes idle, the system auto-pauses them and resumes when they come back.

**Admin loop.** Admin signs in → opens `/admin/invite` to send invites individually or by CSV → optionally approves new joiners via `/admin/approvals` → manages the directory in `/admin/members` → publishes events and announcements → checks community health in `/admin/analytics`.

A successful redesign keeps these three loops intact and lets each one feel warmer, safer, and more legible than it does today.

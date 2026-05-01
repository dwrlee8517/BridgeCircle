# Current UI/UX Flow Review

Captured: May 1, 2026

Context: local BridgeCircle dev server at `localhost:3000`, using seeded dev accounts from `docs/seed-dev.md`. Desktop viewport only. Loopback host variants (`127.0.0.1`, `[::1]`, and `0.0.0.0`) were used only to isolate browser cookies while capturing different personas against the same running dev server.

No destructive or state-changing flows were submitted. The archive avoids publishing events or announcements, accepting or declining mentorship, changing RSVP state, deactivating users, deleting users, or changing approval mode. Admin invite and member screenshots were framed to avoid preserving unnecessary non-seed email addresses.

## Account Coverage

| Persona | Account | Flows captured |
| --- | --- | --- |
| Iris Incomplete | `incomplete-iris@example.com` | Incomplete onboarding |
| Sam Student | `student-sam@example.com` | Sign-in, home, discovery, profile, community, outgoing mentorship |
| Mark Mentor | `mentor-mark@example.com` | Mentor inbox, request detail, notifications surface |
| Amy Admin | `admin-amy@example.com` | Admin invite, approvals, members, events, announcements, analytics |

## Auth And Onboarding

### 01. Sign In

![Sign in](screenshots/current-ui-ux/01-auth-sign-in.png)

Shows the current auth card, Google option, email/password form, and restrained card styling.

### 02. Incomplete Onboarding

![Incomplete onboarding](screenshots/current-ui-ux/02-onboarding-incomplete-profile.png)

Shows Iris' incomplete profile flow with required identity, work, education, skills, mentorship, and optional profile fields on one long page.

## Member Discovery

### 03. Home Dashboard

![Home dashboard](screenshots/current-ui-ux/03-home-dashboard.png)

Shows the member landing page and its current mix of events, suggested people, announcements, and directory entry points.

### 04. Search Directory

![Search directory](screenshots/current-ui-ux/04-search-directory.png)

Shows the main directory experience with natural-language search, quick filters, and member result cards.

### 05. Search Filters Open

![Search filters open](screenshots/current-ui-ux/05-search-filters-open.png)

Shows the structured filters expanded, including city, employer, university, major, mentor topic, grad year range, keyword, and mentors-only toggle.

### 06. Mentor Profile

![Open mentor profile](screenshots/current-ui-ux/06-profile-open-mentor.png)

Shows an open mentor profile as a decision surface, including identity, work/education context, mentor status, and profile details.

### 07. Mentorship Request Form

![Mentorship request form](screenshots/current-ui-ux/07-mentorship-request-form.png)

Shows the request form before submission, with the mentor context and text fields for the ask and expected help.

## Community

### 08. Events List

![Events list](screenshots/current-ui-ux/08-events-list.png)

Shows upcoming events, RSVP buttons, capacity information, and the right-rail "Next 7 days" summary.

### 09. Event Detail

![Event detail](screenshots/current-ui-ux/09-event-detail.png)

Shows the event detail page with schedule, location, RSVP controls, calendar download, and attendee list area.

### 10. Friends Empty State

![Friends empty state](screenshots/current-ui-ux/10-friends-empty.png)

Shows how the app explains an empty friends list and directs the member back toward discovery.

### 11. Messages Empty State

![Messages empty state](screenshots/current-ui-ux/11-messages-empty.png)

Shows the direct-message empty state and its current path back to friends/search.

### 12. Announcements List

![Announcements list](screenshots/current-ui-ux/12-announcements-list.png)

Shows member-facing announcements and the current density of announcement metadata/content.

## Profile Management

### 13. Edit Profile Top

![Edit profile main](screenshots/current-ui-ux/13-profile-edit-main.png)

Shows the profile edit surface, import entry point, avatar area, and early profile fields.

### 14. Edit Profile Lower And Privacy

![Edit profile privacy](screenshots/current-ui-ux/14-profile-edit-privacy.png)

Shows lower profile sections and privacy controls after scrolling within the edit page.

### 15. Resume Import

![Resume import](screenshots/current-ui-ux/15-resume-import.png)

Shows the resume import entry point and the promise that extracted data remains reviewable before saving.

### 27. Mentor Settings

![Mentor settings](screenshots/current-ui-ux/27-mentor-settings.png)

Shows the mentor availability and preference settings surface without changing saved settings.

## Mentor Workflow

### 16. Mentor Inbox Requests

![Mentor inbox requests](screenshots/current-ui-ux/16-mentor-inbox-requests.png)

Shows Mark's incoming request row for the seeded Sam request. This image is cropped to avoid preserving unrelated local dev request content.

### 17. Mentor Request Detail

![Mentor request detail](screenshots/current-ui-ux/17-mentor-request-detail.png)

Shows the mentor's request review page with accept/decline actions visible but not used.

### 18. Notifications Surface

![Notifications surface](screenshots/current-ui-ux/18-notifications-popover.png)

The notification bell did not render an open popover during Browser capture, so this records the notifications surface header as the current-state fallback. Treat the bell popover behavior as a follow-up verification item.

## Admin

### 19. Invite Form

![Admin invite form](screenshots/current-ui-ux/19-admin-invite-form.png)

Shows the single-invite admin form and CSV tab area. The image is framed above the recent-invites rows to avoid preserving personal-looking email addresses.

### 20. Approvals

![Admin approvals](screenshots/current-ui-ux/20-admin-approvals.png)

Shows the approval queue empty state and the relationship between approval mode and member approvals.

### 21. Members Overview

![Admin members overview](screenshots/current-ui-ux/21-admin-members-overview.png)

Shows the operational member table columns for year, city, employer, status, profile completion, joined date, and actions. The name/email column is intentionally excluded from this archive frame.

### 22. Admin Events

![Admin events](screenshots/current-ui-ux/22-admin-events.png)

Shows event creation and the admin event table with event status, attendance, capacity, and edit access.

### 23. Admin Event Edit

![Admin event edit](screenshots/current-ui-ux/23-admin-event-edit.png)

Shows the event edit form and destructive controls present on the page. No edit, cancel, or delete action was submitted.

### 24. Admin Announcements

![Admin announcements](screenshots/current-ui-ux/24-admin-announcements.png)

Shows the announcement composer and existing announcement management surface without publishing anything.

### 25. Admin Analytics

![Admin analytics](screenshots/current-ui-ux/25-admin-analytics.png)

Shows the current admin analytics dashboard, including member activity, mentorship, profile freshness, and event RSVP metrics.

## Student Outgoing Mentorship

### 26. Outgoing Requests

![Student outgoing requests](screenshots/current-ui-ux/26-student-outgoing-requests.png)

Shows Sam's sent mentorship request list and the pending request state.

## UI/UX Suggestions

1. Make home more action-oriented. The dashboard should prioritize what a member can do next: respond to pending requests, meet suggested people, finish profile setup, join upcoming events, or help someone.
2. Regroup navigation around user jobs. The current top nav gives Search, Inbox, Messages, Friends, Events, and Announcements similar weight. Consider grouped areas such as Discover, Mentorship, Events, Messages, and Admin.
3. Enrich search cards with match reasons and quick actions. Add "why this person matches", shared context, mentor capacity/availability, and direct actions such as request mentorship or add friend.
4. Redesign profile pages as decision pages. Profiles should make it faster to decide whether to connect: stronger identity header, role/location summary, shared context, mentor availability panel, and a persistent primary CTA.
5. Break onboarding and profile edit into guided sections. Add a completion meter, section anchors, sticky save status, and a stronger resume-import path so long forms feel less like a single administrative task.
6. Improve empty states with next actions. Friends and messages already explain the blank state; make the primary next action more prominent and contextual, such as suggested classmates or a search prefilter.
7. Add stronger admin filtering and operational affordances. Members and invites need search, filters, sort, resend/copy/revoke controls, status grouping, and less horizontal scanning.
8. Move beyond generic blurple dashboard styling. The app is clean and consistent, but it can feel like a generic SaaS dashboard. A warmer alumni-network identity could use richer status colors, stronger avatar/event/location cues, and more human community signals.

## Verification Notes

- All planned PNG screenshots plus the additional mentor-settings screenshot exist under `docs/screenshots/current-ui-ux/`.
- All images are non-empty PNG files.
- Relative image links in this document point to the archive directory.
- The archive is documentation-only; no app code, schema, API, or public interface files were intentionally changed.

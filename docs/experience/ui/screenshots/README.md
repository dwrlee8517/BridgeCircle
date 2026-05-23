# Screenshots

Current clean screenshot capture:

`output/playwright/fresh-screenshots-2026-05-24-clean/`

Manifest:

`output/playwright/fresh-screenshots-2026-05-24-clean/manifest.json`

Generated: 2026-05-24.

Environment:

- App: `http://localhost:3001`
- Viewports: desktop `1440x1000`, tablet `900x1000`, mobile `390x844`
- Authenticated account: seeded admin member `admin-amy@example.com`
- Capture method: Playwright Chromium with full-page screenshots and dev overlay
  hidden.

Current member-nav coverage:

| Surface | Desktop | Mobile | Tablet |
|---|---|---|---|
| Home | `desktop-home.png` | `mobile-home.png` | `tablet-home.png` |
| Ask | `desktop-ask.png` | `mobile-ask.png` | - |
| Help | `desktop-help.png` | `mobile-help.png` | - |
| People | `desktop-people.png` | `mobile-people.png` | `tablet-people.png` |
| School | `desktop-school.png` | `mobile-school.png` | - |
| Inbox | `desktop-inbox.png` | `mobile-inbox.png` | `tablet-inbox.png` |

Interaction coverage includes:

- desktop account menu
- desktop and mobile notification popovers
- mobile navigation menu
- People mentorship filter
- Inbox request and DM tabs

Supporting-route coverage includes auth, ask composer, event detail, profile,
profile edit/import, helper settings, and admin surfaces. These are supporting
screens, not the core member navigation.

The previous May 22 screenshot set has been archived under
[`../../_archive/screenshots-2026-05-22/`](../../_archive/screenshots-2026-05-22/).

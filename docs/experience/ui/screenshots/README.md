# Screenshots

Current screenshot set for the Civic Editorial implementation.

Generated: 2026-05-22.

Environment:
- App: `http://localhost:3000`
- Viewports: desktop `1440x1000`, mobile `390x844`
- Authenticated account: seeded admin member `admin-amy@example.com`
- Browser path: the in-app browser was used to verify the user's current view.
  Canonical captures were regenerated with Playwright because the in-app
  browser viewport override did not map one-to-one to CSS pixels in this
  session.

Coverage:

| Surface | Desktop | Mobile |
|---|---|---|
| Auth sign-in | `auth-sign-in-desktop.png` | `auth-sign-in-mobile.png` |
| Home | `home-desktop.png` | `home-mobile.png` |
| People | `people-desktop.png` | `people-mobile.png` |
| Inbox | `inbox-desktop.png` | `inbox-mobile.png` |
| Events | `events-desktop.png` | `events-mobile.png` |
| Profile | `profile-desktop.png` | `profile-mobile.png` |
| Admin invite | `admin-desktop.png` | `admin-mobile.png` |

QA notes:
- Every captured route returned HTTP 200.
- No Next.js error overlay was present.
- No browser console warnings or errors were recorded during the authenticated
  route check.
- The admin route redirects from `/admin` to `/admin/invite`; screenshots use the redirected invite screen.
- The `/profile/me` route redirects to the signed-in member's canonical profile
  URL before capture.
- Next.js dev overlay UI is hidden during capture so screenshots show product UI
  only.

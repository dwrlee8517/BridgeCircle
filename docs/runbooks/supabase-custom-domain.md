# Supabase Custom Domain (`auth.bridgecircle.org`)

**Status: planned — nothing below has been executed yet.** Every step in this runbook is a manual dashboard/DNS action; none of it is reproducible from the repo. When you execute it, tick the checklist in [`../architecture/environments.md`](../architecture/environments.md) → "Manual Production Configuration → Supabase custom domain" and flip this line to "executed on <date>".

## Why

The Google OAuth consent screen for production says **"Sign in to edumxwzilfgvamzarwvo.supabase.co"**. Google displays the domain of the OAuth `redirect_uri`, and our redirect URI is Supabase's callback at `<project-ref>.supabase.co/auth/v1/callback` — so members see a random-looking third-party domain at the exact moment we're asking them to trust us with their Google account. For a product whose whole pitch is *verified, trusted* community, that's the worst possible place to look sketchy.

The fix is Supabase's **custom domain add-on**: front the prod project's API with `auth.bridgecircle.org`, so the redirect URI (and therefore the consent screen) shows our domain.

**Scope note on the name:** the custom domain fronts the *entire* Supabase API gateway — Auth, PostgREST, Storage, Realtime — not just auth. Once `NEXT_PUBLIC_SUPABASE_URL` points at it, all Supabase traffic from the app flows through it. We still choose `auth.bridgecircle.org` (over `api.`) because the one place humans ever read this hostname is the Google consent screen, and "auth" is what reads honestly there.

## Cost and prerequisites

- **$10/month add-on** on the prod project (`bridgecircle`, ref `edumxwzilfgvamzarwvo`). Requires a paid plan — the org is already on Pro.
- Access needed: Supabase dashboard (prod project), Cloudflare DNS for `bridgecircle.org`, Google Cloud Console (the OAuth client), Railway Variables.
- The Supabase MCP in this repo is pinned to the **dev** project by policy. Do all prod steps below via the dashboard, or via the CLI with the prod ref typed explicitly (`--project-ref edumxwzilfgvamzarwvo`) — same rule as prod migrations.

## Known side effect: one-time sign-out of everyone

`@supabase/ssr` derives the auth cookie name from the first DNS label of the Supabase URL: today `sb-edumxwzilfgvamzarwvo-auth-token`, after the switch `sb-auth-auth-token`. Existing session cookies stop being read the moment Railway redeploys with the new URL, so **every signed-in member is signed out once** and signs back in normally. No data is affected. Do the cutover at a quiet hour and don't ship it bundled with other risky changes.

## Procedure

Order matters in exactly one place: **the Google client must know the new redirect URI before you activate the domain** (step 5 before step 6). Everything else is sequential plumbing.

### 1. Enable the add-on and register the hostname (maintainer, Supabase dashboard)

Supabase dashboard → prod project (`edumxwzilfgvamzarwvo`) → **Settings → Custom Domains** (enable the $10/mo add-on when prompted; billing is per-project). Enter `auth.bridgecircle.org`.

CLI equivalent (needs `supabase login` first):

```bash
pnpm dlx supabase domains create --project-ref edumxwzilfgvamzarwvo \
  --custom-hostname auth.bridgecircle.org
```

Either path returns the DNS records you need for step 2 — a CNAME target and a TXT ownership/ACME challenge value. Copy them.

### 2. Add the DNS records (maintainer, Cloudflare dashboard)

In the `bridgecircle.org` zone, add:

| Type | Name | Value | Proxy status |
|---|---|---|---|
| CNAME | `auth` | `edumxwzilfgvamzarwvo.supabase.co` | **DNS only (gray cloud)** |
| TXT | `_acme-challenge.auth` | value from step 1 | n/a |

**DNS only is mandatory**, not just consistent with the rest of the zone: Supabase provisions and terminates TLS for the custom domain itself (via its own Cloudflare SSL-for-SaaS setup). Proxying the CNAME (orange cloud) breaks certificate issuance and WebSocket (Realtime) connections — same reason the Railway CNAME is gray-clouded.

Don't paste the TXT value into any doc — it's shown in the Supabase dashboard, which is authoritative.

### 3. Verify and wait for the certificate

Dashboard: click **Verify** on the Custom Domains page. CLI:

```bash
pnpm dlx supabase domains reverify --project-ref edumxwzilfgvamzarwvo
```

May need several attempts; allow up to ~30 minutes for DNS propagation + SSL certificate issuance. **Do not activate yet.**

### 4. Check Google consent-screen authorized domains (maintainer, Google Cloud Console)

Google Cloud Console → **APIs & Services → OAuth consent screen** (Branding): confirm `bridgecircle.org` is listed under **Authorized domains**; add it if missing. Google rejects redirect URIs whose domain isn't authorized for apps in production.

While you're there: setting the **app name and logo** on the consent screen is the complementary half of this fix (Google shows the app name above the domain line). The logo triggers Google's brand-verification review — optional, do it whenever, it doesn't block this runbook.

### 5. Add the new redirect URI to the Google OAuth client (maintainer, Google Cloud Console)

**APIs & Services → Credentials → the OAuth 2.0 client** → Authorized redirect URIs. **Add** (do not replace):

```
https://auth.bridgecircle.org/auth/v1/callback
```

Keep both existing URIs:

- `https://edumxwzilfgvamzarwvo.supabase.co/auth/v1/callback` — the raw prod domain keeps working after activation (see rollback), so keep its URI registered.
- `https://ojpvahiuafdcynbdbmri.supabase.co/auth/v1/callback` — dev stays on the raw domain (see "Dev project" below).

No client ID or secret changes — the Supabase Google provider config (Auth → Providers → Google) is untouched.

### 6. Activate the domain

Dashboard: **Activate** on the Custom Domains page. CLI:

```bash
pnpm dlx supabase domains activate --project-ref edumxwzilfgvamzarwvo
```

From this point Supabase serves the API on `auth.bridgecircle.org` **and** continues serving `edumxwzilfgvamzarwvo.supabase.co` — activation adds a domain, it doesn't retire the old one. Nothing user-visible changes yet because the app still points at the raw URL.

### 7. Supabase Auth URL configuration — no change (verify only)

**Authentication → URL Configuration** stays exactly as it is: **Site URL** `https://bridgecircle.org`, redirect allowlist containing `https://bridgecircle.org/auth/callback`. Those values describe where Supabase sends users *after* auth (the app), not where Supabase itself is hosted — the custom domain doesn't appear here. Glance at it during the cutover to confirm nothing drifted, but there is nothing to edit.

### 8. Point the app at the custom domain (maintainer, Railway dashboard)

Railway → BridgeCircle service → Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://auth.bridgecircle.org
```

Keys are unchanged — `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` are project-scoped and valid on both domains. Trigger a redeploy (Variables are read at container start). This is the moment everyone gets signed out once (see above).

Leave local `.env.local` alone — it points at the dev project, which isn't getting a custom domain.

### 9. Verify

- In an incognito window, go to `https://bridgecircle.org/sign-in` → **Continue with Google**. The consent screen should now read **"Sign in to auth.bridgecircle.org"** (or the app name, if branding is set) — not the Supabase ref.
- Complete the sign-in; confirm you land back in the app (proves the Supabase → app redirect allowlist still works).
- Click around: directory, avatars, an inbox thread. Avatars stored before the cutover keep their old `…supabase.co/storage/…` URLs — those still resolve because the raw domain stays active. New uploads will get `auth.bridgecircle.org` URLs; both render fine (avatar `<Image>`s are `unoptimized`, so no `next.config.ts` image-domain change is needed).
- Check Sentry for a spike after the redeploy.

## Rollback

Set `NEXT_PUBLIC_SUPABASE_URL` back to `https://edumxwzilfgvamzarwvo.supabase.co` in Railway and redeploy. The raw domain never stopped working and its Google redirect URI was never removed, so this is a pure env-var revert (it costs everyone one more sign-out, since the cookie name flips back). Deactivating/deleting the custom domain itself (`supabase domains delete`) is only needed if you're abandoning the approach and want to stop paying the add-on.

## Dev project (`ojpvahiuafdcynbdbmri`) — deliberately left on the raw domain

The dev consent screen shows `ojpvahiuafdcynbdbmri.supabase.co`, and that's fine: the only people who ever see it are the two maintainers signing into localhost. A second custom domain would cost another $10/mo and another DNS + Google-client round-trip for zero member-facing benefit. If a real need appears (e.g. demoing off dev to outsiders), repeat this runbook against the dev ref with a hostname like `auth-dev.bridgecircle.org` — the steps are identical.

## References

- [Supabase custom domains guide](https://supabase.com/docs/guides/platform/custom-domains)
- Sibling manual-config inventory: [`../architecture/environments.md`](../architecture/environments.md) "Manual Production Configuration"

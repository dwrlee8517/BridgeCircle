# BridgeCircle Day-0 Setup

## Purpose

Get the foundation installed, deployed, and proven working in one sitting (~4–6 hours). Before end of day 0:

- Next.js scaffolded with TypeScript, Tailwind, shadcn/ui
- Supabase project with Google OAuth configured
- Railway hosting a live "hello world" at a real URL
- Sentry catching production errors
- `/lib` folder discipline in place so business logic stays framework-agnostic from day one

No real features yet. Just the runway so the rest of the build has no infra surprises.

## Prerequisites

Accounts (create before starting):

- GitHub (you have this)
- Supabase — supabase.com
- Railway — railway.app
- Google Cloud Console (for OAuth client) — console.cloud.google.com
- Sentry — sentry.io

Local:

- Node.js 20+ (`node -v`)
- pnpm (`npm i -g pnpm`)
- git (you have this)

## Step 1: Scaffold Next.js

```bash
cd ~/Desktop/BridgeCircle
pnpm create next-app@latest app \
  --typescript --tailwind --app \
  --eslint --src-dir --import-alias "@/*" \
  --use-pnpm
```

Creates `app/` alongside your existing `docs/`.

Verify:

```bash
cd app
pnpm dev
```

Opens at http://localhost:3000.

## Step 2: Install day-0 dependencies

```bash
pnpm add @supabase/supabase-js @supabase/ssr \
  @tanstack/react-query \
  react-hook-form @hookform/resolvers zod \
  date-fns \
  @sentry/nextjs \
  lucide-react
```

Dev:

```bash
pnpm add -D @biomejs/biome vitest @testing-library/react
```

## Step 3: Install shadcn/ui

```bash
pnpm dlx shadcn@latest init
# accept defaults, dark mode: yes
pnpm dlx shadcn@latest add button input textarea select \
  card dialog tabs table avatar badge toast \
  dropdown-menu radio-group checkbox label form
```

Components land in `src/components/ui/` — you own the code.

## Step 4: Supabase project

1. Create project at supabase.com (free tier)
2. Region: closest to first users (US-West for Palos Verdes, AP-Northeast for Songdo — pick one, revisit when both orgs launch)
3. Settings → API → copy `URL`, `sb_publishable_...` key, `sb_secret_...` key
   - The legacy `anon` / `service_role` JWT keys are deprecated — use the new `sb_publishable_` / `sb_secret_` format
4. Authentication → Providers → enable Google
5. Follow Supabase's Google OAuth guide to create the Google Cloud OAuth client

Add to `app/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...  # server-only, never ship to client
```

`.env.local` is already in `.gitignore` by default — verify it is.

## Step 5: Folder structure

Extend the Next.js scaffold to this layout:

```
app/
├── src/
│   ├── app/              ← Next.js routes (HTTP + UI layer)
│   │   ├── api/
│   │   ├── (auth)/
│   │   └── (member)/
│   ├── components/
│   │   └── ui/           ← shadcn components
│   ├── lib/              ← business logic (framework-agnostic)
│   │   ├── mentorship/
│   │   ├── profile/
│   │   ├── search/
│   │   ├── invite/
│   │   └── events/
│   ├── db/               ← typed Supabase wrappers
│   │   ├── client.ts
│   │   └── server.ts
│   └── notify/           ← email / push wrappers
│       └── resend.ts
└── ...
```

Create the folders now, even empty. Much harder to introduce the discipline after five features are built the wrong way.

## Step 6: The `/lib` discipline

See `../presentations/lib-pattern-slides.html` for the full walkthrough.

**One-sentence rule:** route handlers and server actions only do four things — parse input, check auth, call a `/lib` function, map the result to a response. Every business rule lives in `/lib`.

Skeleton to copy for the first real feature:

```typescript
// src/lib/help/createDirectAsk.ts
import type { DbClient } from '@/db/types'
import type { Notifier } from '@/notify/types'

export type CreateDirectAskInput = {
  askerMembershipId: string
  recipientMembershipId: string
  question: string
  message: string
  requestKey: string
}

export type CreateDirectAskResult =
  | { ok: true; askId: string }
  | { ok: false; error: 'recipient_closed' | 'slot_limit_reached' | 'not_found' }

export async function createDirectAsk(
  input: CreateDirectAskInput,
  deps: { db: DbClient; notify: Notifier }
): Promise<CreateDirectAskResult> {
  // The v2 command function owns the invariants that must hold atomically:
  // the five-active-Ask cap, one-direct-recipient, and publish-time immutability.
  // This layer shapes input, maps the outcome, and queues follow-up work.
  const created = await deps.db.help.createDirectAsk(input)
  if (!created.ok) return { ok: false, error: created.error }

  await deps.notify.askCreated(created.recipientEmail, created.ask)
  return { ok: true, askId: created.ask.id }
}
```

```typescript
// src/app/api/help/asks/route.ts
import { createDirectAsk } from '@/lib/help/createDirectAsk'
import { db } from '@/db/server'
import { notify } from '@/notify/resend'
import { requireSession } from '@/lib/auth/session'
import { createDirectAskSchema } from '@/lib/help/schemas'

export async function POST(req: Request) {
  const session = await requireSession()
  const input = createDirectAskSchema.parse(await req.json())
  const result = await createDirectAsk(
    { ...input, askerMembershipId: session.membershipId },
    { db, notify }
  )
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 })
  return Response.json({ askId: result.askId })
}
```

Two things this skeleton is deliberately showing beyond the four-step rule:
Help actions are **membership-scoped**, never user-scoped (`session.membershipId`,
not `session.userId`); and transactional invariants live in the v2 SQL command
function, not in TypeScript — a cap checked in application code is a race
condition. The real modules are under `app/src/lib/help/`; treat those as
canonical over this illustration.

## Step 7: Deploy to Railway

1. Push current state to GitHub `main`
2. railway.app → New Project → Deploy from GitHub
3. Select BridgeCircle repo; set root directory to `app`
4. Add env vars (copy values from `.env.local`)
5. Railway builds and gives you a URL — verify it serves the default Next.js page

Don't skip this. Deploying on day 0 surfaces DNS, build-config, and env-var issues while the app is empty. Much cheaper than finding them in week 4.

## Step 8: Sentry

```bash
cd app
pnpm dlx @sentry/wizard@latest -i nextjs
```

Follow the prompts. Production errors will now surface in Sentry instead of failing silently.

## Step 9: Biome config

`app/biome.json`:

```json
{
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2 },
  "linter": { "enabled": true, "rules": { "recommended": true } },
  "organizeImports": { "enabled": true }
}
```

Format once: `pnpm biome format --write .`

## Step 10: First commit

```bash
cd ~/Desktop/BridgeCircle
git add app/ docs/runbooks/day-0-setup.md docs/presentations/lib-pattern-slides.html
git commit -m "Day 0: scaffold Next.js + Supabase + deploy"
git push
```

## Verification checklist

By end of day 0:

- [ ] `pnpm dev` runs at localhost:3000
- [ ] Railway URL serves the default Next.js page
- [ ] Supabase project exists; Google OAuth provider enabled
- [ ] `.env.local` and Railway env vars both have Supabase keys
- [ ] `/lib`, `/db`, `/notify` directories exist (even if empty)
- [ ] Sentry captures a test error (throw something, confirm it shows in the Sentry dashboard)
- [ ] Biome runs without errors
- [ ] everything committed and pushed

## What NOT to do on day 0

- Don't design the schema (day 2)
- Don't write features (day 4+)
- Don't polish visuals (week 4)
- Don't install anything from the "when needed" list

If you finish day 0 faster than expected — stop. Day 1 starts on the schema migrations.

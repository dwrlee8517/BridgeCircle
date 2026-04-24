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

See `lib-pattern-slides.html` in this folder for the full walkthrough.

**One-sentence rule:** route handlers and server actions only do four things — parse input, check auth, call a `/lib` function, map the result to a response. Every business rule lives in `/lib`.

Skeleton to copy for the first real feature:

```typescript
// src/lib/mentorship/createRequest.ts
import type { DbClient } from '@/db/types'
import type { Notifier } from '@/notify/types'

export type CreateRequestInput = {
  menteeId: string
  mentorId: string
  reason: string
  helpNeeded: string
}

export type CreateRequestResult =
  | { ok: true; requestId: string }
  | { ok: false; error: 'mentor_closed' | 'mentor_full' | 'not_found' }

export async function createMentorshipRequest(
  input: CreateRequestInput,
  deps: { db: DbClient; notify: Notifier }
): Promise<CreateRequestResult> {
  const mentor = await deps.db.profiles.findById(input.mentorId)
  if (!mentor) return { ok: false, error: 'not_found' }
  if (!mentor.mentor_open) return { ok: false, error: 'mentor_closed' }

  const pending = await deps.db.mentorshipRequests.countPending(input.mentorId)
  if (pending >= mentor.max_pending) return { ok: false, error: 'mentor_full' }

  const request = await deps.db.mentorshipRequests.create({ ...input, status: 'pending' })
  await deps.notify.mentorshipRequestCreated(mentor.email, request)
  return { ok: true, requestId: request.id }
}
```

```typescript
// src/app/api/mentorship/route.ts
import { createMentorshipRequest } from '@/lib/mentorship/createRequest'
import { db } from '@/db/server'
import { notify } from '@/notify/resend'
import { requireSession } from '@/lib/auth/session'
import { createRequestSchema } from '@/lib/mentorship/schemas'

export async function POST(req: Request) {
  const session = await requireSession()
  const input = createRequestSchema.parse(await req.json())
  const result = await createMentorshipRequest(
    { ...input, menteeId: session.userId },
    { db, notify }
  )
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 })
  return Response.json({ requestId: result.requestId })
}
```

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
git add app/ docs/day-0-setup.md docs/lib-pattern-slides.html
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

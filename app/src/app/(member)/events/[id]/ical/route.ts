import { NextResponse } from 'next/server'
import { createClient } from '@/db/server'
import { getAppOrigin } from '@/lib/auth/app-url'
import { requireSession } from '@/lib/auth/session'
import { buildIcal } from '@/lib/events/buildIcal'
import { getEvent } from '@/lib/events/getEvent'

/**
 * Returns a calendar invite (.ics) for one event. Routes through the
 * standard auth proxy + session check so unauthenticated users can't pull
 * event details by guessing IDs. RLS handles org-scope: members only see
 * events in orgs they belong to, so the getEvent call short-circuits when
 * the viewer doesn't have access.
 *
 * Filename: <slugified-title>.ics
 * Content-Type: text/calendar; charset=utf-8 — the value Apple/Google
 * Calendar actually look for. Some clients also want the
 * Content-Disposition: attachment so it triggers a download instead of
 * inlining as text.
 */
type Params = { id: string }

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  const session = await requireSession()
  const { id } = await ctx.params
  const supabase = await createClient()

  const event = await getEvent(supabase, id, session.userId)
  if (!event || event.isCanceled) {
    return new NextResponse('Not found', { status: 404 })
  }

  const origin = await getAppOrigin()
  const ics = buildIcal({
    uid: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    url: `${origin}/events/${event.id}`,
  })

  // ASCII-only slug derived from title; max 60 chars.
  const slug =
    event.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'event'

  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}.ics"`,
      'Cache-Control': 'no-store',
    },
  })
}

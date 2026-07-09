import 'server-only'
import { headers } from 'next/headers'

/**
 * Returns the public origin of the app (e.g. "https://bridgecircle.org" in
 * prod, "http://localhost:3001" in dev). Use this when constructing OAuth
 * redirectTo URLs and other absolute URLs that point back at the app.
 *
 * Why not just `new URL(request.url).origin`? On Railway the container runs
 * on internal port 8080, so request.url often resolves to
 * "http://localhost:8080" rather than the public domain. Same problem with
 * h.get('origin') — it can be missing or wrong depending on how the request
 * arrived. This helper checks the explicit env var first (which Railway and
 * Vercel both let you set), then falls back to forwarded-host headers.
 */
export async function getAppOrigin(): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL
  if (envUrl) {
    return envUrl.replace(/\/$/, '')
  }

  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  if (host) {
    const proto = h.get('x-forwarded-proto') ?? 'http'
    return `${proto}://${host}`
  }

  return 'http://localhost:3001'
}

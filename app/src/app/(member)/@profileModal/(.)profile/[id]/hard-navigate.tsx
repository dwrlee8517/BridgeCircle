'use client'

import { useEffect } from 'react'

/**
 * Escape hatch for the profile modal interceptor. Route interception is
 * structural — `(.)profile/[id]` also captures soft navigations to
 * `/profile/me`, which is a page of its own, not a member id. A soft
 * redirect would just re-enter the interceptor, so break the loop with a
 * full document load, which interception never sees.
 */
export function HardNavigate({ href }: { href: string }) {
  useEffect(() => {
    window.location.replace(href)
  }, [href])
  return null
}

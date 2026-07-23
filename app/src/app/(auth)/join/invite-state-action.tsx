'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

export function InviteStateAction({ accepted }: { accepted: boolean }) {
  const actionRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    actionRef.current?.focus()
  }, [])

  return (
    <Button
      asChild
      variant={accepted ? 'default' : 'outline'}
      className={
        accepted
          ? 'h-11 w-full bg-[var(--action-primary-pressed)] hover:bg-[var(--action-primary-pressed)]'
          : 'h-11 w-full'
      }
    >
      <Link ref={actionRef} href="/sign-in">
        {accepted ? 'Sign in' : 'Back to sign in'}
      </Link>
    </Button>
  )
}

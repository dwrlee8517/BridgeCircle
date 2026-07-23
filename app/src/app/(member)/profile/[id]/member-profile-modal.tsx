'use client'

import { useRouter } from 'next/navigation'
import { type ReactNode, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

export function MemberProfileModal({ name, children }: { name: string; children: ReactNode }) {
  const router = useRouter()
  const [returnFocusTarget] = useState<HTMLElement | null>(() => {
    if (typeof document === 'undefined') return null
    const storedId = sessionStorage.getItem('bridgecircle:profile-return-focus')
    const storedTarget = storedId ? document.getElementById(storedId) : null
    return (
      storedTarget ??
      (document.activeElement instanceof HTMLElement ? document.activeElement : null)
    )
  })

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) router.back()
      }}
    >
      <DialogContent
        overlayClassName="bg-[var(--scrim)] backdrop-blur-none"
        className="top-0 right-0 bottom-0 left-auto flex h-dvh w-full max-w-full translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none p-0 sm:max-w-[460px] data-open:slide-in-from-right-full data-open:zoom-in-100 data-closed:slide-out-to-right-full data-closed:zoom-out-100"
        onCloseAutoFocus={(event) => {
          const target = returnFocusTarget
          if (!target) return
          event.preventDefault()
          window.setTimeout(() => {
            if (target.isConnected) target.focus()
            sessionStorage.removeItem('bridgecircle:profile-return-focus')
          }, 0)
        }}
      >
        <div className="flex min-h-13 shrink-0 items-center border-b border-[var(--divider-row)] bg-card px-5 pr-13">
          <DialogTitle className="truncate text-sm font-bold">{name}</DialogTitle>
          <DialogDescription className="sr-only">
            Profile details and relationship actions for {name}.
          </DialogDescription>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </DialogContent>
    </Dialog>
  )
}

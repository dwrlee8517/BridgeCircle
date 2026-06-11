'use client'

import { XIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { Button } from '@/components/ui/button'

/**
 * Side-panel shell for the intercepted composer. Closing (X, Esc, overlay
 * click) walks history back to the page the member was on — usually the
 * ask results they were choosing from.
 */
export function ComposerSheet({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter()

  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(open) => {
        if (!open) router.back()
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 isolate z-50 bg-surface-ink/45 duration-medium ease-emphasized supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Content
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[460px] flex-col border-border border-l bg-background shadow-hero outline-none duration-medium ease-emphasized data-open:animate-in data-open:slide-in-from-right-full data-closed:animate-out data-closed:slide-out-to-right-full"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between gap-3 border-border border-b px-5 py-3.5">
            <DialogPrimitive.Title className="font-heading text-lg font-semibold leading-tight text-foreground">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Close composer">
                <XIcon className="size-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

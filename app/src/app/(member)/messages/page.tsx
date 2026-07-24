import { MessageCircle } from 'lucide-react'
import { CirclesMotif } from '@/components/ui/circles-motif'

export default function MessagesPage() {
  return (
    <div className="relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden bg-[var(--surface-thread)] px-8 text-center">
      <CirclesMotif className="absolute top-1/2 left-1/2 h-52 w-80 -translate-x-1/2 -translate-y-[62%] text-muted-foreground opacity-[0.1]" />
      <h1 className="sr-only">Messages</h1>
      <div className="relative max-w-sm">
        <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-surface-subtle text-muted-foreground">
          <MessageCircle aria-hidden className="size-5" />
        </span>
        <p className="mt-3 text-sm font-bold text-foreground">Your conversations, together</p>
        <p className="mt-1.5 text-caption leading-relaxed text-text-secondary">
          Choose a conversation to pick up where you left off.
        </p>
      </div>
    </div>
  )
}

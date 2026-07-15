import { MessageCircle } from 'lucide-react'

export default function MessagesPage() {
  return (
    <div className="flex min-h-0 w-full flex-1 items-center justify-center bg-[var(--surface-thread)] px-8 text-center">
      <h1 className="sr-only">Messages</h1>
      <div className="max-w-sm">
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

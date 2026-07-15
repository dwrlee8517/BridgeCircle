import { MessageCircle } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

export default function MessagesPage() {
  return (
    <div className="mx-auto flex min-h-full max-w-3xl items-center px-4 py-10 sm:px-8">
      <h1 className="sr-only">Messages</h1>
      <EmptyState
        icon={MessageCircle}
        title="Open a conversation from Help"
        description="When an ask is accepted, its status page opens the conversation here. The complete conversation list is the next Messages slice."
        action={{ label: 'View your asks', href: '/help/asks' }}
      />
    </div>
  )
}

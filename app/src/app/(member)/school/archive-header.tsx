import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export function ArchiveHeader({ title }: { title: string }) {
  return (
    <header className="border-b border-divider-row bg-surface-card px-4 py-3 sm:px-7">
      <div className="mx-auto flex max-w-[1060px] items-center gap-3">
        <Link
          href="/school"
          aria-label="Back to School"
          className="flex size-9 items-center justify-center rounded-full bg-surface-subtle text-text-secondary hover:bg-primary-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </Link>
        <h1 className="truncate text-body font-extrabold text-text-primary">{title}</h1>
      </div>
    </header>
  )
}

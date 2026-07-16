import Link from 'next/link'

export default function SchoolNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-surface-canvas px-5">
      <div className="max-w-md rounded-2xl bg-surface-card p-7 text-center shadow-card ring-1 ring-border-subtle">
        <h1 className="text-body font-extrabold text-text-primary">
          This School item is not available
        </h1>
        <p className="mt-2 text-caption leading-relaxed text-text-secondary">
          It may have moved, or it may belong to another circle.
        </p>
        <Link
          href="/school"
          className="mt-5 inline-block rounded-xl bg-action-primary-pressed px-4 py-2.5 text-caption font-bold text-action-on-primary"
        >
          Back to School
        </Link>
      </div>
    </div>
  )
}

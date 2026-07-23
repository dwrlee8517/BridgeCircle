import { Skeleton } from '@/components/ui/skeleton'

const SETTINGS_CARD_SKELETONS = [
  { id: 'account', height: 260 },
  { id: 'notifications', height: 390 },
  { id: 'helping', height: 220 },
  { id: 'blocked', height: 120 },
] as const

export default function SettingsLoading() {
  return (
    <div
      className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-8 sm:px-8"
      role="status"
      aria-label="Loading settings"
    >
      <div>
        <Skeleton className="h-3 w-28 rounded-full" />
        <Skeleton className="mt-2 h-8 w-40" />
        <Skeleton className="mt-3 h-4 w-[420px] max-w-[90%] rounded-full" />
      </div>
      {SETTINGS_CARD_SKELETONS.map(({ id, height }) => (
        <Skeleton key={id} className="w-full rounded-[var(--radius-card-xl)]" style={{ height }} />
      ))}
    </div>
  )
}

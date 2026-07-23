import { ArrowRight, Check, UserRound } from 'lucide-react'
import Link from 'next/link'
import { Wordmark } from '@/components/ui/wordmark'

export function OnboardingComplete({
  name,
  organizationName,
}: {
  name: string
  organizationName: string
}) {
  const firstName = name.split(/\s+/)[0] || name

  return (
    <main className="relative flex min-h-dvh items-center overflow-hidden bg-[var(--cover-ink)] bg-[image:var(--cover-event)] px-5 py-12 text-white sm:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-28 size-[500px] rounded-full border border-white/10"
      />
      <section className="relative mx-auto w-full max-w-[620px] text-center">
        <Wordmark
          variant="editorial"
          withIcon
          textClassName="text-xl text-white"
          className="justify-center"
        />
        <span className="mx-auto mt-14 inline-flex size-14 items-center justify-center rounded-full bg-white/10 text-[var(--cover-accent)] shadow-[inset_0_0_0_1px_rgb(255_255_255_/_0.12)]">
          <Check aria-hidden className="size-7" />
        </span>
        <p className="mt-6 text-xs font-bold tracking-hero text-[var(--cover-accent)] uppercase">
          You&apos;re in
        </p>
        <h1 className="font-heading mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          You&apos;re all set, {firstName}.
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed font-medium text-white/85">
          Your profile is live in {organizationName}. Your private Help draft and any hellos you
          sent are ready when you enter the circle.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-[var(--cover-ink)] shadow-lg hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Go to your dashboard
            <ArrowRight aria-hidden className="size-4" />
          </Link>
          <Link
            href="/profile/me"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white/10 px-6 text-sm font-bold text-white shadow-[inset_0_0_0_1px_rgb(255_255_255_/_0.14)] hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <UserRound aria-hidden className="size-4" />
            Review profile
          </Link>
        </div>
      </section>
    </main>
  )
}

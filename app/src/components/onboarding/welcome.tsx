import { ArrowRight, HandHeart, UserRound, WandSparkles } from 'lucide-react'
import { Wordmark } from '@/components/ui/wordmark'

export function OnboardingWelcome({ name, action }: { name: string; action: () => Promise<void> }) {
  const firstName = name.split(/\s+/)[0] || name

  return (
    <main className="relative flex min-h-dvh items-center overflow-hidden bg-[var(--cover-ink)] bg-[image:var(--cover-event)] px-5 py-12 text-white sm:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-24 size-[440px] rounded-full border border-white/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-44 -bottom-52 size-[620px] rounded-full border border-white/10"
      />
      <section className="relative mx-auto w-full max-w-[620px]">
        <Wordmark variant="editorial" withIcon textClassName="text-xl text-white" />
        <p className="mt-14 text-xs font-bold tracking-hero text-[var(--cover-accent)] uppercase">
          Welcome to your circle
        </p>
        <h1 className="font-heading mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Welcome, {firstName}.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed font-medium text-white/85">
          A few quick steps, about two minutes. Your profile starts with what your school already
          knows, and you decide what the circle sees.
        </p>

        <div className="mt-9 grid gap-3">
          <Phase
            icon={UserRound}
            number="1"
            title="You"
            detail="Confirm your name and class year"
          />
          <Phase
            icon={WandSparkles}
            number="2"
            title="Your experience"
            detail="Review education, career, and skills"
          />
          <Phase
            icon={HandHeart}
            number="3"
            title="Help and connect"
            detail="Choose how you want to take part"
          />
        </div>

        <form action={action} className="mt-9">
          <button
            type="submit"
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-[var(--cover-ink)] shadow-lg transition hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:w-auto"
          >
            Get started
            <ArrowRight aria-hidden className="size-4" />
          </button>
        </form>
        <p className="mt-4 text-xs font-medium text-white/75">
          Your details stay within your verified school circle.
        </p>
      </section>
    </main>
  )
}

function Phase({
  icon: Icon,
  number,
  title,
  detail,
}: {
  icon: typeof UserRound
  number: string
  title: string
  detail: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white/[0.08] px-4 py-3.5 shadow-[inset_0_0_0_1px_rgb(255_255_255_/_0.09)] backdrop-blur-sm">
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-[var(--cover-accent)]">
        <Icon aria-hidden className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">
          {number}. {title}
        </span>
        <span className="mt-0.5 block text-xs font-medium text-white/80">{detail}</span>
      </span>
    </div>
  )
}

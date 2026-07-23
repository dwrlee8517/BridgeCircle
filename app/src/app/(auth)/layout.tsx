import { Wordmark } from '@/components/ui/wordmark'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[0.9fr_1.1fr]">
      <section
        aria-label="About BridgeCircle"
        className="relative hidden overflow-hidden bg-surface-ink p-10 text-surface-ink-foreground lg:flex lg:flex-col lg:justify-between"
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(rgba(250,250,249,0.10) 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px',
          }}
        />
        <svg
          aria-hidden="true"
          role="presentation"
          viewBox="0 0 520 380"
          className="absolute -right-28 top-10 h-[380px] w-[520px] opacity-20"
        >
          <title>Decorative two-circle motif</title>
          <circle cx="200" cy="190" r="140" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle
            cx="320"
            cy="190"
            r="140"
            fill="none"
            stroke="var(--primary-on-dark)"
            strokeWidth="1.5"
          />
        </svg>

        <div className="relative">
          <Wordmark variant="editorial" withIcon={false} textClassName="text-2xl tracking-tight" />
        </div>
        <div className="relative max-w-md">
          <p className="text-kicker font-semibold uppercase tracking-hero text-primary-on-dark">
            Verified school circle
          </p>
          <h1 className="font-heading mt-3 text-5xl font-bold leading-[1.05] tracking-tight">
            Build from a circle you already trust.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-surface-ink-muted">
            Real help, referrals, events, and local connection for verified communities.
          </p>
        </div>
      </section>
      <main className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md text-base">{children}</div>
      </main>
    </div>
  )
}

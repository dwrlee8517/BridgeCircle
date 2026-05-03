export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[0.9fr_1.1fr]">
      <section className="relative hidden overflow-hidden bg-[linear-gradient(135deg,#0b1220_0%,#131b2e_55%,#1e293b_100%)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: 'radial-gradient(rgba(180,197,255,0.10) 1.5px, transparent 1.5px)',
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
          <circle cx="200" cy="190" r="140" fill="none" stroke="#b4c5ff" strokeWidth="1.5" />
          <circle cx="320" cy="190" r="140" fill="none" stroke="#316bf3" strokeWidth="1.5" />
        </svg>

        <div className="relative">
          <p className="bc-fraunces text-2xl font-bold tracking-[-0.025em]">
            Bridge<span className="text-[#b4c5ff]">Circle</span>
          </p>
        </div>
        <div className="relative max-w-md">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b4c5ff]">
            Verified Alumni Network
          </p>
          <h1
            className="bc-fraunces mt-3 text-5xl font-bold leading-[1.05] tracking-[-0.025em]"
            style={{ fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 25' }}
          >
            Build from a circle you already trust.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            Mentorship, referrals, events, and local connection for verified communities.
          </p>
        </div>
      </section>
      <main className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md text-base">{children}</div>
      </main>
    </div>
  )
}

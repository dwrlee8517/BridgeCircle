import Link from 'next/link'
import { Button } from '@/components/ui/button'

// Renders inside the root layout (no member header, no auth shell), so this
// page has to be self-contained: wordmark + headline + recovery links. Both
// links are present so the page works for signed-in (Home) and signed-out
// (Sign in) viewers without checking the session.
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12 text-center">
      <Link href="/" className="mb-10" aria-label="BridgeCircle home">
        <span className="bc-fraunces text-2xl font-bold tracking-[-0.025em] text-foreground">
          Bridge<span className="text-primary">Circle</span>
        </span>
      </Link>

      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Page not found
      </p>
      <h1 className="font-heading mt-3 max-w-xl text-4xl font-bold tracking-[-0.025em] text-foreground sm:text-5xl">
        That page isn&rsquo;t in the circle.
      </h1>
      <p className="mt-4 max-w-md text-base text-muted-foreground">
        The link may be old, or the page may have moved during a recent reorg.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </div>
    </main>
  )
}

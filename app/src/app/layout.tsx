import type { Metadata, Viewport } from 'next'
import { Fraunces, Geist_Mono, Manrope } from 'next/font/google'
import './globals.css'

// Body font. See docs/ui/mockups/font-options.html for alternatives + the 3-line
// swap. The variable name `--font-sans` is what shadcn / Tailwind utilities
// resolve to; keeping that stable means future swaps only touch this import.
const sans = Manrope({
  variable: '--font-sans',
  subsets: ['latin'],
})

// Editorial serif voice — wordmark, profile-card names, footer microcopy.
// Apply via the `.bc-fraunces` class. Never use for body or buttons.
const serif = Fraunces({
  variable: '--font-serif',
  subsets: ['latin'],
  axes: ['SOFT', 'WONK', 'opsz'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'BridgeCircle',
  description: 'A verified alumni network.',
}

// Required for proper mobile rendering — without this iOS Safari renders the
// page at desktop scale and zooms out. `width=device-width, initial-scale=1`
// is the modern default; we don't disable user zoom (accessibility).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // suppressHydrationWarning on <html> and <body> ignores attribute-level
  // hydration mismatches caused by browser extensions (ClickUp, Grammarly,
  // ColorZilla, etc.) that inject classes/attributes on these elements
  // before React hydrates. It does not silence real hydration bugs deeper
  // in the tree.
  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}

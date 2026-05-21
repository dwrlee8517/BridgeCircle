import type { Metadata, Viewport } from 'next'
import { Fraunces, Inter, Inter_Tight, JetBrains_Mono } from 'next/font/google'
import './globals.css'

// Body font. See docs/experience/ui/design-system/ for the active typography direction.
// The variable name `--font-sans` is what shadcn / Tailwind utilities resolve to.
const sans = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
})

// Display heading font for modern editorial look.
const display = Inter_Tight({
  variable: '--font-display',
  subsets: ['latin'],
})

// Editorial serif voice — wordmark, profile-card names, footer microcopy.
const serif = Fraunces({
  variable: '--font-serif',
  subsets: ['latin'],
  axes: ['SOFT', 'WONK', 'opsz'],
})

// Monospace font for system metadata, dates, and technical details.
const mono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'BridgeCircle',
  description: 'A verified alumni network.',
}

// Required for proper mobile rendering — without this iOS Safari renders the
// page at desktop scale and zooms out.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${serif.variable} ${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}

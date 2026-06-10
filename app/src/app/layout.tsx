import type { Metadata, Viewport } from 'next'
import { Inter, Inter_Tight, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import './globals.css'

// Type system: Inter Tight (display) + Inter (body) + JetBrains Mono (meta).
// Three sans/mono families, no serif. Matches the Civic Editorial spec
// documented in docs/experience/ui/design-system/tokens.md.
//
// The IBM Plex full-system swap (2026-05-24 morning) was reverted the
// same day because it replaced Inter Tight on hero h1s, changing
// surfaces the user never intended to change. See
// docs/font_explorations_may24_companies_claude.html for the considered
// alternatives that document the reasoning.

// Body font. The variable name `--font-sans` is what shadcn / Tailwind
// utilities resolve to.
const sans = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
})

// Display heading font for the modern editorial look — used via the
// `font-heading` Tailwind utility on hero h1s and section h2s.
const display = Inter_Tight({
  variable: '--font-display',
  subsets: ['latin'],
})

// Monospace for system metadata, dates, and technical details.
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
      className={`${sans.variable} ${display.variable} ${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {/* Dark tokens live in globals.css `.dark`; next-themes applies the
            class from the OS preference by default, with a manual override
            in the account menu. */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

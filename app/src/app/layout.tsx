import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

// Type system (Field Pro / ADR 0012 D4): one family — Pretendard. Self-hosted
// via next/font/local, no runtime CDN. Inter / Inter Tight / JetBrains Mono
// retire; the display + mono aliases fold to Pretendard in globals.css
// (--font-display / --font-mono → var(--font-sans)), so the ~10 `font-heading`
// call sites and mono metadata keep working; data uses `tabular-nums`.
//
// The vendored woff2 is a LATIN-ONLY subset of the Pretendard variable font
// (weight axis 45–930) — no Hangul / CJK glyphs (English-only, per Richard).
// Regenerate with pyftsubset from `pretendard`'s PretendardVariable.ttf if the
// covered ranges ever need to change. 100 KB vs. the 2 MB full Hangul build.
const pretendard = localFont({
  src: './fonts/PretendardLatinVar.woff2',
  variable: '--font-sans',
  weight: '45 930',
  display: 'swap',
  fallback: [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'sans-serif',
  ],
})

export const metadata: Metadata = {
  title: 'BridgeCircle',
  description: 'A verified school circle.',
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
      className={`${pretendard.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}

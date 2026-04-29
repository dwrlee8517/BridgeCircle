import type { Metadata } from 'next'
import { Geist_Mono, Manrope } from 'next/font/google'
import './globals.css'

// Body font. See docs/font-options-mockup.html for alternatives + the 3-line
// swap. The variable name `--font-sans` is what shadcn / Tailwind utilities
// resolve to; keeping that stable means future swaps only touch this import.
const sans = Manrope({
  variable: '--font-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'BridgeCircle',
  description: 'A verified alumni network.',
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
      className={`${sans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}

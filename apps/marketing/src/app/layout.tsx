import type { Metadata } from 'next'
import { Inter, Lora, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const lora = Lora({ subsets: ['latin'], variable: '--font-lora', display: 'swap' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' })

export const metadata: Metadata = {
  title: 'Fountem — Evidence-backed political intelligence for the UK',
  description:
    '1 in 3 UK voters saw political deepfakes before the 2026 elections. Unfaked detects them. Fountem explains them. Verifiable truth, in public.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-parchment font-sans text-ink antialiased">{children}</body>
    </html>
  )
}

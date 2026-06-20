import type { Metadata } from 'next'
import { Inter, Lora, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Analytics } from '../components/Analytics'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const lora = Lora({ subsets: ['latin'], variable: '--font-lora', display: 'swap' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'Fountem — Political Intelligence Platform', template: '%s | Fountem' },
  description: 'Evidence-backed fact-checking for UK politics. Every verdict cites its primary source.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_FOUNTEM_URL ?? 'https://fountem.ai'),
  openGraph: { type: 'website', locale: 'en_GB', siteName: 'Fountem' },
  twitter: { card: 'summary_large_image', site: '@fountem_ai' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-parchment font-sans text-ink antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}

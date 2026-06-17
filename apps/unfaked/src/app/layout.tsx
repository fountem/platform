import type { Metadata } from 'next'
import { Inter, Lora, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const lora = Lora({ subsets: ['latin'], variable: '--font-lora', display: 'swap' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'Unfaked — AI Video Detection', template: '%s | Unfaked' },
  description: 'Detect AI-generated and deepfake political videos. Evidence-backed verdicts that show their working.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://unfaked.ai'),
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: 'Unfaked',
    images: [{ url: '/og-default.png', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', site: '@unfaked' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-parchment font-sans text-ink antialiased">{children}</body>
    </html>
  )
}

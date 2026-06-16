import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Unfaked — AI Video Detection', template: '%s | Unfaked' },
  description: 'Detect AI-generated and deepfake political videos. Free, instant, evidence-backed.',
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
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[#0a0a0a]">
        <nav className="border-b border-zinc-800 bg-[#0a0a0a]/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <span className="text-red-500 font-bold text-xl tracking-tight">Unfaked</span>
              <span className="text-zinc-600 text-xs uppercase tracking-widest hidden sm:block">by Fountem</span>
            </a>
            <div className="flex items-center gap-6">
              <a href="/cases" className="text-zinc-400 hover:text-zinc-200 text-sm transition-colors">Archive</a>
              <a href="/methodology" className="text-zinc-400 hover:text-zinc-200 text-sm transition-colors">How it works</a>
              <a href="https://fountem.ai" className="text-zinc-400 hover:text-zinc-200 text-sm transition-colors hidden sm:block">Fountem →</a>
            </div>
          </div>
        </nav>
        <main>{children}</main>
        <footer className="border-t border-zinc-800 mt-24 py-12">
          <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-zinc-500 text-sm">
              © 2026 Fountem Ltd · <a href="https://fountem.ai" className="hover:text-zinc-300">fountem.ai</a>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <a href="/methodology" className="hover:text-zinc-300">Methodology</a>
              <a href="mailto:press@unfaked.ai" className="hover:text-zinc-300">Press</a>
              <a href="https://twitter.com/unfaked" className="hover:text-zinc-300">@unfaked</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Fountem — Political Intelligence Platform', template: '%s | Fountem' },
  description: 'Evidence-backed fact-checking for UK politics. Every verdict cites its primary source.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_FOUNTEM_URL ?? 'https://fountem.ai'),
  openGraph: { type: 'website', locale: 'en_GB', siteName: 'Fountem' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[#0a0f1e]">
        <nav className="border-b border-zinc-800 bg-[#0a0f1e]/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <span className="text-blue-400 font-bold text-xl tracking-tight">Fountem</span>
              <span className="text-zinc-600 text-xs uppercase tracking-widest hidden sm:block">Political Intelligence</span>
            </a>
            <div className="flex items-center gap-6">
              <a href="/check" className="text-zinc-400 hover:text-zinc-200 text-sm transition-colors">Check a claim</a>
              <a href="/parties" className="text-zinc-400 hover:text-zinc-200 text-sm transition-colors">Parties</a>
              <a href="https://unfaked.ai" className="text-zinc-400 hover:text-zinc-200 text-sm transition-colors hidden sm:block">Unfaked →</a>
            </div>
          </div>
        </nav>
        <main>{children}</main>
        <footer className="border-t border-zinc-800 mt-24 py-12">
          <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-zinc-500 text-sm">© 2026 Fountem Ltd</div>
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <a href="/methodology" className="hover:text-zinc-300">Methodology</a>
              <a href="/api-docs" className="hover:text-zinc-300">API</a>
              <a href="https://unfaked.ai" className="hover:text-zinc-300">Unfaked</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
